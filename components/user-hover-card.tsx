'use client'

import { useState } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
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
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <button className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground">
            {username}
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 border-border bg-card p-4" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{username}</p>
                <p className="text-xs text-muted-foreground">
                  {isOwn ? 'You' : 'Anonymous user'}
                </p>
              </div>
            </div>

            {!isOwn && (
              <Button
                onClick={() => setShowDMOverlay(true)}
                size="sm"
                className="w-full gap-2 border border-border bg-transparent text-foreground hover:border-foreground hover:bg-accent"
                variant="ghost"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{'Send Direct Message'}</span>
              </Button>
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
