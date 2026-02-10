'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bookmark, Edit2, Check, X, BookmarkCheck } from 'lucide-react'
import type { Message } from '@/lib/types'
import { formatTimestamp, saveClippedMessage } from '@/lib/chat-utils'
import { UserHoverCard } from './user-hover-card'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onEdit: (messageId: string, newContent: string) => void
  onToggleClip: (messageId: string, clipped: boolean) => void
  roomCode: string
}

export function MessageBubble({
  message,
  isOwn,
  onEdit,
  onToggleClip,
  roomCode
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const isClipped = message.clippedBy.length > 0

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const handleClip = () => {
    const nowClipped = !isClipped
    onToggleClip(message.id, nowClipped)
    
    if (nowClipped) {
      saveClippedMessage(message, roomCode)
    }
  }

  return (
    <div
      className={`group flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
          {message.username.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Username with hover card */}
        <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <UserHoverCard 
            username={message.username}
            userId={message.userId}
            isOwn={isOwn}
          />
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.isEdited && (
            <span className="text-xs text-muted-foreground">{'(edited)'}</span>
          )}
        </div>

        {/* Message */}
        <div
          className={`relative rounded-lg border border-border px-4 py-2.5 transition-colors ${
            isOwn 
              ? 'bg-foreground text-background' 
              : 'bg-[hsl(var(--message-bg))] text-foreground hover:bg-[hsl(var(--message-hover))]'
          }`}
        >
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveEdit()
                  }
                  if (e.key === 'Escape') {
                    handleCancelEdit()
                  }
                }}
                className="h-8 flex-1 border-border bg-background text-sm"
                autoFocus
              />
              <Button
                onClick={handleSaveEdit}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleCancelEdit}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed">{message.content}</p>
              
              {message.imageUrl && (
                <img
                  src={message.imageUrl || "/placeholder.svg"}
                  alt="Shared image"
                  className="mt-2 max-h-64 rounded border border-border"
                />
              )}
              
              {/* Clip indicator */}
              {isClipped && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <BookmarkCheck className="h-3 w-3" />
                  <span>{message.clippedBy.length} {message.clippedBy.length === 1 ? 'clip' : 'clips'}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className={`flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {isOwn && (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-3 w-3" />
                <span>{'Edit'}</span>
              </Button>
            )}
            {!isOwn && (
              <Button
                onClick={handleClip}
                size="sm"
                variant="ghost"
                className={`h-6 gap-1 px-2 text-xs ${
                  isClipped 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isClipped ? (
                  <BookmarkCheck className="h-3 w-3" />
                ) : (
                  <Bookmark className="h-3 w-3" />
                )}
                <span>{isClipped ? 'Clipped' : 'Clip'}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
