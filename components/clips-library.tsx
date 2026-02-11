'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Copy, Bookmark, X } from 'lucide-react'
import type { ClippedMessage } from '@/lib/types'
import { formatExactTimestamp } from '@/lib/chat-utils'
import { ClipShareButton } from '@/components/clip-share-button'

interface ClipsLibraryProps {
  onClose?: () => void
  onShareClip?: (clip: ClippedMessage) => void
}

export function ClipsLibrary({ onClose, onShareClip }: ClipsLibraryProps) {
  const [clips, setClips] = useState<ClippedMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadClips = async () => {
    try {
      // Load clips from localStorage only
      const { getClippedMessages } = await import('@/lib/chat-utils')
      const storedClips = getClippedMessages()
      setClips(storedClips)
    } catch (error) {
      console.error('[v0] Error loading clips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClips()
  }, [])

  const handleRemoveClip = (messageId: string) => {
    setClips(clips.filter(clip => clip.id !== messageId))
  }

  const handleCopyClip = async (clip: ClippedMessage) => {
    try {
      await navigator.clipboard.writeText(clip.content)
      setCopiedId(clip.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('[v0] Error copying:', error)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Clips</h3>
          <span className="text-[11px] text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded">
            {clips.length}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-muted/30 border border-border/30 flex items-center justify-center animate-pulse">
                  <Bookmark className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <p className="text-xs text-muted-foreground/60">Loading clips...</p>
              </div>
            </div>
          ) : clips.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-muted/20 border border-border/20 flex items-center justify-center">
                  <Bookmark className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <p className="text-xs font-medium text-foreground/60">No clips yet</p>
                <p className="text-[11px] text-muted-foreground/40">
                  Hover a message and click the bookmark icon
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className="group rounded-lg border border-border/20 bg-muted/10 p-3 transition-colors hover:bg-muted/20"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-muted/40 flex items-center justify-center text-[10px] font-semibold text-foreground/70">
                        {clip.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-medium text-foreground/80">{clip.username}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/40 font-mono">
                      {clip.roomCode}
                    </span>
                  </div>

                  {/* Content */}
                  {clip.type === 'text' && (
                    <p className="text-[13px] leading-relaxed text-foreground/80 break-words mb-2">
                      {clip.content}
                    </p>
                  )}

                  {(clip.type === 'gif' || clip.type === 'image') && (
                    <img
                      src={clip.content}
                      alt={`Clipped ${clip.type}`}
                      className="mb-2 max-h-40 rounded-md border border-border/20 object-contain"
                      loading="lazy"
                    />
                  )}

                  {/* Time */}
                  <div className="text-[10px] text-muted-foreground/30 mb-2">
                    {clip.clippedAt ? formatExactTimestamp(clip.clippedAt) : ''}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => handleCopyClip(clip)}
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedId === clip.id ? 'Copied!' : 'Copy'}
                    </Button>
                    {onShareClip && (
                      <ClipShareButton clip={clip} onShare={onShareClip} />
                    )}
                    <Button
                      onClick={() => handleRemoveClip(clip.id)}
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded ml-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
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
