export interface Message {
  id: string
  userId?: string // For compatibility
  user_id?: string // From API
  username: string
  content: string
  timestamp?: Date
  created_at?: number // From API
  imageUrl?: string
  type?: string
  isEdited?: boolean
  edited_at?: number
  clippedBy?: string[] // Array of user IDs who clipped this
  replyTo?: string // Message ID this is replying to
  replyToContent?: string // Preview of replied message
  reactions?: Record<string, string[]> // { emoji: [userId1, userId2] }
  readBy?: string[] // Array of user IDs who read this
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' // Delivery status
}

export interface User {
  id: string
  username: string
  isTyping: boolean
}

export interface Room {
  code: string
  users: User[]
  messages: Message[]
  createdAt: Date
  expiresAt: Date
}

export interface ClippedMessage {
  id: string
  messageId: string
  content: string
  username: string
  roomCode: string
  timestamp: number // Exact timestamp in milliseconds
  clippedAt: number // Exact timestamp when clipped in milliseconds
  type: string
  imageUrl?: string
  shareCode?: string // For sharing clips
}

export interface TypingIndicator {
  userId: string
  username: string
}

export interface NotificationPayload {
  type: 'message' | 'user_joined' | 'user_left' | 'typing'
  roomCode: string
  data: any
}
