import { NextRequest, NextResponse } from 'next/server'
import { D1Database } from '@cloudflare/workers-types'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { getTimestamp } from '@/lib/d1-client'

export const runtime = 'edge'

interface CloudflareEnv {
  DB?: D1Database
  echo?: D1Database
}

// Get profile picture
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
      .prepare('SELECT * FROM profile_pictures WHERE user_id = ?')
      .bind(userId)
      .first()

    if (!result) {
      return NextResponse.json({ success: true, picture: null })
    }

    return NextResponse.json({
      success: true,
      picture: {
        userId: result.user_id,
        dataUrl: result.data_url,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      },
    })
  } catch (error) {
    console.error('[v0] Error getting profile picture:', error)
    return NextResponse.json(
      { error: 'Failed to get profile picture', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Upload/update profile picture
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { userId: string; dataUrl: string }
    const { userId, dataUrl } = body
    
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!userId || !dataUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate data URL format
    if (!dataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data URL' }, { status: 400 })
    }

    const now = getTimestamp()

    // Insert or update profile picture
    await db
      .prepare(`
        INSERT INTO profile_pictures (user_id, data_url, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          data_url = excluded.data_url,
          updated_at = excluded.updated_at
      `)
      .bind(userId, dataUrl, now, now)
      .run()

    return NextResponse.json({
      success: true,
      picture: {
        userId,
        dataUrl,
        updatedAt: now,
      },
    })
  } catch (error) {
    console.error('[v0] Error uploading profile picture:', error)
    return NextResponse.json(
      { error: 'Failed to upload profile picture', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Delete profile picture
export async function DELETE(request: NextRequest) {
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

    await db
      .prepare('DELETE FROM profile_pictures WHERE user_id = ?')
      .bind(userId)
      .run()

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[v0] Error deleting profile picture:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile picture', details: (error as Error).message },
      { status: 500 }
    )
  }
}
