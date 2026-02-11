'use client'

import { useEffect, useState } from 'react'
import { Mail, X } from 'lucide-react'

interface DirectMessage {
  id: string
  from_username: string
  content: string
  created_at: number
}

interface DMToastProps {
  message: DirectMessage | null
  onDismiss: () => void
  onView?: () => void
}

export function DMToast({ message, onDismiss, onView }: DMToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (message) {
      setShouldRender(true)
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 10)
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      setShouldRender(false)
      onDismiss()
    }, 300) // Wait for animation
  }

  if (!message || !shouldRender) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] transition-all duration-300 ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-4 scale-95'
      }`}
    >
          <div className="rounded-lg border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">New Direct Message</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    from {message.from_username}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-foreground/80 line-clamp-3 break-words">
                {message.content}
              </p>
            </div>

            {/* Actions */}
            {onView && (
              <div className="px-4 pb-3">
                <button
                  onClick={() => {
                    onView()
                    handleDismiss()
                  }}
                  className="w-full py-2 px-3 rounded-md bg-foreground/10 hover:bg-foreground/15 text-foreground text-xs font-medium transition-colors"
                >
                  View Message
                </button>
              </div>
            )}
          </div>
    </div>
  )
}
