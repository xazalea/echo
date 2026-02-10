import { NextRequest, NextResponse } from 'next/server'
import { createRoom, getRoom } from '@/lib/d1-client'
import { D1Database } from '@cloudflare/workers-types'

export const runtime = 'edge'

interface CloudflareEnv {
  DB: D1Database
}

export async function POST(request: NextRequest) {
  try {
    const { code, createdBy } = await request.json()
    const db = (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const room = await createRoom(db, code, createdBy)

    return NextResponse.json({
      success: true,
      room,
    })
  } catch (error) {
    console.error('[v0] Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const db = (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!code) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 })
    }

    const room = await getRoom(db, code) as { id: string; code: string; created_at: number; expires_at: number } | null

    if (!room) {
      return NextResponse.json({ error: 'Room not found or expired' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      room,
    })
  } catch (error) {
    console.error('[v0] Error fetching room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room', details: (error as Error).message },
      { status: 500 }
    )
  }
}
