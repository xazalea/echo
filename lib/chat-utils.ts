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
  
  const clipped = {
    id: message.id,
    messageId: message.id,
    content: message.content,
    username: message.username,
    roomCode,
    timestamp: messageTimestamp, // Exact timestamp in milliseconds
    clippedAt: now, // Exact timestamp when clipped in milliseconds
    type: message.type || 'text',
    imageUrl: message.imageUrl,
    shareCode: generateShareCode()
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
