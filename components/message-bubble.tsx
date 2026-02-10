'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bookmark, Edit2, Check, X, BookmarkCheck, Reply, CheckCheck } from 'lucide-react'
import type { Message } from '@/lib/types'
import { formatTimestamp, saveClippedMessage } from '@/lib/chat-utils'
import { UserHoverCard } from './user-hover-card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onEdit: (messageId: string, newContent: string) => void
  onToggleClip: (messageId: string, clipped: boolean) => void
  roomCode: string
  showAvatar?: boolean
  onReply?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export function MessageBubble({
  message,
  isOwn,
  onEdit,
  onToggleClip,
  roomCode,
  showAvatar = true,
  onReply,
  onReact,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showReactions, setShowReactions] = useState(false)
  const isClipped = (message.clippedBy?.length ?? 0) > 0
  const reactions = message.reactions || {}
  const hasReactions = Object.keys(reactions).length > 0
  const readBy = message.readBy || []
  const deliveryStatus = message.deliveryStatus || 'sent'

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

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji)
    setShowReactions(false)
  }

  return (
    <div
      className={`group flex gap-2 px-2 py-1 transition-colors hover:bg-muted/30 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0 pt-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 text-xs font-semibold text-foreground shadow-sm">
            {message.username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      {!showAvatar && <div className="w-7" />}

      {/* Content */}
      <div className={`flex-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5 min-w-0`}>
        {/* Username - only show if avatar is shown */}
        {showAvatar && (
          <div className={`flex items-center gap-2 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <UserHoverCard 
              username={message.username}
              userId={message.userId || message.user_id || ''}
              isOwn={isOwn}
            />
            <span className="text-[10px] text-muted-foreground/70">
              {message.timestamp ? formatTimestamp(message.timestamp) : message.created_at ? formatTimestamp(new Date(message.created_at)) : ''}
            </span>
          </div>
        )}

        {/* Reply Preview */}
        {message.replyTo && message.replyToContent && (
          <div className={`mb-1 ml-1 border-l-2 ${isOwn ? 'border-foreground/30' : 'border-muted-foreground/30'} pl-2 text-[11px] text-muted-foreground/70 italic max-w-[80%] truncate`}>
            {message.replyToContent}
          </div>
        )}

        {/* Message Bubble */}
        <div className="relative flex items-end gap-2 group/message">
          <div
            className={`relative rounded-2xl px-3.5 py-2 transition-all ${
              isOwn 
                ? 'bg-foreground text-background rounded-br-sm' 
                : 'bg-muted text-foreground rounded-bl-sm'
            } ${isEditing ? 'ring-2 ring-border' : ''} max-w-[85%] sm:max-w-[75%]`}
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
                  className="h-7 w-7 p-0"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                
                {message.imageUrl && (
                  <img
                    src={message.imageUrl || "/placeholder.svg"}
                    alt="Shared image"
                    className="mt-2 max-h-64 rounded-xl border border-border/50"
                  />
                )}
                
                {/* Reactions */}
                {hasReactions && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {Object.entries(reactions).map(([emoji, userIds]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs border border-border/50 hover:bg-background transition-colors"
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px] text-muted-foreground">{userIds.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Delivery Status & Timestamp */}
          {isOwn && (
            <div className="flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
              <span className="text-[10px] text-muted-foreground/60">
                {message.timestamp ? formatTimestamp(message.timestamp) : message.created_at ? formatTimestamp(new Date(message.created_at)) : ''}
              </span>
              {deliveryStatus === 'read' && readBy.length > 0 ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : deliveryStatus === 'delivered' ? (
                <CheckCheck className="h-3 w-3 text-muted-foreground/60" />
              ) : (
                <Check className="h-3 w-3 text-muted-foreground/60" />
              )}
            </div>
          )}
        </div>

        {/* Edited indicator */}
        {message.isEdited && !isEditing && (
          <div className={`px-1 text-[10px] text-muted-foreground/60 ${isOwn ? 'text-right' : 'text-left'}`}>
            {'edited'}
          </div>
        )}

        {/* Clip indicator */}
        {isClipped && (
          <div className={`px-1 flex items-center gap-1 text-[10px] text-muted-foreground/60 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <BookmarkCheck className="h-3 w-3" />
            <span>{(message.clippedBy?.length ?? 0)} {(message.clippedBy?.length ?? 0) === 1 ? 'clip' : 'clips'}</span>
          </div>
        )}

        {/* Actions Menu */}
        {!isEditing && (
          <div className={`flex gap-1 px-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {onReply && (
              <Button
                onClick={() => onReply(message.id)}
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Reply className="h-3 w-3" />
                <span>{'Reply'}</span>
              </Button>
            )}
            {onReact && (
              <Popover open={showReactions} onOpenChange={setShowReactions}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <span>😊</span>
                    <span>{'React'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1" align={isOwn ? 'end' : 'start'}>
                  <div className="flex gap-1">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {isOwn && (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
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
                className={`h-6 gap-1 px-2 text-[11px] ${
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
