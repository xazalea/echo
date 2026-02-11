import { NextRequest, NextResponse } from 'next/server'
import { addReaction, getReactionsForMessages } from '@/lib/d1-client'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

// Add/toggle a reaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      messageId: string
      userId: string
      username: string
      emoji: string
    }
    const { messageId, userId, username, emoji } = body

    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!messageId || !userId || !username || !emoji) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await addReaction(db, messageId, userId, username, emoji)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[v0] Error toggling reaction:', error)
    return NextResponse.json(
      { error: 'Failed to toggle reaction', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Get reactions for message IDs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageIds = searchParams.get('messageIds')?.split(',').filter(Boolean) || []

    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const reactions = await getReactionsForMessages(db, messageIds)

    return NextResponse.json({
      success: true,
      reactions,
    })
  } catch (error) {
    console.error('[v0] Error fetching reactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reactions', details: (error as Error).message },
      { status: 500 }
    )
  }
}
