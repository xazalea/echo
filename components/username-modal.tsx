'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Palette } from 'lucide-react'

interface UsernameModalProps {
  onSubmit: (username: string, color?: string) => void
  onClose: () => void
  title?: string
  subtitle?: string
}

export function UsernameModal({ onSubmit, onClose, title = 'Enter Username', subtitle }: UsernameModalProps) {
  const [username, setUsername] = useState('')
  const [displayUsername, setDisplayUsername] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#3b82f6')

  const handleUsernameChange = (value: string) => {
    setDisplayUsername(value)
    
    // Check if username contains #$
    if (value.includes('#$')) {
      setShowColorPicker(true)
      // Remove #$ from the actual username
      const cleanedUsername = value.replace('#$', '')
      setUsername(cleanedUsername)
    } else {
      setUsername(value)
      if (!value.includes('#')) {
        // Only hide color picker if there's no # at all
        setShowColorPicker(false)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      onSubmit(username.trim(), showColorPicker ? selectedColor : undefined)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        <div className="rounded-lg border border-border/30 bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/30 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground/90">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={displayUsername}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Enter your username"
                  className="h-10 bg-background/50"
                  autoFocus
                  maxLength={22}
                />
                <p className="text-xs text-muted-foreground/60">
                  Add #$ at the end to choose a name color
                </p>
              </div>

              {showColorPicker && (
                <div className="space-y-2 p-3 rounded-md border border-border/30 bg-background/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium text-foreground/90">
                      Choose Name Color
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="h-10 w-20 rounded cursor-pointer bg-transparent"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <p 
                        className="text-sm font-semibold"
                        style={{ color: selectedColor }}
                      >
                        {username || 'Your Name'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!username.trim()}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
