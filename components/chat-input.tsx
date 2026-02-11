'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, ImageIcon, Film, X } from 'lucide-react'
import { GifPicker } from './gif-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ChatInputProps {
  onSend: (content: string, type?: string, replyTo?: string) => void
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
    textareaRef.current?.focus()
  }, [])

  // Focus input when reply is set
  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus()
    }
  }, [replyTo])

  const handleInputChange = (value: string) => {
    setMessage(value)
    
    if (value.trim()) {
      onTyping(true)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false)
      }, 800)
    } else {
      onTyping(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const handleSend = () => {
    if (!message.trim() || disabled) return

    onSend(message.trim(), 'text', replyTo?.id)
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
    if (e.key === 'Escape' && replyTo) {
      onCancelReply?.()
    }
  }

  const handleGifSelect = (gifUrl: string) => {
    onSend(gifUrl, 'gif')
    setShowGifPicker(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      onSend(imageUrl, 'image')
      setMessage('')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="border-t border-border/30 bg-card/40 backdrop-blur-md px-4 py-3">
      <div className="mx-auto max-w-3xl">
        {/* Reply Preview */}
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/30 border border-border/20 px-3 py-2">
            <div className="w-0.5 h-8 bg-foreground/30 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-foreground/70 mb-0.5">Replying to {replyTo.username}</div>
              <div className="text-[11px] text-muted-foreground/60 truncate">{replyTo.content}</div>
            </div>
            <button
              onClick={onCancelReply}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 flex-shrink-0 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          {/* Input area */}
          <div className="flex-1 rounded-xl border border-border/30 bg-muted/20 transition-all focus-within:border-border/50 focus-within:bg-muted/30">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Type a message..."}
              disabled={disabled}
              className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed focus-visible:ring-0 placeholder:text-muted-foreground/40"
              rows={1}
            />
            
            {/* Actions Bar */}
            <div className="flex items-center gap-1 px-3 pb-2">
              {/* Image Upload */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={disabled}
              />
              <button
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={disabled}
              >
                <ImageIcon className="h-4 w-4" />
              </button>

              {/* GIF Picker */}
              <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                <PopoverTrigger asChild>
                  <button
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
                    disabled={disabled}
                  >
                    <Film className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <GifPicker onSelect={handleGifSelect} />
                </PopoverContent>
              </Popover>

              <div className="ml-auto text-[10px] text-muted-foreground/30">
                {disabled ? 'Connecting...' : '↵ send'}
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="h-11 w-11 rounded-full bg-foreground p-0 text-background shadow-md hover:bg-foreground/90 disabled:opacity-15 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
