import { NextRequest, NextResponse } from 'next/server'
import { setTyping, clearTyping, getRoom } from '@/lib/d1-client'
import { D1Database } from '@cloudflare/workers-types'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

interface CloudflareEnv {
  DB?: D1Database
  echo?: D1Database
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { roomCode: string; userId: string; username: string; isTyping: boolean }
    const { roomCode, userId, username, isTyping } = body
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!roomCode || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const room = await getRoom(db, roomCode) as { id: string; code: string; created_at: number; expires_at: number } | null
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
