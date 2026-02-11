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
    <div className="flex gap-3 px-2 py-1">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
        {/* Empty space for alignment */}
      </div>
      <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-sm border border-border/50 bg-muted/50 px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">{displayText}</span>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
