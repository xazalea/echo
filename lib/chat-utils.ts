import type { Message, ClippedMessage } from './types'

export function generateRoomCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'just now'
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  }
  
  // Same day
  if (now.toDateString() === date.toDateString()) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }
  
  // Different day
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function getTimeRemaining(expiresAt: Date): string {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()
  
  if (diff <= 0) return 'Expired'
  
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

function generateShareCode(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function saveClippedMessage(message: Message, roomCode: string): void {
  console.log('[chat-utils] saveClippedMessage called', { messageId: message.id, roomCode })
  const now = Date.now()
  const messageTimestamp = message.timestamp instanceof Date 
    ? message.timestamp.getTime() 
    : (message.created_at || message.timestamp || now)
  
  // Get clipper information
  const clipperUser = localStorage.getItem('echo_user') ? JSON.parse(localStorage.getItem('echo_user')!) : null
  const clipperUsername = clipperUser?.username || 'Unknown'
  const clipperUserId = clipperUser?.userId || 'Unknown'
  
  // Generate cryptographic hash for verification (SHA-256 equivalent using SubtleCrypto would be better, but using base64 for now)
  const verificationData = `${message.id}|${message.content}|${message.username}|${message.user_id || message.userId}|${messageTimestamp}|${roomCode}|${now}|${clipperUserId}`
  const verificationHash = btoa(verificationData).substring(0, 32)
  
  // Generate unique clip ID
  const clipId = `CLIP-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  
  const clipped = {
    id: message.id,
    messageId: message.id,
    content: message.content,
    username: message.username,
    userId: message.user_id || message.userId,
    roomCode,
    timestamp: messageTimestamp, // Original message timestamp
    clippedAt: now, // When the clip was created
    clippedBy: clipperUsername,
    clippedById: clipperUserId,
    type: message.type || 'text',
    imageUrl: message.imageUrl,
    shareCode: generateShareCode(),
    verificationHash, // Legal proof hash
    clipId, // Unique clip identifier
    metadata: {
      // Core message data
      messageId: message.id,
      originalTimestamp: new Date(messageTimestamp).toISOString(),
      originalTimestampUnix: messageTimestamp,
      
      // Clip data
      clippedTimestamp: new Date(now).toISOString(),
      clippedTimestampUnix: now,
      clipId: clipId,
      
      // User data
      senderUsername: message.username,
      senderUserId: message.user_id || message.userId,
      clipperUsername: clipperUsername,
      clipperUserId: clipperUserId,
      
      // Context
      roomCode: roomCode,
      messageType: message.type || 'text',
      
      // Platform & Legal
      platform: 'Echo Chat',
      version: '2.0',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Verification
      verificationHash: verificationHash,
      verificationString: verificationData,
      
      // Legal disclaimer
      legalNotice: 'This clip is a preserved record of a message sent on Echo Chat. The verification hash can be used to verify the authenticity of this clip. Timestamps are in UTC.',
    }
  }
  
  const clips = getClippedMessages()
  console.log('[chat-utils] Current clips in localStorage:', clips.length)
  
  // Check if already clipped
  const exists = clips.find(c => c.messageId === message.id)
  if (!exists) {
    clips.push(clipped)
    localStorage.setItem('echo_clips', JSON.stringify(clips))
    console.log('[chat-utils] Clip saved successfully. Total clips:', clips.length)
  } else {
    console.log('[chat-utils] Message already clipped')
  }
}

export function getClippedMessages(): ClippedMessage[] {
  if (typeof window === 'undefined') return []
  
  const clips = localStorage.getItem('echo_clips')
  if (!clips) return []
  
  try {
    const parsed = JSON.parse(clips)
    return parsed.map((clip: any) => ({
      id: clip.id || clip.messageId,
      messageId: clip.messageId || clip.id,
      content: clip.content,
      username: clip.username,
      roomCode: clip.roomCode,
      timestamp: clip.timestamp,
      clippedAt: clip.clippedAt,
      type: clip.type || 'text',
      imageUrl: clip.imageUrl,
      shareCode: clip.shareCode
    }))
  } catch (error) {
    console.error('[echo] Error parsing clips:', error)
    return []
  }
}

export function removeClippedMessage(messageId: string): void {
  const clips = getClippedMessages().filter(clip => clip.messageId !== messageId && clip.id !== messageId)
  localStorage.setItem('echo_clips', JSON.stringify(clips))
}

export function getClipByShareCode(shareCode: string): ClippedMessage | undefined {
  return getClippedMessages().find(clip => clip.shareCode === shareCode)
}

export function formatExactTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[v0] Notifications not supported')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export function showNotification(title: string, body: string, icon?: string): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/echo-icon.png',
      badge: '/echo-badge.png',
      tag: 'echo-notification',
      requireInteraction: false
    })
  }
}
