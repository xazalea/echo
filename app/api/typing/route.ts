import { NextRequest, NextResponse } from 'next/server'
import { setTyping, clearTyping, getRoom } from '@/lib/d1-client'
import { D1Database } from '@cloudflare/workers-types'

export const runtime = 'edge'

interface CloudflareEnv {
  DB: D1Database
}

export async function POST(request: NextRequest) {
  try {
    const { roomCode, userId, username, isTyping } = await request.json()
    const db = (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!roomCode || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const room = await getRoom(db, roomCode)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (isTyping) {
      await setTyping(db, room.id, userId, username)
    } else {
      await clearTyping(db, room.id, userId)
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[v0] Error updating typing status:', error)
    return NextResponse.json(
      { error: 'Failed to update typing status', details: (error as Error).message },
      { status: 500 }
    )
  }
}
