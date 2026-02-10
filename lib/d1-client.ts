// Cloudflare D1 Database Client Utilities
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

export interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run(): Promise<D1Result>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown>(): Promise<T[]>
}

export interface D1Result<T = unknown> {
  results?: T[]
  success: boolean
  error?: string
  meta: {
    duration: number
    rows_read: number
    rows_written: number
  }
}

export interface D1ExecResult {
  count: number
  duration: number
}

// Helper functions
export function generateId(): string {
  return nanoid()
}

export function generateRoomCode(): string {
  return customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)()
}

export function getTimestamp(): number {
  return Date.now()
}

export function getExpiryTimestamp(hours = 1): number {
  return Date.now() + hours * 60 * 60 * 1000
}

// Room operations
export async function createRoom(db: D1Database, code?: string, createdBy = 'system') {
  const roomCode = code || generateRoomCode()
  const id = generateId()
  const now = getTimestamp()
  const expiresAt = getExpiryTimestamp(24) // Rooms expire in 24 hours

  await db
    .prepare(
      'INSERT INTO rooms (id, code, created_at, expires_at, created_by) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, roomCode, now, expiresAt, createdBy)
    .run()

  return { id, code: roomCode, created_at: now, expires_at: expiresAt }
}

export async function getRoom(db: D1Database, code: string) {
  return await db
    .prepare('SELECT * FROM rooms WHERE code = ? AND expires_at > ?')
    .bind(code, getTimestamp())
    .first()
}

export async function joinRoom(db: D1Database, roomId: string, userId: string, username: string) {
  const id = generateId()
  const now = getTimestamp()

  await db
    .prepare(
      'INSERT INTO room_users (id, room_id, user_id, username, joined_at, last_seen, is_online) VALUES (?, ?, ?, ?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET last_seen = ?, is_online = 1'
    )
    .bind(id, roomId, userId, username, now, now, now)
    .run()

  return { id, room_id: roomId, user_id: userId, username, joined_at: now }
}

export async function getRoomUsers(db: D1Database, roomId: string) {
  const result = await db
    .prepare('SELECT * FROM room_users WHERE room_id = ? AND is_online = 1')
    .bind(roomId)
    .all()

  return result.results || []
}

// Message operations
export async function createMessage(
  db: D1Database,
  roomId: string,
  userId: string,
  username: string,
  content: string,
  type = 'text'
) {
  const id = generateId()
  const now = getTimestamp()
  const expiresAt = getExpiryTimestamp(1) // Messages expire in 1 hour

  await db
    .prepare(
      'INSERT INTO messages (id, room_id, user_id, username, content, type, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, roomId, userId, username, content, type, now, expiresAt)
    .run()

  return {
    id,
    room_id: roomId,
    user_id: userId,
    username,
    content,
    type,
    created_at: now,
    expires_at: expiresAt,
  }
}

export async function getMessages(db: D1Database, roomId: string, limit = 100) {
  const result = await db
    .prepare(
      'SELECT * FROM messages WHERE room_id = ? AND expires_at > ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT ?'
    )
    .bind(roomId, getTimestamp(), limit)
    .all()

  return result.results || []
}

export async function updateMessage(db: D1Database, messageId: string, content: string) {
  const now = getTimestamp()

  await db
    .prepare('UPDATE messages SET content = ?, edited_at = ? WHERE id = ?')
    .bind(content, now, messageId)
    .run()

  return { id: messageId, content, edited_at: now }
}

export async function deleteMessage(db: D1Database, messageId: string) {
  await db.prepare('UPDATE messages SET is_deleted = 1 WHERE id = ?').bind(messageId).run()

  return { id: messageId, deleted: true }
}

// Clip operations
export async function clipMessage(
  db: D1Database,
  userId: string,
  messageId: string,
  messageContent: string,
  originalUsername: string,
  roomCode: string
) {
  const id = generateId()
  const now = getTimestamp()

  await db
    .prepare(
      'INSERT INTO clips (id, user_id, message_id, message_content, original_username, clipped_at, room_code) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, userId, messageId, messageContent, originalUsername, now, roomCode)
    .run()

  return { id, clipped_at: now }
}

export async function getClips(db: D1Database, userId: string) {
  const result = await db
    .prepare('SELECT * FROM clips WHERE user_id = ? ORDER BY clipped_at DESC')
    .bind(userId)
    .all()

  return result.results || []
}

// Typing indicator operations
export async function setTyping(db: D1Database, roomId: string, userId: string, username: string) {
  const now = getTimestamp()

  await db
    .prepare(
      'INSERT INTO typing_indicators (room_id, user_id, username, started_at) VALUES (?, ?, ?, ?) ON CONFLICT(room_id, user_id) DO UPDATE SET started_at = ?'
    )
    .bind(roomId, userId, username, now, now)
    .run()
}

export async function clearTyping(db: D1Database, roomId: string, userId: string) {
  await db
    .prepare('DELETE FROM typing_indicators WHERE room_id = ? AND user_id = ?')
    .bind(roomId, userId)
    .run()
}

export async function getTypingUsers(db: D1Database, roomId: string) {
  const fiveSecondsAgo = getTimestamp() - 5000

  const result = await db
    .prepare('SELECT username FROM typing_indicators WHERE room_id = ? AND started_at > ?')
    .bind(roomId, fiveSecondsAgo)
    .all()

  return result.results || []
}

// Cleanup expired data
export async function cleanupExpiredData(db: D1Database) {
  const now = getTimestamp()

  // Delete expired messages
  await db.prepare('DELETE FROM messages WHERE expires_at < ?').bind(now).run()

  // Delete expired rooms
  await db.prepare('DELETE FROM rooms WHERE expires_at < ?').bind(now).run()

  // Delete expired direct messages
  await db.prepare('DELETE FROM direct_messages WHERE expires_at < ?').bind(now).run()

  // Clean up old typing indicators
  const fiveSecondsAgo = now - 5000
  await db.prepare('DELETE FROM typing_indicators WHERE started_at < ?').bind(fiveSecondsAgo).run()

  return { cleaned_at: now }
}
