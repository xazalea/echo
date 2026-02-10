'use client'

import type { TypingIndicator as TypingIndicatorType } from '@/lib/types'

interface TypingIndicatorProps {
  users: TypingIndicatorType[]
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const displayText = 
    users.length === 1
      ? `${users[0].username} is typing...`
      : users.length === 2
      ? `${users[0].username} and ${users[1].username} are typing...`
      : `${users[0].username} and ${users.length - 1} others are typing...`

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
        {/* Empty space for alignment */}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-[hsl(var(--message-bg))] px-4 py-2.5">
        <span className="text-xs text-muted-foreground">{displayText}</span>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[hsl(var(--typing-indicator))]" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[hsl(var(--typing-indicator))]" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[hsl(var(--typing-indicator))]" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
