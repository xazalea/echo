'use client';

import { useEffect, useRef, useState } from 'react'
import type { Message, User } from '@/lib/types'

interface PollingState {
  messages: Message[]
  typingUsers: User[]
  onlineUsers: User[]
  isConnected: boolean
}

interface UsePollingOptions {
  roomCode: string
  userId: string
  enabled?: boolean
  interval?: number
}

export function usePolling({ roomCode, userId, enabled = true, interval = 2000 }: UsePollingOptions) {
  const [state, setState] = useState<PollingState>({
    messages: [],
    typingUsers: [],
    onlineUsers: [],
    isConnected: true, // Start as connected, only set to false on actual errors
  })
  const [isLoading, setIsLoading] = useState(true)
  const lastMessageIdRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  const poll = async () => {
    try {
      const params = new URLSearchParams({
        roomCode,
        userId,
      })

      if (lastMessageIdRef.current) {
        params.append('lastMessageId', lastMessageIdRef.current)
      }

      const response = await fetch(`/api/poll?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.success) {
        retryCountRef.current = 0 // Reset retry count on success
        setState((prev) => {
          // Update last message ID
          if (data.messages.length > 0) {
            lastMessageIdRef.current = data.messages[data.messages.length - 1].id
            
            // Merge new messages with existing ones, avoiding duplicates
            const existingIds = new Set(prev.messages.map((m) => m.id))
            const newMessages = data.messages.filter((m: Message) => !existingIds.has(m.id))
            
            return {
              messages: [...prev.messages, ...newMessages],
              typingUsers: data.typingUsers || [],
              onlineUsers: data.onlineUsers || [],
              isConnected: true,
            }
          }

          return {
            ...prev,
            typingUsers: data.typingUsers || [],
            onlineUsers: data.onlineUsers || [],
            isConnected: true,
          }
        })
        setIsLoading(false)
      } else {
        // If room not found, still allow connection but show error
        if (data.error?.includes('not found')) {
          setState((prev) => ({ ...prev, isConnected: false }))
        }
      }
    } catch (error) {
      console.error('[v0] Polling error:', error)
      retryCountRef.current += 1
      
      // Only mark as disconnected after multiple failures
      if (retryCountRef.current >= 3) {
        setState((prev) => ({ ...prev, isConnected: false }))
      }
    }
  }

  // Initial load
  useEffect(() => {
    if (!enabled) return

    poll()
  }, [roomCode, userId, enabled])

  // Set up polling interval
  useEffect(() => {
    if (!enabled) return

    pollingIntervalRef.current = setInterval(poll, interval)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [roomCode, userId, enabled, interval])

  const sendMessage = async (content: string, type = 'text') => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userId,
          username: localStorage.getItem(`echo_username_${roomCode}`) || 'Anonymous',
          content,
          type,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Immediately add the message to state
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, data.message],
        }))

        // If there's an AI response, add it too
        if (data.aiResponse) {
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, data.aiResponse],
            }))
          }, 500)
        }

        // Update last message ID
        lastMessageIdRef.current = data.message.id

        // Trigger immediate poll for other users' updates
        poll()
      }

      return data
    } catch (error) {
      console.error('[v0] Send message error:', error)
      throw error
    }
  }

  const updateTyping = async (isTyping: boolean) => {
    try {
      await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userId,
          username: localStorage.getItem(`echo_username_${roomCode}`) || 'Anonymous',
          isTyping,
        }),
      })
    } catch (error) {
      console.error('[v0] Update typing error:', error)
    }
  }

  const editMessage = async (messageId: string, content: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content }),
      })

      const data = await response.json()

      if (data.success) {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === messageId ? { ...m, content, edited_at: data.message.edited_at } : m
          ),
        }))
      }

      return data
    } catch (error) {
      console.error('[v0] Edit message error:', error)
      throw error
    }
  }

  const clipMessage = async (messageId: string, messageContent: string, originalUsername: string) => {
    try {
      const response = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          messageId,
          messageContent,
          originalUsername,
          roomCode,
        }),
      })

      return await response.json()
    } catch (error) {
      console.error('[v0] Clip message error:', error)
      throw error
    }
  }

  return {
    ...state,
    isLoading,
    sendMessage,
    updateTyping,
    editMessage,
    clipMessage,
    refresh: poll,
  }
}
