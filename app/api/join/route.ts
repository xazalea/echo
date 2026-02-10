import { NextRequest, NextResponse } from 'next/server'
import { joinRoom, getRoom } from '@/lib/d1-client'
import { D1Database } from '@cloudflare/workers-types'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

interface CloudflareEnv {
  DB: D1Database
}

export async function POST(request: NextRequest) {
  try {
    const { roomCode, userId, username } = await request.json()
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = ctx?.env?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!roomCode || !userId || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const room = await getRoom(db, roomCode) as { id: string; code: string; created_at: number; expires_at: number } | null
    if (!room) {
      return NextResponse.json({ error: 'Room not found or expired' }, { status: 404 })
    }

    const userRoom = await joinRoom(db, room.id, userId, username)

    return NextResponse.json({
      success: true,
      room,
      user: userRoom,
    })
  } catch (error) {
    console.error('[v0] Error joining room:', error)
    return NextResponse.json(
      { error: 'Failed to join room', details: (error as Error).message },
      { status: 500 }
    )
  }
}
