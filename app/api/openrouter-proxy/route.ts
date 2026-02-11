import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const OPENROUTER_API_KEY = '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'

// Proxy endpoint for OpenRouter - runs on Cloudflare Edge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://echo.chat',
        'X-Title': 'Echo Chat',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Proxy error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
