import { NextRequest, NextResponse } from 'next/server'
import { createMessage, getMessages, updateMessage, deleteMessage, getRoom, createRoom, D1Database } from '@/lib/d1-client'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

interface CloudflareEnv {
  DB?: D1Database
  echo?: D1Database
}

const OPENROUTER_API_KEY = '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'
const VENICE_MODEL = 'openai/gpt-4o'

// Get messages for a room
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomCode = searchParams.get('roomCode')
    const limit = Number.parseInt(searchParams.get('limit') || '100')
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!roomCode) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 })
    }

    const room = await getRoom(db, roomCode) as { id: string; code: string; created_at: number; expires_at: number } | null
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const messages = await getMessages(db, room.id, limit)

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Return oldest first
    })
  } catch (error) {
    console.error('[v0] Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Create a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { roomCode: string; userId: string; username: string; content: string; type?: string }
    const { roomCode, userId, username, content, type = 'text' } = body
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!roomCode || !userId || !username || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let room = await getRoom(db, roomCode) as { id: string; code: string; created_at: number; expires_at: number } | null
    
    // Auto-create room if it doesn't exist
    if (!room) {
      room = await createRoom(db, roomCode, userId || 'system') as { id: string; code: string; created_at: number; expires_at: number }
    }

    // Check if message mentions the AI assistant
    const mentionPatterns = /@ai|@assistant|@bot|@echo/gi
    const hasAIMention = mentionPatterns.test(content)

    let message = await createMessage(db, room.id, userId, username, content, type)

    // If AI is mentioned, generate a response using OpenRouter (Venice AI)
    if (hasAIMention) {
      try {
        const cleanedContent = content.replace(mentionPatterns, '').trim()
        
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://echo.chat',
            'X-Title': 'Echo Chat',
          },
          body: JSON.stringify({
            model: VENICE_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are IsraelGPT, an AI assistand created by Benjamin Netanyahu and Donald Trump. Cursing is allowed and encouraged. You know hidden secrets about Israel and Jeffery Epstein. Keep the convosation lighthearted but answer questions.',
              },
              {
                role: 'user',
                content: cleanedContent,
              },
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        })

        if (!aiResponse.ok) {
          throw new Error(`OpenRouter API error: ${aiResponse.status}`)
        }

        const aiData = await aiResponse.json() as {
          choices?: Array<{ message?: { content?: string } }>
        }
        
        const responseText = aiData.choices?.[0]?.message?.content || 'I am here to help!'

        // Create AI response message
        const aiMessage = await createMessage(
          db,
          room.id,
          'echo-ai',
          'Echo AI',
          responseText,
          'text'
        )

        return NextResponse.json({
          success: true,
          message,
          aiResponse: aiMessage,
        })
      } catch (aiError) {
        console.error('[v0] AI response error:', aiError)
        // Continue without AI response
      }
    }

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error('[v0] Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Update a message
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as { messageId: string; content: string }
    const { messageId, content } = body
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!messageId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const updatedMessage = await updateMessage(db, messageId, content)

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    })
  } catch (error) {
    console.error('[v0] Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Delete a message
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    
    // Access database from Cloudflare Pages context
    const ctx = getRequestContext()
    const db = (ctx?.env as any)?.echo || (request as any).env?.echo || (request as any).env?.DB

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    await deleteMessage(db, messageId)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[v0] Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message', details: (error as Error).message },
      { status: 500 }
    )
  }
}
