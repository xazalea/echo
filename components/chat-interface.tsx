'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import { usePolling } from '@/hooks/use-polling'
import type { Message, User } from '@/lib/types'
import { getTimeRemaining, showNotification } from '@/lib/chat-utils'
import { Clock, WifiOff } from 'lucide-react'

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
  messages: _messages,
  setMessages,
  users: _users,
  expiresAt
}: ChatInterfaceProps) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)

  const { 
    messages, 
    typingUsers,
    onlineUsers,
    isConnected, 
    isLoading,
    sendMessage, 
    updateTyping, 
    editMessage: editMsg, 
    clipMessage 
  } = usePolling({
    roomCode,
    userId,
    enabled: true,
    interval: 2000
  })

  // Update parent messages state
  useEffect(() => {
    setMessages(messages)
  }, [messages, setMessages])

  // Show notifications for new messages
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      const newMessage = messages[messages.length - 1]
      
      if (document.hidden && newMessage.user_id !== userId) {
        showNotification(
          `${newMessage.username} in ${roomCode}`,
          newMessage.type === 'text' ? newMessage.content : `Sent a ${newMessage.type}`,
        )
      }
    }
    prevMessageCountRef.current = messages.length
  }, [messages, userId, roomCode])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Update time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(expiresAt))
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const handleSendMessage = async (content: string, type?: string) => {
    try {
      await sendMessage(content, type || 'text')
    } catch (error) {
      console.error('[v0] Error sending message:', error)
    }
  }

  const handleTyping = (isTyping: boolean) => {
    updateTyping(isTyping)
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await editMsg(messageId, newContent)
    } catch (error) {
      console.error('[v0] Error editing message:', error)
    }
  }

  const handleToggleClip = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    try {
      await clipMessage(messageId, message.content, message.username)
      showNotification('echo.', 'Message clipped to library')
    } catch (error) {
      console.error('[v0] Error clipping message:', error)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Timer Bar */}
      <div className="border-b border-border bg-muted px-4 py-2">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>{'Messages expire in'}</span>
            <span className="font-mono">{timeRemaining}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isConnected && (
              <>
                <WifiOff className="h-3 w-3" />
                <span>{'Offline'}</span>
              </>
            )}
            {isLoading && <span>{'Loading...'}</span>}
          </div>
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
            messages.map((message: any) => (
              <MessageBubble
                key={message.id}
                message={{
                  ...message,
                  userId: message.user_id,
                  imageUrl: message.type === 'image' ? message.content : undefined,
                  clippedBy: [],
                  timestamp: new Date(message.created_at)
                }}
                isOwn={message.user_id === userId}
                onEdit={handleEditMessage}
                onToggleClip={() => handleToggleClip(message.id)}
                roomCode={roomCode}
              />
            ))
          )}
          
          {typingUsers.length > 0 && (
            <TypingIndicator users={typingUsers.map((u: any) => ({ 
              userId: u.user_id, 
              username: u.username 
            }))} />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        onTyping={handleTyping}
        disabled={!isConnected}
      />
    </div>
  )
}
