'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateRoomCode, generateUserId } from '@/lib/chat-utils'
import { Plus, LogIn, ArrowLeft, Clock } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [customRoomCode, setCustomRoomCode] = useState('')
  const [username, setUsername] = useState('')
  const [mode, setMode] = useState<'home' | 'join' | 'create'>('home')

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !username.trim()) return
    
    const userId = generateUserId()
    localStorage.setItem('echo_user', JSON.stringify({ userId, username }))
    
    // Verify room exists and join
    try {
      const response = await fetch(`/api/rooms?code=${roomCode.toUpperCase()}`)
      const data = await response.json() as { success: boolean; room?: { code: string }; error?: string }
      
      if (data.success) {
        // Join the room
        await fetch('/api/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: roomCode.toUpperCase(),
            userId,
            username,
          }),
        })
        
        router.push(`/room/${roomCode.toUpperCase()}`)
      } else {
        alert(data.error || 'Room not found')
      }
    } catch (error) {
      console.error('Error joining room:', error)
      // Still navigate - room might be created on first message
      router.push(`/room/${roomCode.toUpperCase()}`)
    }
  }

  const handleCreateRoom = async () => {
    if (!username.trim()) return
    
    const userId = generateUserId()
    localStorage.setItem('echo_user', JSON.stringify({ userId, username }))
    
    // Create room on server
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCode.trim().toUpperCase() || undefined,
          createdBy: userId,
        }),
      })
      
      const data = await response.json() as { success: boolean; room?: { code: string }; error?: string }
      
      if (data.success && data.room) {
        router.push(`/room/${data.room.code}`)
      } else {
        alert(data.error || 'Failed to create room')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room. Please try again.')
    }
  }

  if (mode === 'home') {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-enhanced" />
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute inset-0 bg-dots-pattern" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        <div className="relative z-10 w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center space-y-3">
            <h1 className="font-light text-7xl tracking-tight text-foreground">
              echo<span className="text-muted-foreground">.</span>
            </h1>
            <p className="text-sm text-muted-foreground/80">
              {'Anonymous ephemeral messaging'}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => setMode('create')}
              className="h-14 w-full rounded-xl border border-border/50 bg-card text-foreground shadow-sm transition-all hover:border-foreground/50 hover:bg-accent hover:shadow-md flex items-center justify-center gap-3"
              variant="ghost"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">{'Create Room'}</span>
            </Button>
            <Button
              onClick={() => setMode('join')}
              className="h-14 w-full rounded-xl border border-border/50 bg-card text-foreground shadow-sm transition-all hover:border-foreground/50 hover:bg-accent hover:shadow-md flex items-center justify-center gap-3"
              variant="ghost"
            >
              <LogIn className="h-5 w-5" />
              <span className="font-medium">{'Join Room'}</span>
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-8 text-center text-xs text-muted-foreground/70 flex items-center justify-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>{'All messages expire after 1 hour'}</span>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-enhanced" />
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute inset-0 bg-dots-pattern" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        <div className="relative z-10 w-full max-w-md space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode('home')}
              className="mb-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {'← Back'}
            </button>
            <h1 className="font-light text-4xl tracking-tight text-foreground">
              {'Join Room'}
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="room-code" className="text-sm font-medium text-foreground">
                {'Room Code'}
              </Label>
              <Input
                id="room-code"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={20}
                className="h-12 rounded-xl border-border/50 bg-card text-center text-lg font-mono uppercase tracking-widest text-foreground shadow-sm focus:border-foreground/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                {'Username'}
              </Label>
              <Input
                id="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="h-12 rounded-xl border-border/50 bg-card text-foreground shadow-sm focus:border-foreground/50"
              />
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={!roomCode.trim() || !username.trim()}
              className="h-12 w-full rounded-xl bg-foreground text-background shadow-md transition-all hover:bg-foreground/90 hover:shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="font-medium">{'Join Room'}</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-enhanced" />
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute inset-0 bg-dots-pattern" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        <div className="relative z-10 w-full max-w-md space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode('home')}
              className="mb-6 text-sm text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{'Back'}</span>
            </button>
            <h1 className="font-light text-4xl tracking-tight text-foreground">
              {'Create Room'}
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username-create" className="text-sm font-medium text-foreground">
                {'Username'}
              </Label>
              <Input
                id="username-create"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="h-12 rounded-xl border-border/50 bg-card text-foreground shadow-sm focus:border-foreground/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-code-create" className="text-sm font-medium text-foreground">
                {'Room Code (Optional)'}
              </Label>
              <Input
                id="room-code-create"
                placeholder="Enter custom code or leave blank"
                value={customRoomCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  setCustomRoomCode(value)
                  setRoomCode(value)
                }}
                maxLength={20}
                className="h-12 rounded-xl border-border/50 bg-card text-center text-lg font-mono uppercase tracking-widest text-foreground shadow-sm focus:border-foreground/50"
              />
              <p className="text-xs text-muted-foreground/70">
                {'Leave blank to generate a random code'}
              </p>
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={!username.trim()}
              className="h-12 w-full rounded-xl bg-foreground text-background shadow-md transition-all hover:bg-foreground/90 hover:shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="font-medium">{'Create Room'}</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
