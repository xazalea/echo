import { NextRequest, NextResponse } from 'next/server'
import { D1Database } from '@cloudflare/workers-types'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { getTimestamp } from '@/lib/d1-client'

export const runtime = 'edge'

interface CloudflareEnv {
  DB?: D1Database
  echo?: D1Database
}

// Cleanup inactive rooms and expired data
export async function POST(request: NextRequest) {
  try {
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const now = getTimestamp()
    const inactiveThreshold = now - (5 * 60 * 1000) // 5 minutes

    // Find rooms with no online users for 5+ minutes
    const inactiveRoomsResult = await db
      .prepare(`
        SELECT r.id, r.code 
        FROM rooms r 
        WHERE NOT EXISTS (
          SELECT 1 FROM room_users ru 
          WHERE ru.room_id = r.id 
          AND ru.is_online = 1 
          AND ru.last_seen > ?
        )
      `)
      .bind(inactiveThreshold)
      .all()

    const inactiveRooms = inactiveRoomsResult.results || []

    // Delete messages and users from inactive rooms
    for (const room of inactiveRooms as any[]) {
      await db.prepare('DELETE FROM messages WHERE room_id = ?').bind(room.id).run()
      await db.prepare('DELETE FROM room_users WHERE room_id = ?').bind(room.id).run()
      await db.prepare('DELETE FROM typing_indicators WHERE room_id = ?').bind(room.id).run()
      await db.prepare('DELETE FROM rooms WHERE id = ?').bind(room.id).run()
    }

    // Delete expired messages
    await db.prepare('DELETE FROM messages WHERE expires_at < ?').bind(now).run()

    // Delete expired rooms
    await db.prepare('DELETE FROM rooms WHERE expires_at < ?').bind(now).run()

    // Delete expired direct messages
    await db.prepare('DELETE FROM direct_messages WHERE expires_at < ?').bind(now).run()

    // Clean up old typing indicators (5 seconds)
    const typingThreshold = now - 5000
    await db.prepare('DELETE FROM typing_indicators WHERE started_at < ?').bind(typingThreshold).run()

    return NextResponse.json({
      success: true,
      cleaned: {
        inactiveRooms: inactiveRooms.length,
        timestamp: now,
      },
    })
  } catch (error) {
    console.error('[Cleanup] Error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Can be called via cron or manually
export async function GET(request: NextRequest) {
  return POST(request)
}
