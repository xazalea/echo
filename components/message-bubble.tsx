'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bookmark, Edit2, Check, X, BookmarkCheck, Reply, SmilePlus, CornerDownRight } from 'lucide-react'
import type { Message } from '@/lib/types'
import { formatTimestamp, saveClippedMessage, getClippedMessages, removeClippedMessage } from '@/lib/chat-utils'
import { UserHoverCard } from './user-hover-card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MessageBubbleProps {
  message: Message & {
    replyToUsername?: string
    replyToContent?: string
  }
  isOwn: boolean
  onEdit: (messageId: string, newContent: string) => void
  onToggleClip: (messageId: string, clipped: boolean) => void
  roomCode: string
  showAvatar?: boolean
  onReply?: (reply: { id: string; content: string; username: string }) => void
  onReact?: (messageId: string, emoji: string) => void
  currentUserId?: string
  userProfilePicture?: string
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export function MessageBubble({
  message,
  isOwn,
  onEdit,
  onToggleClip,
  roomCode,
  showAvatar = true,
  onReply,
  onReact,
  currentUserId,
  userProfilePicture,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showReactions, setShowReactions] = useState(false)
  const [isClipped, setIsClipped] = useState(false)
  const [clipAnimating, setClipAnimating] = useState(false)
  const [profilePic, setProfilePic] = useState<string | null>(userProfilePicture || null)
  const reactions = message.reactions || {}
  const hasReactions = Object.keys(reactions).length > 0

  // Check if message is clipped in localStorage
  useEffect(() => {
    const clips = getClippedMessages()
    setIsClipped(clips.some(c => c.messageId === message.id))
  }, [message.id])

  // Fetch profile picture for this user
  useEffect(() => {
    if (!isOwn && message.user_id) {
      fetch(`/api/profile-picture?userId=${message.user_id}`)
        .then(res => res.json())
        .then((data) => {
          const typedData = data as { success: boolean; picture?: { dataUrl: string } }
          if (typedData.success && typedData.picture) {
            setProfilePic(typedData.picture.dataUrl)
          }
        })
        .catch(error => console.error('Error fetching profile picture:', error))
    }
  }, [message.user_id, isOwn])

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
    console.log('[MessageBubble] Clip button clicked', { messageId: message.id, isClipped, roomCode })
    const nowClipped = !isClipped
    
    if (nowClipped) {
      console.log('[MessageBubble] Saving clip to localStorage')
      saveClippedMessage(message, roomCode)
      setIsClipped(true)
      setClipAnimating(true)
      setTimeout(() => setClipAnimating(false), 1000)
    } else {
      removeClippedMessage(message.id)
      setIsClipped(false)
    }
    
    onToggleClip(message.id, nowClipped)
  }

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji)
    setShowReactions(false)
  }

  // Check if message is an AI message
  const isAI = message.user_id === 'israelgpt' || message.user_id === 'echo-ai' || message.userId === 'israelgpt' || message.userId === 'echo-ai'

  return (
    <div
      data-message-id={message.id}
      className={`group relative px-2 py-0.5 transition-colors hover:bg-muted/10 ${showAvatar ? 'mt-3' : 'mt-0'}`}
    >
      <div className="flex gap-3">
        {/* Avatar column */}
        <div className="w-9 flex-shrink-0">
          {showAvatar ? (
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold shadow-sm overflow-hidden ${
              isAI 
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
                : isOwn 
                  ? 'bg-gradient-to-br from-foreground/20 to-foreground/10 text-foreground ring-1 ring-foreground/20' 
                  : 'bg-gradient-to-br from-muted to-muted/60 text-foreground ring-1 ring-border/30'
            }`}>
              {profilePic ? (
                <img src={profilePic} alt={message.username} className="h-full w-full object-cover" />
              ) : isAI ? (
                '🤖'
              ) : (
                message.username.charAt(0).toUpperCase()
              )}
            </div>
          ) : null}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Username + timestamp */}
          {showAvatar && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <UserHoverCard 
                username={message.username}
                userId={message.userId || message.user_id || ''}
                isOwn={isOwn}
              />
              <span className="text-[11px] text-muted-foreground/50">
                {message.timestamp ? formatTimestamp(message.timestamp) : message.created_at ? formatTimestamp(new Date(message.created_at)) : ''}
              </span>
              {isOwn && (
                <span className="text-[10px] text-muted-foreground/40">(you)</span>
              )}
            </div>
          )}

          {/* Reply Preview */}
          {(message.replyTo || message.replyToContent) && (
            <div className="mb-1.5 flex items-start gap-1.5 text-xs text-muted-foreground/60">
              <CornerDownRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div className="rounded-md bg-muted/30 border border-border/20 px-2.5 py-1.5 max-w-[80%]">
                {message.replyToUsername && (
                  <span className="font-medium text-muted-foreground/80">{message.replyToUsername}: </span>
                )}
                <span className="italic">{message.replyToContent}</span>
              </div>
            </div>
          )}

          {/* Message content */}
          {isEditing ? (
            <div className="flex items-center gap-2 max-w-lg">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveEdit()
                  }
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                className="h-8 flex-1 border-border/50 bg-muted/50 text-sm rounded-lg"
                autoFocus
              />
              <Button onClick={handleSaveEdit} size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-green-500/10 hover:text-green-500">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button onClick={handleCancelEdit} size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div>
              {/* Text Content */}
              {(message.type === 'text' || !message.type) && (
                <p className={`text-[14px] leading-[1.55] break-words whitespace-pre-wrap ${
                  isAI ? 'text-blue-200/90' : 'text-foreground/90'
                }`}>{message.content}</p>
              )}
              
              {/* GIF */}
              {message.type === 'gif' && (
                <div className="mt-1 max-w-xs">
                  <img
                    src={message.content}
                    alt="GIF"
                    className="rounded-lg border border-border/30 max-h-56 object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Image */}
              {(message.type === 'image' || message.imageUrl) && message.type !== 'gif' && (
                <div className="mt-1 max-w-xs">
                  <img
                    src={message.imageUrl || message.content}
                    alt="Shared image"
                    className="rounded-lg border border-border/30 max-h-56 object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Edited indicator */}
              {(message.isEdited || message.edited_at) && (
                <span className="text-[10px] text-muted-foreground/40 ml-1">(edited)</span>
              )}
            </div>
          )}

          {/* Reactions */}
          {hasReactions && (
            <div className="mt-1 flex flex-wrap gap-1">
              {Object.entries(reactions).map(([emoji, userIds]) => {
                const isOwnReaction = currentUserId && (userIds as string[]).includes(currentUserId)
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                      isOwnReaction 
                        ? 'bg-foreground/10 border-foreground/20 text-foreground' 
                        : 'bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-[10px] font-medium">{(userIds as string[]).length}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Clip indicator */}
          {isClipped && (
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <BookmarkCheck className="h-3 w-3" />
              <span>Clipped</span>
            </div>
          )}
        </div>

        {/* Actions - show on hover */}
        {!isEditing && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-0.5">
            <div className="flex items-center gap-0.5 rounded-lg border border-border/30 bg-card/90 backdrop-blur-sm shadow-sm px-1 py-0.5">
              {/* React */}
              {onReact && (
                <Popover open={showReactions} onOpenChange={setShowReactions}>
                  <PopoverTrigger asChild>
                    <button className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <SmilePlus className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-1.5" align="end" side="top">
                    <div className="flex gap-0.5">
                      {EMOJI_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(emoji)}
                          className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-base transition-transform hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Reply */}
              {onReply && (
                <button
                  onClick={() => onReply({ id: message.id, content: message.content, username: message.username })}
                  className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Reply"
                >
                  <Reply className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Edit (own messages) */}
              {isOwn && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Clip */}
              <button
                onClick={handleClip}
                className={`h-6 w-6 rounded flex items-center justify-center transition-all ${
                  clipAnimating ? 'scale-125 bg-primary/20' : ''
                } ${
                  isClipped 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title={isClipped ? 'Unclip' : 'Clip message'}
              >
                {isClipped ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
