'use client'

import type { TypingIndicator as TypingIndicatorType } from '@/lib/types'

interface TypingIndicatorProps {
  users: TypingIndicatorType[]
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const displayText = 
    users.length === 1
      ? `${users[0].username} is typing`
      : users.length === 2
      ? `${users[0].username} and ${users[1].username} are typing`
      : `${users[0].username} and ${users.length - 1} others are typing`

  return (
    <div className="flex gap-3 px-2 py-1">
      <div className="w-9 flex-shrink-0" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
        <span>{displayText}</span>
        <div className="flex gap-0.5">
          <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: '0ms' }} />
          <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: '150ms' }} />
          <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
