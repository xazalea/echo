import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Cloudflare Pages Cron trigger - calls cleanup endpoint
// Configure in Cloudflare Pages dashboard: Settings -> Functions -> Cron Triggers
// Example: */5 * * * * (every 5 minutes)
export async function GET(request: NextRequest) {
  try {
    // Get the origin from the request
    const origin = request.headers.get('origin') || new URL(request.url).origin
    
    // Call the cleanup endpoint
    const response = await fetch(`${origin}/api/cleanup`, {
      method: 'POST',
    })
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup triggered',
      result: data,
    })
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
