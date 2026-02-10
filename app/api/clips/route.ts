import { NextRequest, NextResponse } from 'next/server'
import { clipMessage, getClips } from '@/lib/d1-client'
import { D1Database } from '@cloudflare/workers-types'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

interface CloudflareEnv {
  DB: D1Database
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = ctx?.env?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const clips = await getClips(db, userId)

    return NextResponse.json({
      success: true,
      clips,
    })
  } catch (error) {
    console.error('[v0] Error fetching clips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clips', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, messageId, messageContent, originalUsername, roomCode } = await request.json()
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = ctx?.env?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!userId || !messageId || !messageContent || !originalUsername || !roomCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const clip = await clipMessage(db, userId, messageId, messageContent, originalUsername, roomCode)

    return NextResponse.json({
      success: true,
      clip,
    })
  } catch (error) {
    console.error('[v0] Error creating clip:', error)
    return NextResponse.json(
      { error: 'Failed to create clip', details: (error as Error).message },
      { status: 500 }
    )
  }
}
