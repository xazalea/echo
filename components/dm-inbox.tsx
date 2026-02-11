'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mail, X, Clock } from 'lucide-react'
import { formatTimestamp } from '@/lib/chat-utils'

interface DirectMessage {
  id: string
  from_user_id: string
  from_username: string
  to_user_id: string
  to_username: string
  content: string
  created_at: number
  read_at?: number
}

interface DMInboxProps {
  userId: string
  onClose?: () => void
}

export function DMInbox({ userId, onClose }: DMInboxProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDMs()
    // Poll for new DMs every 5 seconds
    const interval = setInterval(loadDMs, 5000)
    return () => clearInterval(interval)
  }, [userId])

  const loadDMs = async () => {
    try {
      const response = await fetch(`/api/dm?userId=${userId}`)
      const data = await response.json() as { success: boolean; messages?: DirectMessage[]; error?: string }
      
      if (data.success && data.messages) {
        setMessages(data.messages)
        setError('')
      } else {
        setError(data.error || 'Failed to load messages')
      }
    } catch (err) {
      console.error('[v0] Error loading DMs:', err)
      setError('Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Direct Messages</h3>
          <span className="text-[11px] text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded">
            {messages.length}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-muted/30 border border-border/30 flex items-center justify-center animate-pulse">
                  <Mail className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <p className="text-xs text-muted-foreground/60">Loading messages...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <p className="text-xs font-medium text-red-400">{error}</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-muted/20 border border-border/20 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <p className="text-xs font-medium text-foreground/60">No messages yet</p>
                <p className="text-[11px] text-muted-foreground/40">
                  Direct messages will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((dm) => {
                const isReceived = dm.to_user_id === userId
                const otherUser = isReceived ? dm.from_username : dm.to_username
                
                return (
                  <div
                    key={dm.id}
                    className="group rounded-lg border border-border/20 bg-muted/10 p-3 transition-colors hover:bg-muted/20"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-muted/40 flex items-center justify-center text-[10px] font-semibold text-foreground/70">
                          {otherUser.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-foreground/80">
                            {isReceived ? 'From' : 'To'} {otherUser}
                          </span>
                          {isReceived && !dm.read_at && (
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(new Date(dm.created_at))}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-[13px] leading-relaxed text-foreground/80 break-words">
                      {dm.content}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
