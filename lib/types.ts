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
  userId?: string
  roomCode: string
  timestamp: number // Original message timestamp in milliseconds
  clippedAt: number // Exact timestamp when clipped
  clippedBy?: string // Username of who clipped it
  clippedById?: string // User ID of who clipped it
  type: string
  imageUrl?: string
  shareCode?: string // For sharing
  verificationHash?: string // Legal proof hash
  clipId?: string // Unique clip identifier
  metadata?: {
    // Core message data
    messageId: string
    originalTimestamp: string
    originalTimestampUnix: number
    
    // Clip data
    clippedTimestamp: string
    clippedTimestampUnix: number
    clipId: string
    
    // User data
    senderUsername: string
    senderUserId?: string
    clipperUsername: string
    clipperUserId: string
    
    // Context
    roomCode: string
    messageType: string
    
    // Platform & Legal
    platform: string
    version: string
    userAgent: string
    timezone: string
    
    // Verification
    verificationHash: string
    verificationString: string
    
    // Legal disclaimer
    legalNotice: string
  }
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
