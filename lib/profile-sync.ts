// Profile picture sync system using localStorage + API
// Pictures are stored locally and synced to API for other users to see

export interface ProfilePictureCache {
  [userId: string]: {
    dataUrl: string
    timestamp: number
  }
}

const CACHE_KEY = 'echo_profile_pictures'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export function getCachedProfilePicture(userId: string): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cache = localStorage.getItem(CACHE_KEY)
    if (!cache) return null
    
    const parsed: ProfilePictureCache = JSON.parse(cache)
    const entry = parsed[userId]
    
    if (!entry) return null
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      // Remove expired entry
      delete parsed[userId]
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed))
      return null
    }
    
    return entry.dataUrl
  } catch (error) {
    console.error('[ProfileSync] Error reading cache:', error)
    return null
  }
}

export function cacheProfilePicture(userId: string, dataUrl: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const cache = localStorage.getItem(CACHE_KEY)
    const parsed: ProfilePictureCache = cache ? JSON.parse(cache) : {}
    
    parsed[userId] = {
      dataUrl,
      timestamp: Date.now()
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed))
  } catch (error) {
    console.error('[ProfileSync] Error writing cache:', error)
  }
}

export async function syncProfilePicture(userId: string, dataUrl: string): Promise<boolean> {
  try {
    // Save to localStorage first
    cacheProfilePicture(userId, dataUrl)
    
    // Then sync to API for other users
    const response = await fetch('/api/profile-picture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, dataUrl }),
    })
    
    const data = await response.json() as { success: boolean }
    return data.success
  } catch (error) {
    console.error('[ProfileSync] Error syncing to API:', error)
    return false
  }
}

export async function fetchProfilePicture(userId: string): Promise<string | null> {
  // Check cache first
  const cached = getCachedProfilePicture(userId)
  if (cached) return cached
  
  // Fetch from API
  try {
    const response = await fetch(`/api/profile-picture?userId=${userId}`)
    const data = await response.json() as { success: boolean; picture?: { dataUrl: string } }
    
    if (data.success && data.picture) {
      // Cache for future use
      cacheProfilePicture(userId, data.picture.dataUrl)
      return data.picture.dataUrl
    }
    
    return null
  } catch (error) {
    console.error('[ProfileSync] Error fetching from API:', error)
    return null
  }
}

export function clearProfileCache(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CACHE_KEY)
}
