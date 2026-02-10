'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import { useWebSocket } from '@/hooks/use-websocket'
import type { Message, User, TypingIndicator as TypingIndicatorType } from '@/lib/types'
import { getTimeRemaining, showNotification } from '@/lib/chat-utils'
import { Clock } from 'lucide-react'

interface ChatInterfaceProps {
  roomCode: string
  userId: string
  username: string
  messages: Message[]
  setMessages: (messages: Message[]) => void
  users: User[]
  expiresAt: Date
}

export function ChatInterface({
  roomCode,
  userId,
  username,
  messages,
  setMessages,
  users,
  expiresAt
}: ChatInterfaceProps) {
  const [typingUsers, setTypingUsers] = useState<TypingIndicatorType[]>([])
  const [timeRemaining, setTimeRemaining] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)

  const { connected, sendMessage, sendTyping, editMessage, toggleClip } = useWebSocket({
    roomCode,
    userId,
    username,
    onMessage: (message) => {
      setMessages([...messages, message])
      
      // Show notification for new messages from others when tab is hidden
      if (document.hidden && message.userId !== userId) {
        showNotification(
          `${message.username} in echo.`,
          message.content,
        )
      }
    },
    onUserJoined: (user) => {
      showNotification('echo.', `${user.username} joined the room`)
    },
    onUserLeft: (userIdLeft) => {
      const leftUser = users.find(u => u.id === userIdLeft)
      if (leftUser) {
        showNotification('echo.', `${leftUser.username} left the room`)
      }
    },
    onTyping: (typing) => {
      if (typing.userId === userId) return
      
      setTypingUsers(prev => {
        const filtered = prev.filter(t => t.userId !== typing.userId)
        return [...filtered, typing]
      })
      
      // Remove typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(t => t.userId !== typing.userId))
      }, 3000)
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  // Update time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(expiresAt))
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const handleSendMessage = (content: string, imageUrl?: string) => {
    sendMessage(content, imageUrl)
  }

  const handleTyping = (isTyping: boolean) => {
    sendTyping(isTyping)
  }

  const handleEditMessage = (messageId: string, newContent: string) => {
    editMessage(messageId, newContent)
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: newContent, isEdited: true }
        : msg
    ))
  }

  const handleToggleClip = (messageId: string, clipped: boolean) => {
    toggleClip(messageId, clipped)
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const clippedBy = clipped 
          ? [...msg.clippedBy, userId]
          : msg.clippedBy.filter(id => id !== userId)
        return { ...msg, clippedBy }
      }
      return msg
    }))
  }

  return (
    <div className="flex h-full flex-col">
      {/* Timer Bar */}
      <div className="border-b border-border bg-muted px-4 py-2">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{'Messages expire in'}</span>
          <span className="font-mono">{timeRemaining}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-container flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {'No messages yet'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {'Start the conversation'}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.userId === userId}
                onEdit={handleEditMessage}
                onToggleClip={handleToggleClip}
                roomCode={roomCode}
              />
            ))
          )}
          
          {typingUsers.length > 0 && (
            <TypingIndicator users={typingUsers} />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        onTyping={handleTyping}
        disabled={!connected}
      />
    </div>
  )
}
