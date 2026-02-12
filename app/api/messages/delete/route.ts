import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

interface CloudflareEnv {
  DB?: D1Database
  echo?: D1Database
}

export async function DELETE(request: NextRequest) {
  try {
    const { env } = getRequestContext() as { env: CloudflareEnv }
    const db = (env.DB || env.echo) as D1Database

    const body = await request.json() as { messageId: string; userId: string }
    const { messageId, userId } = body

    if (!messageId || !userId) {
      return NextResponse.json({ error: 'Missing messageId or userId' }, { status: 400 })
    }

    // Get the message to verify ownership and timestamp
    const message = await db
      .prepare('SELECT * FROM messages WHERE id = ? AND user_id = ? AND is_deleted = 0')
      .bind(messageId, userId)
      .first()

    if (!message) {
      return NextResponse.json({ error: 'Message not found or already deleted' }, { status: 404 })
    }

    // Check if message is within 1 minute
    const now = Date.now()
    const messageTime = message.created_at as number
    const oneMinute = 60 * 1000

    if (now - messageTime > oneMinute) {
      return NextResponse.json({ error: 'Message can only be deleted within 1 minute of sending' }, { status: 403 })
    }

    // Soft delete the message
    await db
      .prepare('UPDATE messages SET is_deleted = 1 WHERE id = ?')
      .bind(messageId)
      .run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message', details: (error as Error).message },
      { status: 500 }
    )
  }
}
