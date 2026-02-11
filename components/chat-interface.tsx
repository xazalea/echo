'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import { usePolling } from '@/hooks/use-polling'
import type { Message, User } from '@/lib/types'
import { getTimeRemaining, showNotification } from '@/lib/chat-utils'
import { Clock, WifiOff, MessageCircle, Wifi } from 'lucide-react'

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
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; username: string } | null>(null)
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

  // Show notifications for new messages (works even when tab is closed via service worker)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      const newMessage = messages[messages.length - 1]
      
      // Only notify for messages from other users
      if ((newMessage.user_id || newMessage.userId) !== userId) {
        const messageContent = newMessage.type === 'text' 
          ? newMessage.content 
          : `Sent a ${newMessage.type}`
        
        // Show notification even if tab is closed (via service worker)
        if (document.hidden || !document.hasFocus()) {
          // Try service worker first (works when tab is closed)
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
              if (registration.active) {
                registration.active.postMessage({
                  type: 'SHOW_NOTIFICATION',
                  title: `${newMessage.username} in ${roomCode}`,
                  body: messageContent,
                  icon: '/icon-192.png',
                  data: {
                    url: `/room/${roomCode}`,
                    roomCode,
                    messageId: newMessage.id,
                  },
                })
              }
            }).catch(() => {
              // Fallback to regular notification API
              showNotification(
                `${newMessage.username} in ${roomCode}`,
                messageContent,
              )
            })
          } else {
            // Fallback to regular notification API
            showNotification(
              `${newMessage.username} in ${roomCode}`,
              messageContent,
            )
          }
        }
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

  const handleSendMessage = async (content: string, type?: string, replyToId?: string) => {
    try {
      // For now, we'll include reply info in the content
      // In production, this would be a separate field in the API
      await sendMessage(content, type || 'text')
      setReplyTo(null)
    } catch (error) {
      console.error('[v0] Error sending message:', error)
    }
  }

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setReplyTo({
        id: messageId,
        content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
        username: message.username
      })
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    // In production, this would call an API endpoint
    console.log('Reacting to message', messageId, 'with', emoji)
    // For now, we'll just log it - you'd need to add an API endpoint for reactions
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

  const handleToggleClip = async (messageId: string, clipped: boolean) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    try {
      if (!clipped) {
        await clipMessage(messageId, message.content, message.username)
        showNotification('echo.', 'Message clipped to library')
      }
    } catch (error) {
      console.error('[v0] Error clipping message:', error)
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-background/95 to-background/90 backdrop-blur-sm">
      {/* Status Bar */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-md px-5 py-2.5 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{'Expires in'}</span>
            <span className="font-mono font-bold text-foreground">{timeRemaining}</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <span className="text-muted-foreground animate-pulse">{'Loading...'}</span>
            )}
            {!isConnected && (
              <div className="flex items-center gap-2 text-muted-foreground/80">
                <WifiOff className="h-4 w-4" />
                <span className="font-medium">{'Reconnecting...'}</span>
              </div>
            )}
            {isConnected && !isLoading && (
              <div className="flex items-center gap-2 text-foreground/80">
                <div className="h-2 w-2 rounded-full bg-foreground/60 animate-pulse" />
                <span className="font-medium text-xs">{'Live'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-container flex-1 overflow-y-auto px-6 py-8 scroll-smooth">
        <div className="mx-auto max-w-3xl space-y-0.5">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center mb-4">
                  <MessageCircle className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {'No messages yet'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {'Start the conversation'}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message: any, index: number) => {
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showAvatar = !prevMessage || prevMessage.user_id !== message.user_id || 
                (message.created_at && prevMessage.created_at && 
                 (new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()) > 300000) // 5 minutes
              
              return (
                <MessageBubble
                  key={message.id}
                  message={{
                    ...message,
                    userId: message.user_id,
                    imageUrl: message.type === 'image' ? message.content : undefined,
                    clippedBy: [],
                    timestamp: new Date(message.created_at),
                    reactions: message.reactions || {},
                    readBy: message.read_by || [],
                    deliveryStatus: message.delivery_status || 'sent',
                  }}
                  isOwn={message.user_id === userId}
                  onEdit={handleEditMessage}
                  onToggleClip={handleToggleClip}
                  roomCode={roomCode}
                  showAvatar={showAvatar}
                  onReply={handleReply}
                  onReact={handleReact}
                />
              )
            })
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
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}
