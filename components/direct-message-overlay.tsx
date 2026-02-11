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
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!message.trim() || sending) return

    setSending(true)
    setError(null)

    try {
      const userData = localStorage.getItem('echo_user')
      if (!userData) {
        setError('Not logged in')
        setSending(false)
        return
      }

      const { userId: fromUserId, username: fromUsername } = JSON.parse(userData)

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

      const data = await response.json() as { success: boolean; error?: string }

      if (data.success) {
        setSent(true)
        setMessage('')
        setTimeout(() => onClose(), 1500)
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[v0] Error sending DM:', err)
    } finally {
      setSending(false)
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200">
        <div className="rounded-xl border border-border/30 bg-card p-5 shadow-2xl">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/40 border border-border/30">
                <MessageSquare className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Direct Message</h3>
                <p className="text-[11px] text-muted-foreground/60">To {username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Success State */}
          {sent ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-foreground">Message sent!</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {username} will receive your message
              </p>
            </div>
          ) : (
            <>
              {/* Message Input */}
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${username}...`}
                className="min-h-[120px] resize-none rounded-lg border-border/30 bg-muted/20 text-sm focus-visible:border-border/50 focus-visible:ring-0 mb-3"
                autoFocus
              />

              {/* Error */}
              {error && (
                <div className="mb-3 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Info */}
              <div className="mb-4 text-[11px] text-muted-foreground/40">
                DMs are private and expire when the room closes.
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="flex-1 h-10 rounded-lg border border-border/30 bg-transparent text-foreground/70 hover:bg-muted/30 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="flex-1 h-10 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-20 flex items-center justify-center gap-2 text-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
