'use client';

import { useEffect, useRef, useState, useCallback } from 'react'
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
    isConnected: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const lastMessageIdRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  const poll = useCallback(async () => {
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
      
      const data = await response.json() as { 
        success: boolean
        messages?: any[]
        typingUsers?: any[]
        onlineUsers?: any[]
        error?: string
      }

      if (data.success) {
        retryCountRef.current = 0
        setState((prev) => {
          if (data.messages && data.messages.length > 0) {
            lastMessageIdRef.current = data.messages[data.messages.length - 1].id
            
            // Merge new messages, update existing ones (for reactions)
            const existingMap = new Map(prev.messages.map(m => [m.id, m]))
            
            for (const msg of data.messages) {
              existingMap.set(msg.id, {
                ...existingMap.get(msg.id),
                ...msg,
              })
            }
            
            return {
              messages: Array.from(existingMap.values()),
              typingUsers: data.typingUsers || [],
              onlineUsers: data.onlineUsers || [],
              isConnected: true,
            }
          }

          // Update reactions on existing messages if we get a full poll
          if (!lastMessageIdRef.current && data.messages) {
            return {
              ...prev,
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
        if (data.error?.includes('not found')) {
          setState((prev) => ({ ...prev, isConnected: false }))
        }
      }
    } catch (error) {
      console.error('[v0] Polling error:', error)
      retryCountRef.current += 1
      
      if (retryCountRef.current >= 3) {
        setState((prev) => ({ ...prev, isConnected: false }))
      }
    }
  }, [roomCode, userId])

  // Initial load
  useEffect(() => {
    if (!enabled) return
    poll()
  }, [poll, enabled])

  // Set up polling interval
  useEffect(() => {
    if (!enabled) return

    pollingIntervalRef.current = setInterval(poll, interval)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [poll, enabled, interval])

  const sendMessage = async (content: string, type = 'text') => {
    try {
      const userData = localStorage.getItem('echo_user')
      const username = userData ? JSON.parse(userData).username : 'Anonymous'
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userId,
          username,
          content,
          type,
        }),
      })

      const data = await response.json() as { success: boolean; message?: any; aiResponse?: any }

      if (data.success && data.message) {
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, data.message!],
        }))

        if (data.aiResponse) {
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, data.aiResponse!],
            }))
          }, 500)
        }

        lastMessageIdRef.current = data.message.id
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
      const userData = localStorage.getItem('echo_user')
      const username = userData ? JSON.parse(userData).username : 'Anonymous'
      
      await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userId,
          username,
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

      const data = await response.json() as { success: boolean; message?: { edited_at?: number } }

      if (data.success && data.message) {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === messageId ? { ...m, content, edited_at: data.message?.edited_at, isEdited: true } : m
          ),
        }))
      }

      return data
    } catch (error) {
      console.error('[v0] Edit message error:', error)
      throw error
    }
  }

  const reactToMessage = async (messageId: string, emoji: string) => {
    try {
      const userData = localStorage.getItem('echo_user')
      const username = userData ? JSON.parse(userData).username : 'Anonymous'

      // Optimistic update
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id !== messageId) return m
          const reactions = { ...(m.reactions || {}) }
          const users = reactions[emoji] ? [...reactions[emoji]] : []
          const idx = users.indexOf(userId)
          if (idx >= 0) {
            users.splice(idx, 1)
            if (users.length === 0) {
              delete reactions[emoji]
            } else {
              reactions[emoji] = users
            }
          } else {
            reactions[emoji] = [...users, userId]
          }
          return { ...m, reactions }
        }),
      }))

      // Send to server
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          userId,
          username,
          emoji,
        }),
      })
    } catch (error) {
      console.error('[v0] React to message error:', error)
      // Re-poll to get correct state
      poll()
    }
  }

  const clipMessage = async (messageId: string, messageContent: string, originalUsername: string) => {
    try {
      const message = state.messages.find(m => m.id === messageId)
      const messageType = message?.type || 'text'
      
      const response = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          messageId,
          messageContent,
          originalUsername,
          roomCode,
          messageType,
        }),
      })

      return await response.json() as { success: boolean; clip?: any }
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
    reactToMessage,
    clipMessage,
    refresh: poll,
  }
}
