'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Copy } from 'lucide-react'
import type { ClippedMessage } from '@/lib/types'
import { getClippedMessages, removeClippedMessage, formatTimestamp } from '@/lib/chat-utils'

export function ClipsLibrary() {
  const [clips, setClips] = useState<ClippedMessage[]>([])

  useEffect(() => {
    setClips(getClippedMessages())
  }, [])

  const handleRemoveClip = (messageId: string) => {
    removeClippedMessage(messageId)
    setClips(getClippedMessages())
  }

  const handleCopyClip = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h3 className="font-medium text-foreground">{'Clipped Messages'}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {clips.length} {clips.length === 1 ? 'clip' : 'clips'} saved
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {clips.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {'No clips yet'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {'Clip messages to save them'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className="group rounded-lg border border-border bg-[hsl(var(--message-bg))] p-3 transition-colors hover:bg-[hsl(var(--message-hover))]"
                >
                  {/* Header */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                        {clip.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {clip.username}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(clip.timestamp)}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="mb-2 text-sm leading-relaxed text-foreground">
                    {clip.content}
                  </p>

                  {clip.imageUrl && (
                    <img
                      src={clip.imageUrl || "/placeholder.svg"}
                      alt="Clipped image"
                      className="mb-2 max-h-32 rounded border border-border"
                    />
                  )}

                  {/* Meta */}
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{'Room: '}{clip.roomCode}</span>
                    <span>{'•'}</span>
                    <span>{'Clipped '}{formatTimestamp(clip.clippedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      onClick={() => handleCopyClip(clip.content)}
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{'Copy'}</span>
                    </Button>
                    <Button
                      onClick={() => handleRemoveClip(clip.id)}
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{'Remove'}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
