import { NextRequest, NextResponse } from 'next/server'
import { D1Database } from '@cloudflare/workers-types'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { generateId, getTimestamp, getExpiryTimestamp } from '@/lib/d1-client'

export const runtime = 'edge'

interface CloudflareEnv {
  DB?: D1Database
  echo?: D1Database
}

// Send a direct message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { 
      fromUserId: string
      fromUsername: string
      toUserId: string
      toUsername: string
      content: string
    }
    const { fromUserId, fromUsername, toUserId, toUsername, content } = body
    
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!fromUserId || !fromUsername || !toUserId || !toUsername || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = generateId()
    const now = getTimestamp()
    const expiresAt = getExpiryTimestamp(24) // DMs expire in 24 hours

    await db
      .prepare(
        'INSERT INTO direct_messages (id, from_user_id, from_username, to_user_id, to_username, content, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, fromUserId, fromUsername, toUserId, toUsername, content, now, expiresAt)
      .run()

    return NextResponse.json({
      success: true,
      message: {
        id,
        from_user_id: fromUserId,
        from_username: fromUsername,
        to_user_id: toUserId,
        to_username: toUsername,
        content,
        created_at: now,
      },
    })
  } catch (error) {
    console.error('[v0] Error sending DM:', error)
    return NextResponse.json(
      { error: 'Failed to send direct message', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Get direct messages for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await db
      .prepare(
        'SELECT * FROM direct_messages WHERE (to_user_id = ? OR from_user_id = ?) AND expires_at > ? ORDER BY created_at DESC LIMIT 50'
      )
      .bind(userId, userId, getTimestamp())
      .all()

    return NextResponse.json({
      success: true,
      messages: result.results || [],
    })
  } catch (error) {
    console.error('[v0] Error fetching DMs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch direct messages', details: (error as Error).message },
      { status: 500 }
    )
  }
}
