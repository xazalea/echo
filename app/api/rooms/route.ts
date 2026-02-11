import { NextRequest, NextResponse } from 'next/server'
import { createRoom, getRoom } from '@/lib/d1-client'
import { D1Database } from '@cloudflare/workers-types'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

interface CloudflareEnv {
  DB?: D1Database
  echo?: D1Database
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { code?: string; createdBy?: string }
    const { code, createdBy } = body
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      console.error('[echo] Database not available. Context:', {
        hasContext: !!ctx,
        contextEnv: ctx?.env ? Object.keys(ctx.env) : null,
        requestEnv: (request as any).env ? Object.keys((request as any).env) : null,
      })
      return NextResponse.json({ 
        error: 'Database not available',
        debug: {
          hasContext: !!ctx,
          contextKeys: ctx?.env ? Object.keys(ctx.env) : null,
        }
      }, { status: 500 })
    }

    // If custom code provided, check if it already exists
    if (code) {
      try {
        const existingRoom = await getRoom(db, code) as { id: string; code: string; created_at: number; expires_at: number } | null
        if (existingRoom) {
          return NextResponse.json({
            success: true,
            room: existingRoom,
          })
        }
      } catch (dbError) {
        console.error('[echo] Error checking existing room:', dbError)
        // Continue to create new room if check fails
      }
    }

    let room
    try {
      room = await createRoom(db, code, createdBy || 'system')
    } catch (dbError) {
      console.error('[echo] Error creating room in database:', dbError)
      const dbErrorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      
      // Check if it's a table missing error
      if (dbErrorMessage.includes('no such table') || dbErrorMessage.includes('does not exist')) {
        return NextResponse.json({
          error: 'Database tables not initialized',
          details: 'Please run database migrations: pnpm db:migrate',
          hint: 'The rooms table does not exist. Run: wrangler d1 execute echo-db --file=./scripts/setup-d1-database.sql'
        }, { status: 500 })
      }
      
      throw dbError // Re-throw if it's a different error
    }

    return NextResponse.json({
      success: true,
      room,
    })
  } catch (error) {
    console.error('[echo] Error creating room:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: 'Failed to create room', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      console.error('[echo] Database not available in GET. Context:', {
        hasContext: !!ctx,
        contextEnv: ctx?.env ? Object.keys(ctx.env) : null,
        requestEnv: (request as any).env ? Object.keys((request as any).env) : null,
      })
      return NextResponse.json({ 
        error: 'Database not available',
        debug: {
          hasContext: !!ctx,
          contextKeys: ctx?.env ? Object.keys(ctx.env) : null,
        }
      }, { status: 500 })
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
    console.error('[echo] Error fetching room:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: 'Failed to fetch room', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
