'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Message, User, TypingIndicator } from '@/lib/types'
import { showNotification } from '@/lib/chat-utils'

interface UseWebSocketProps {
  roomCode: string
  userId: string
  username: string
  onMessage?: (message: Message) => void
  onUserJoined?: (user: User) => void
  onUserLeft?: (userId: string) => void
  onTyping?: (typing: TypingIndicator) => void
}

export function useWebSocket({
  roomCode,
  userId,
  username,
  onMessage,
  onUserJoined,
  onUserLeft,
  onTyping
}: UseWebSocketProps) {
  const [connected, setConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  
  const connect = useCallback(() => {
    // In production, this would connect to your WebSocket server
    // For demo purposes, we'll simulate a connection
    console.log('[v0] WebSocket connecting to room:', roomCode)
    
    // Simulate connection
    setConnected(true)
    
    // Simulate receiving messages
    // In production: ws.current = new WebSocket(`wss://your-server.com/ws?room=${roomCode}&userId=${userId}`)
  }, [roomCode, userId])
  
  const sendMessage = useCallback((content: string, imageUrl?: string) => {
    if (!connected) {
      console.log('[v0] Not connected to WebSocket')
      return
    }
    
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username,
      content,
      timestamp: new Date(),
      imageUrl,
      clippedBy: []
    }
    
    // In production: ws.current?.send(JSON.stringify({ type: 'message', data: message }))
    console.log('[v0] Sending message:', message)
    onMessage?.(message)
    
    // Show notification for message sent
    if (document.hidden) {
      showNotification('echo.', `You sent: ${content}`)
    }
  }, [connected, userId, username, onMessage])
  
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!connected) return
    
    // In production: ws.current?.send(JSON.stringify({ type: 'typing', data: { isTyping } }))
    console.log('[v0] Typing indicator:', isTyping)
  }, [connected])
  
  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!connected) return
    
    // In production: ws.current?.send(JSON.stringify({ type: 'edit', data: { messageId, newContent } }))
    console.log('[v0] Editing message:', messageId, newContent)
  }, [connected])
  
  const toggleClip = useCallback((messageId: string, clipped: boolean) => {
    if (!connected) return
    
    // In production: ws.current?.send(JSON.stringify({ type: 'clip', data: { messageId, clipped } }))
    console.log('[v0] Clipping message:', messageId, clipped)
  }, [connected])
  
  useEffect(() => {
    connect()
    
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      ws.current?.close()
    }
  }, [connect])
  
  return {
    connected,
    sendMessage,
    sendTyping,
    editMessage,
    toggleClip
  }
}
