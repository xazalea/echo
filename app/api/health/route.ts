import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { D1Database } from '@cloudflare/workers-types'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const ctx = getRequestContext()
    
    // Check context
    const hasContext = !!ctx
    const contextKeys = ctx?.env ? Object.keys(ctx.env) : []
    const requestEnvKeys = (request as any).env ? Object.keys((request as any).env) : []
    
    // Try to access database
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB
    
    let dbStatus = 'not_available'
    let dbError = null
    let tableCheck = null
    
    if (db) {
      try {
        // Try a simple query to check if database is accessible
        const result = await (db as D1Database).prepare('SELECT name FROM sqlite_master WHERE type="table" LIMIT 1').first()
        dbStatus = 'connected'
        
        // Check if rooms table exists
        const tablesResult = await (db as D1Database).prepare('SELECT name FROM sqlite_master WHERE type="table"').all()
        const tableNames = (tablesResult.results || []).map((t: any) => t.name)
        tableCheck = {
          exists: tableNames.length > 0,
          tables: tableNames,
          hasRoomsTable: tableNames.includes('rooms'),
        }
      } catch (error) {
        dbStatus = 'error'
        dbError = error instanceof Error ? error.message : String(error)
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      database: {
        status: dbStatus,
        error: dbError,
        tableCheck,
      },
      context: {
        hasContext,
        contextKeys,
        requestEnvKeys,
        bindingFound: !!db,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    }, { status: 500 })
  }
}
