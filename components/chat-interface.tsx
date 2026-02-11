'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import { usePolling } from '@/hooks/use-polling'
import type { Message, User } from '@/lib/types'
import { getTimeRemaining, showNotification } from '@/lib/chat-utils'
import { Clock, WifiOff, MessageCircle } from 'lucide-react'

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
    reactToMessage,
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
      
      if ((newMessage.user_id || newMessage.userId) !== userId) {
        const messageContent = newMessage.type === 'text' 
          ? newMessage.content 
          : `Sent a ${newMessage.type}`
        
        if (document.hidden || !document.hasFocus()) {
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
              showNotification(
                `${newMessage.username} in ${roomCode}`,
                messageContent,
              )
            })
          } else {
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
      // If replying, prefix content with reply context for display
      let finalContent = content
      if (replyTo) {
        // Encode reply info as a parseable prefix
        finalContent = `<<reply:${replyTo.id}:${replyTo.username}:${replyTo.content}>>${content}`
      }
      await sendMessage(finalContent, type || 'text')
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
        content: message.content.substring(0, 60) + (message.content.length > 60 ? '...' : ''),
        username: message.username
      })
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await reactToMessage(messageId, emoji)
    } catch (error) {
      console.error('[v0] Error reacting to message:', error)
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

  const handleToggleClip = async (messageId: string, clipped: boolean) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    try {
      if (!clipped) {
        await clipMessage(messageId, message.content, message.username)
        
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`)
        if (messageEl) {
          messageEl.classList.add('animate-pulse')
          setTimeout(() => messageEl.classList.remove('animate-pulse'), 500)
        }
      }
    } catch (error) {
      console.error('[v0] Error clipping message:', error)
    }
  }

  // Parse reply info from message content
  const parseMessage = (msg: any) => {
    const replyMatch = msg.content.match(/^<<reply:([^:]+):([^:]+):(.+?)>>(.[\s\S]*)$/)
    if (replyMatch) {
      return {
        ...msg,
        replyTo: replyMatch[1],
        replyToUsername: replyMatch[2],
        replyToContent: replyMatch[3],
        content: replyMatch[4],
      }
    }
    return msg
  }

  return (
    <div className="relative flex h-full flex-col bg-background">
      {/* Status Bar */}
      <div className="border-b border-border/30 bg-card/60 backdrop-blur-md px-5 py-2">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono text-foreground/80">{timeRemaining}</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <span className="text-muted-foreground animate-pulse text-xs">Syncing...</span>
            )}
            {!isConnected && (
              <div className="flex items-center gap-1.5 text-yellow-500/80">
                <WifiOff className="h-3.5 w-3.5" />
                <span className="text-xs">Reconnecting...</span>
              </div>
            )}
            {isConnected && !isLoading && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500/70" />
                <span className="text-xs">Live</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-container flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
        <div className="mx-auto max-w-3xl space-y-0.5">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto h-14 w-14 rounded-full bg-muted/30 border border-border/30 flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-medium text-foreground/80">
                  No messages yet
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Start the conversation
                </p>
              </div>
            </div>
          ) : (
            messages.map((message: any, index: number) => {
              const parsed = parseMessage(message)
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showAvatar = !prevMessage || 
                (prevMessage.user_id || prevMessage.userId) !== (message.user_id || message.userId) || 
                (message.created_at && prevMessage.created_at && 
                 (new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()) > 300000)
              
              return (
                <MessageBubble
                  key={message.id}
                  message={{
                    ...parsed,
                    userId: message.user_id || message.userId,
                    imageUrl: message.type === 'image' ? message.content : undefined,
                    clippedBy: [],
                    timestamp: new Date(message.created_at),
                    reactions: message.reactions || {},
                  }}
                  isOwn={(message.user_id || message.userId) === userId}
                  onEdit={handleEditMessage}
                  onToggleClip={handleToggleClip}
                  roomCode={roomCode}
                  showAvatar={showAvatar}
                  onReply={handleReply}
                  onReact={handleReact}
                  currentUserId={userId}
                />
              )
            })
          )}
          
          {typingUsers.length > 0 && (
            <TypingIndicator users={typingUsers.map((u: any) => ({ 
              userId: u.user_id || u.userId, 
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
