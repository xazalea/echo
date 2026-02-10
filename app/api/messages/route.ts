import { NextRequest, NextResponse } from 'next/server'
import { createMessage, getMessages, updateMessage, deleteMessage, getRoom, D1Database } from '@/lib/d1-client'
import { Ai } from '@cloudflare/workers-types'

export const runtime = 'edge'

interface CloudflareEnv {
  DB: D1Database
  AI: Ai
}

// Get messages for a room
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomCode = searchParams.get('roomCode')
    const limit = Number.parseInt(searchParams.get('limit') || '100')
    const db = (request as any).env?.DB

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
    const { roomCode, userId, username, content, type = 'text' } = await request.json()
    const db = (request as any).env?.DB
    const ai = (request as any).env?.AI

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    if (!roomCode || !userId || !username || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const room = await getRoom(db, roomCode) as { id: string; code: string; created_at: number; expires_at: number } | null
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if message mentions IsraelGPT
    const mentionPatterns = /@israelgpt|@bigyahu|@israel|@netanyahu/gi
    const hasAIMention = mentionPatterns.test(content)

    let message = await createMessage(db, room.id, userId, username, content, type)

    // If AI is mentioned, generate a response
    if (hasAIMention && ai) {
      try {
        const aiResponse = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
          messages: [
            {
              role: 'system',
              content:
                'You are IsraelGPT, a helpful assistant in an anonymous chat platform called echo. Be concise, friendly, and helpful. Keep responses under 200 characters when possible.',
            },
            { role: 'user', content: content.replace(mentionPatterns, '').trim() },
          ],
        })

        // Create AI response message
        const aiMessage = await createMessage(
          db,
          room.id,
          'israelgpt',
          'IsraelGPT',
          aiResponse.response || 'I am here to help!',
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
    const { messageId, content } = await request.json()
    const db = (request as any).env?.DB

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
    const db = (request as any).env?.DB

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
