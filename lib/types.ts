export interface Message {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
  imageUrl?: string
  isEdited?: boolean
  clippedBy: string[] // Array of user IDs who clipped this
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

export interface ClippedMessage extends Message {
  roomCode: string
  clippedAt: Date
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
