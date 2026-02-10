'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateRoomCode, generateUserId } from '@/lib/chat-utils'

export default function Home() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [username, setUsername] = useState('')
  const [mode, setMode] = useState<'home' | 'join' | 'create'>('home')

  const handleJoinRoom = () => {
    if (!roomCode.trim() || !username.trim()) return
    
    const userId = generateUserId()
    localStorage.setItem('echo_user', JSON.stringify({ userId, username }))
    router.push(`/room/${roomCode.toUpperCase()}`)
  }

  const handleCreateRoom = () => {
    if (!username.trim()) return
    
    const newRoomCode = generateRoomCode()
    const userId = generateUserId()
    localStorage.setItem('echo_user', JSON.stringify({ userId, username }))
    router.push(`/room/${newRoomCode}`)
  }

  if (mode === 'home') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <h1 className="font-light text-6xl tracking-tight text-foreground">
              echo<span className="text-muted-foreground">.</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {'Anonymous ephemeral messaging'}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => setMode('create')}
              className="h-12 w-full border border-border bg-card text-foreground transition-colors hover:border-foreground hover:bg-accent"
              variant="ghost"
            >
              {'Create Room'}
            </Button>
            <Button
              onClick={() => setMode('join')}
              className="h-12 w-full border border-border bg-card text-foreground transition-colors hover:border-foreground hover:bg-accent"
              variant="ghost"
            >
              {'Join Room'}
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-8 text-center text-xs text-muted-foreground">
            {'All messages expire after 1 hour'}
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode('home')}
              className="mb-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {'← Back'}
            </button>
            <h1 className="font-light text-4xl tracking-tight text-foreground">
              {'Join Room'}
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="room-code" className="text-sm text-muted-foreground">
                {'Room Code'}
              </Label>
              <Input
                id="room-code"
                placeholder="Enter 6-digit code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="h-12 border-border bg-card text-center text-lg font-mono uppercase tracking-widest text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-muted-foreground">
                {'Username'}
              </Label>
              <Input
                id="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="h-12 border-border bg-card text-foreground"
              />
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={!roomCode.trim() || !username.trim() || roomCode.length !== 6}
              className="h-12 w-full bg-foreground text-background transition-colors hover:bg-foreground/90 disabled:opacity-30"
            >
              {'Join Room'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode('home')}
              className="mb-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {'← Back'}
            </button>
            <h1 className="font-light text-4xl tracking-tight text-foreground">
              {'Create Room'}
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username-create" className="text-sm text-muted-foreground">
                {'Username'}
              </Label>
              <Input
                id="username-create"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="h-12 border-border bg-card text-foreground"
              />
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={!username.trim()}
              className="h-12 w-full bg-foreground text-background transition-colors hover:bg-foreground/90 disabled:opacity-30"
            >
              {'Create Room'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {'A unique room code will be generated'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
