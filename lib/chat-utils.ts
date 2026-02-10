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

export function saveClippedMessage(message: Message, roomCode: string): void {
  const clipped: ClippedMessage = {
    ...message,
    roomCode,
    clippedAt: new Date()
  }
  
  const clips = getClippedMessages()
  clips.push(clipped)
  localStorage.setItem('echo_clips', JSON.stringify(clips))
}

export function getClippedMessages(): ClippedMessage[] {
  if (typeof window === 'undefined') return []
  
  const clips = localStorage.getItem('echo_clips')
  if (!clips) return []
  
  return JSON.parse(clips).map((clip: any) => ({
    ...clip,
    timestamp: new Date(clip.timestamp),
    clippedAt: new Date(clip.clippedAt)
  }))
}

export function removeClippedMessage(messageId: string): void {
  const clips = getClippedMessages().filter(clip => clip.id !== messageId)
  localStorage.setItem('echo_clips', JSON.stringify(clips))
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
