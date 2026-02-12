import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

interface CloudflareEnv {
  DB?: D1Database
  echo?: D1Database
}

interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave'
  roomCode: string
  userId: string
  username: string
  targetUserId?: string
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

// Store active connections in-memory (for this edge instance)
const activeConnections = new Map<string, Set<string>>()

export async function POST(request: NextRequest) {
  try {
    const { env } = getRequestContext() as { env: CloudflareEnv }
    const db = (env.DB || env.echo) as D1Database

    const signal = await request.json() as SignalMessage
    const { type, roomCode, userId, username, targetUserId, offer, answer, candidate } = signal

    if (!roomCode || !userId) {
      return NextResponse.json({ error: 'Missing roomCode or userId' }, { status: 400 })
    }

    // Store signal in database for retrieval
    const signalId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await db
      .prepare(
        'INSERT INTO webrtc_signals (id, room_code, from_user_id, to_user_id, signal_type, signal_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        signalId,
        roomCode,
        userId,
        targetUserId || 'broadcast',
        type,
        JSON.stringify({ offer, answer, candidate, username }),
        Date.now()
      )
      .run()

    // Track active users
    if (type === 'join') {
      if (!activeConnections.has(roomCode)) {
        activeConnections.set(roomCode, new Set())
      }
      activeConnections.get(roomCode)!.add(userId)
    } else if (type === 'leave') {
      activeConnections.get(roomCode)?.delete(userId)
    }

    // Get list of active users in room
    const activeUsers = Array.from(activeConnections.get(roomCode) || [])

    return NextResponse.json({
      success: true,
      signalId,
      activeUsers,
    })
  } catch (error) {
    console.error('[WebRTC Signal] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process signal', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext() as { env: CloudflareEnv }
    const db = (env.DB || env.echo) as D1Database

    const { searchParams } = new URL(request.url)
    const roomCode = searchParams.get('roomCode')
    const userId = searchParams.get('userId')
    const since = searchParams.get('since') || '0'

    if (!roomCode || !userId) {
      return NextResponse.json({ error: 'Missing roomCode or userId' }, { status: 400 })
    }

    // Get signals for this user (targeted to them or broadcast)
    const signals = await db
      .prepare(
        'SELECT * FROM webrtc_signals WHERE room_code = ? AND (to_user_id = ? OR to_user_id = ?) AND created_at > ? ORDER BY created_at ASC LIMIT 50'
      )
      .bind(roomCode, userId, 'broadcast', parseInt(since))
      .all()

    // Delete retrieved signals to avoid re-processing
    if (signals.results.length > 0) {
      const signalIds = signals.results.map((s: any) => s.id)
      await db
        .prepare(`DELETE FROM webrtc_signals WHERE id IN (${signalIds.map(() => '?').join(',')})`)
        .bind(...signalIds)
        .run()
    }

    // Get active users
    const activeUsers = Array.from(activeConnections.get(roomCode) || [])

    return NextResponse.json({
      success: true,
      signals: signals.results.map((s: any) => ({
        id: s.id,
        fromUserId: s.from_user_id,
        toUserId: s.to_user_id,
        type: s.signal_type,
        data: JSON.parse(s.signal_data),
        createdAt: s.created_at,
      })),
      activeUsers,
    })
  } catch (error) {
    console.error('[WebRTC Signal] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signals', details: (error as Error).message },
      { status: 500 }
    )
  }
}
