'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Send } from 'lucide-react'

interface DirectMessageOverlayProps {
  username: string
  userId: string
  onClose: () => void
}

export function DirectMessageOverlay({ username, userId, onClose }: DirectMessageOverlayProps) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!message.trim()) return

    // In production, send DM via WebSocket
    console.log('[v0] Sending DM to', userId, ':', message)
    
    setSent(true)
    setMessage('')
    
    // Auto-close after 1.5 seconds
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Prevent body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-lg border border-border bg-card p-6 shadow-2xl">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">{'Direct Message'}</h3>
              <p className="text-xs text-muted-foreground">{'To: '}{username}</p>
            </div>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Success State */}
          {sent ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-foreground">
                <Send className="h-5 w-5 text-background" />
              </div>
              <p className="text-sm text-foreground">{'Message sent!'}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {username}{' will receive your message'}
              </p>
            </div>
          ) : (
            <>
              {/* Message Input */}
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="mb-4 min-h-[100px] resize-none border-border bg-background text-sm"
                autoFocus
              />

              {/* Info */}
              <p className="mb-4 text-xs text-muted-foreground">
                {'Direct messages are private and ephemeral. They expire with the room.'}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="flex-1 border border-border bg-transparent text-foreground hover:border-foreground hover:bg-accent"
                >
                  {'Cancel'}
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="flex-1 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30"
                >
                  {'Send'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
