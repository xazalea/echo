'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Copy, Bookmark } from 'lucide-react'
import type { ClippedMessage } from '@/lib/types'
import { formatTimestamp } from '@/lib/chat-utils'

export function ClipsLibrary() {
  const [clips, setClips] = useState<ClippedMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadClips = async () => {
    try {
      const userData = localStorage.getItem('echo_user')
      if (!userData) return
      
      const { userId } = JSON.parse(userData)
      const response = await fetch(`/api/clips?userId=${userId}`)
      const data = await response.json() as { success: boolean; clips?: any[] }
      
      if (data.success && data.clips) {
        setClips(data.clips.map((clip: any) => ({
          id: clip.message_id,
          content: clip.message_content,
          username: clip.original_username,
          roomCode: clip.room_code,
          timestamp: new Date(clip.clipped_at),
          clippedAt: new Date(clip.clipped_at),
        })))
      }
    } catch (error) {
      console.error('[v0] Error loading clips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClips()
  }, [])

  const handleRemoveClip = async (messageId: string) => {
    try {
      // For now, just remove from local state
      // In production, you'd want to add a DELETE endpoint for clips
      setClips(clips.filter(clip => clip.id !== messageId))
    } catch (error) {
      console.error('[v0] Error removing clip:', error)
    }
  }

  const handleCopyClip = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  return (
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-sm">
      <div className="border-b border-border/50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">{'Clipped Messages'}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {clips.length} {clips.length === 1 ? 'clip' : 'clips'} saved
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-16">
              <div className="text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center animate-pulse">
                  <Bookmark className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {'Loading clips...'}
                </p>
              </div>
            </div>
          ) : clips.length === 0 ? (
            <div className="flex h-full items-center justify-center py-16">
              <div className="text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center">
                  <Bookmark className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {'No clips yet'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {'Clip messages to save them'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className="group rounded-xl border border-border/50 bg-background/50 p-3.5 transition-all hover:border-border hover:bg-background hover:shadow-sm"
                >
                  {/* Header */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 border border-border/50 text-xs font-semibold text-foreground">
                        {clip.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {clip.username}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {clip.timestamp ? formatTimestamp(clip.timestamp) : ''}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="mb-2.5 text-sm leading-relaxed text-foreground break-words">
                    {clip.content}
                  </p>

                  {clip.imageUrl && (
                    <img
                      src={clip.imageUrl || "/placeholder.svg"}
                      alt="Clipped image"
                      className="mb-2.5 max-h-32 rounded-lg border border-border/50"
                    />
                  )}

                  {/* Meta */}
                  <div className="mb-2 flex items-center gap-2 text-[10px] text-muted-foreground/70">
                    <span className="font-mono">{clip.roomCode}</span>
                    <span>{'•'}</span>
                    <span>{'Clipped '}{clip.clippedAt ? formatTimestamp(clip.clippedAt) : ''}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 pt-1 border-t border-border/30">
                    <Button
                      onClick={() => handleCopyClip(clip.content)}
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{'Copy'}</span>
                    </Button>
                    <Button
                      onClick={() => handleRemoveClip(clip.id)}
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg"
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
