'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Send, MessageSquare, CheckCircle2 } from 'lucide-react'

interface DirectMessageOverlayProps {
  username: string
  userId: string
  onClose: () => void
}

export function DirectMessageOverlay({ username, userId, onClose }: DirectMessageOverlayProps) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return

    try {
      // Get current user info
      const userData = localStorage.getItem('echo_user')
      if (!userData) {
        console.error('[v0] No user data found')
        return
      }

      const { userId: fromUserId, username: fromUsername } = JSON.parse(userData)

      // Send DM via API
      const response = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId,
          fromUsername,
          toUserId: userId,
          toUsername: username,
          content: message.trim(),
        }),
      })

      const data = await response.json() as { success: boolean }

      if (data.success) {
        setSent(true)
        setMessage('')
        
        // Auto-close after 1.5 seconds
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        console.error('[v0] Failed to send DM')
      }
    } catch (error) {
      console.error('[v0] Error sending DM:', error)
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200">
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-2xl">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border/50">
                <MessageSquare className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-lg">{'Direct Message'}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{'To: '}<span className="font-medium">{username}</span></p>
              </div>
            </div>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Success State */}
          {sent ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/10 border-2 border-foreground/20">
                <CheckCircle2 className="h-8 w-8 text-foreground" />
              </div>
              <p className="text-base font-medium text-foreground mb-2">{'Message sent!'}</p>
              <p className="text-sm text-muted-foreground">
                {username}{' will receive your message'}
              </p>
            </div>
          ) : (
            <>
              {/* Message Input */}
              <div className="mb-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Send a private message to ${username}...`}
                  className="min-h-[140px] resize-none rounded-xl border-border/50 bg-background/50 text-sm focus-visible:border-foreground/50 focus-visible:ring-0"
                  autoFocus
                />
              </div>

              {/* Info */}
              <div className="mb-6 rounded-lg bg-muted/30 border border-border/30 px-3 py-2.5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {'Direct messages are private and ephemeral. They expire when the room closes.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="flex-1 h-11 rounded-xl border border-border/50 bg-transparent text-foreground hover:border-foreground/50 hover:bg-accent"
                >
                  {'Cancel'}
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="flex-1 h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send className="h-4 w-4" />
                  <span>{'Send Message'}</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
