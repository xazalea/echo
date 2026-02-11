'use client'

import { useState } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { MessageSquare } from 'lucide-react'
import { DirectMessageOverlay } from './direct-message-overlay'

interface UserHoverCardProps {
  username: string
  userId: string
  isOwn: boolean
}

export function UserHoverCard({ username, userId, isOwn }: UserHoverCardProps) {
  const [showDMOverlay, setShowDMOverlay] = useState(false)

  return (
    <>
      <HoverCard openDelay={300}>
        <HoverCardTrigger asChild>
          <button className="text-sm font-semibold text-foreground/90 transition-colors hover:text-foreground">
            {username}
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-56 border-border/30 bg-card p-3" align="start" side="top">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/40 border border-border/30 text-xs font-semibold text-foreground/80">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{username}</p>
                <p className="text-[11px] text-muted-foreground/50">
                  {isOwn ? 'You' : 'Active now'}
                </p>
              </div>
            </div>

            {!isOwn && (
              <button
                onClick={() => setShowDMOverlay(true)}
                className="w-full flex items-center justify-center gap-2 h-8 rounded-md border border-border/30 bg-transparent text-foreground/70 hover:bg-muted/30 hover:text-foreground text-xs font-medium transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Send Message
              </button>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

      {showDMOverlay && (
        <DirectMessageOverlay
          username={username}
          userId={userId}
          onClose={() => setShowDMOverlay(false)}
        />
      )}
    </>
  )
}
