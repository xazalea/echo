'use client'

import React from "react"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, ImageIcon, Film, Sticker, X } from 'lucide-react'
import { GifPicker } from './gif-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ChatInputProps {
  onSend: (content: string, imageUrl?: string, replyTo?: string) => void
  onTyping: (isTyping: boolean) => void
  disabled?: boolean
  replyTo?: { id: string; content: string; username: string } | null
  onCancelReply?: () => void
}

export function ChatInput({ onSend, onTyping, disabled, replyTo, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [showGifPicker, setShowGifPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    // Auto-focus textarea
    textareaRef.current?.focus()
  }, [])

  const handleInputChange = (value: string) => {
    setMessage(value)
    
    // Typing indicator
    onTyping(true)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false)
    }, 1000)
  }

  const handleSend = () => {
    if (!message.trim() || disabled) return

    onSend(message.trim(), undefined, replyTo?.id)
    setMessage('')
    onTyping(false)
    onCancelReply?.()
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleGifSelect = (gifUrl: string) => {
    onSend(gifUrl, 'gif')
    setShowGifPicker(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In production, upload to cloud storage
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      onSend(message.trim() || 'Image', imageUrl)
      setMessage('')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="border-t border-border/40 bg-card/40 backdrop-blur-md px-6 py-4 shadow-sm">
      <div className="mx-auto max-w-3xl">
        {/* Reply Preview */}
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-foreground/30 bg-muted/50 px-3 py-2 text-sm">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground mb-0.5">Replying to {replyTo.username}</div>
              <div className="text-xs text-muted-foreground truncate">{replyTo.content}</div>
            </div>
            <Button
              onClick={onCancelReply}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        
        <div className="flex items-end gap-3">
          {/* Textarea */}
          <div className="flex-1 rounded-2xl border border-border/50 bg-card/50 shadow-md backdrop-blur-sm transition-all focus-within:border-foreground/40 focus-within:shadow-lg focus-within:bg-card/70">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Type a message..."}
              disabled={disabled}
              className="min-h-[48px] max-h-32 resize-none border-0 bg-transparent px-5 py-3.5 text-sm leading-relaxed focus-visible:ring-0 placeholder:text-muted-foreground/60"
              rows={1}
            />
            
            {/* Actions Bar */}
            <div className="flex items-center gap-1.5 border-t border-border/30 px-4 py-2">
              {/* Image Upload */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={disabled}
              />
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
              >
                <label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center">
                  <ImageIcon className="h-4 w-4" />
                </label>
              </Button>

              {/* GIF Picker */}
              <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                    disabled={disabled}
                  >
                    <Film className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <GifPicker onSelect={handleGifSelect} />
                </PopoverContent>
              </Popover>

              <div className="ml-auto text-[10px] font-medium text-muted-foreground/60">
                {disabled ? 'Connecting...' : '↵ to send'}
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="h-12 w-12 rounded-full bg-foreground p-0 text-background shadow-lg hover:bg-foreground/90 disabled:opacity-20 transition-all hover:scale-105 active:scale-95 hover:shadow-xl"
          >
            <Send className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
