'use client'

import React from "react"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, ImageIcon, Smile, Sticker } from 'lucide-react'
import { GifPicker } from './gif-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ChatInputProps {
  onSend: (content: string, imageUrl?: string) => void
  onTyping: (isTyping: boolean) => void
  disabled?: boolean
}

export function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
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

    onSend(message.trim())
    setMessage('')
    onTyping(false)
    
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
    onSend('', gifUrl)
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
    <div className="border-t border-border bg-card px-4 py-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end gap-2">
          {/* Textarea */}
          <div className="flex-1 rounded-lg border border-border bg-background">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={disabled}
              className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent px-4 py-3 text-sm focus-visible:ring-0"
              rows={1}
            />
            
            {/* Actions Bar */}
            <div className="flex items-center gap-1 border-t border-border px-3 py-2">
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
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="h-4 w-4" />
                </label>
              </Button>

              {/* GIF Picker */}
              <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    disabled={disabled}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <GifPicker onSelect={handleGifSelect} />
                </PopoverContent>
              </Popover>

              {/* Sticker */}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                disabled={disabled}
              >
                <Sticker className="h-4 w-4" />
              </Button>

              <div className="ml-auto text-xs text-muted-foreground">
                {disabled ? 'Connecting...' : 'Shift + Enter for new line'}
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="h-11 w-11 bg-foreground p-0 text-background hover:bg-foreground/90 disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
