import { NextRequest, NextResponse } from 'next/server'
import { getMessages, getTypingUsers, getRoomUsers, getRoom } from '@/lib/d1-client'
import { D1Database } from '@cloudflare/workers-types'

export const runtime = 'edge'

interface CloudflareEnv {
  DB: D1Database
}

// Long polling endpoint for real-time updates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomCode = searchParams.get('roomCode')
    const lastMessageId = searchParams.get('lastMessageId')
    const userId = searchParams.get('userId')
    const db = (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!roomCode) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 })
    }

    const room = await getRoom(db, roomCode) as { id: string; code: string; created_at: number; expires_at: number } | null
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get new messages since lastMessageId
    const messages = await getMessages(db, room.id, 50)
    
    // Filter messages newer than lastMessageId if provided
    const newMessages = lastMessageId
      ? messages.filter((msg: any) => msg.id > lastMessageId)
      : messages

    // Get typing indicators
    const typingUsers = await getTypingUsers(db, room.id)
    
    // Filter out current user from typing indicators
    const otherTyping = typingUsers.filter((user: any) => user.user_id !== userId)

    // Get online users
    const onlineUsers = await getRoomUsers(db, room.id)

    return NextResponse.json({
      success: true,
      messages: newMessages,
      typingUsers: otherTyping,
      onlineUsers,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('[v0] Error in polling:', error)
    return NextResponse.json(
      { error: 'Failed to poll updates', details: (error as Error).message },
      { status: 500 }
    )
  }
}
