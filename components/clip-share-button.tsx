'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClippedMessage } from '@/lib/types'

interface ClipShareButtonProps {
  clip: ClippedMessage
  onShare: (clip: ClippedMessage) => void
}

export function ClipShareButton({ clip, onShare }: ClipShareButtonProps) {
  const [shared, setShared] = useState(false)

  const handleShare = () => {
    onShare(clip)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <Button
      onClick={handleShare}
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
      disabled={shared}
    >
      {shared ? (
        <>
          <Check className="h-3 w-3 mr-1" />
          Shared
        </>
      ) : (
        <>
          <Share2 className="h-3 w-3 mr-1" />
          Share
        </>
      )}
    </Button>
  )
}
