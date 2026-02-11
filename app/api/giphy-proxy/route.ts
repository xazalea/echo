import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const GIPHY_API_KEY = '6zzmXysXbC6FVLIrBCIeQUTEjtl9DNN5'
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs'

// Proxy endpoint for Giphy - runs on Cloudflare Edge
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = searchParams.get('limit') || '25'
    const offset = searchParams.get('offset') || '0'
    const endpoint = searchParams.get('endpoint') || 'search'

    if (!query && endpoint === 'search') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    let giphyUrl = ''
    
    if (endpoint === 'trending') {
      giphyUrl = `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=pg-13`
    } else {
      giphyUrl = `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query || '')}&limit=${limit}&offset=${offset}&rating=pg-13`
    }

    const response = await fetch(giphyUrl)
    const data = await response.json() as { data: any[]; pagination: any }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from Giphy', details: data },
        { status: response.status }
      )
    }

    // Transform the response to simplify client usage
    const gifs = (data.data || []).map((gif: any) => ({
      id: gif.id,
      title: gif.title,
      url: gif.images.fixed_height.url,
      preview: gif.images.fixed_height_small.url,
      width: gif.images.fixed_height.width,
      height: gif.images.fixed_height.height,
    }))

    return NextResponse.json({
      success: true,
      gifs,
      pagination: data.pagination,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('[Giphy Proxy] Error:', error)
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
