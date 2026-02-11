'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateRoomCode, generateUserId } from '@/lib/chat-utils'
import { ProfilePictureUpload } from '@/components/profile-picture-upload'
import { Plus, LogIn, ArrowLeft, Clock, User } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [customRoomCode, setCustomRoomCode] = useState('')
  const [username, setUsername] = useState('')
  const [mode, setMode] = useState<'home' | 'join' | 'create'>('home')
  const [loading, setLoading] = useState(false)
  const [showProfileUpload, setShowProfileUpload] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  useEffect(() => {
    // Load profile picture if user exists
    const storedUser = localStorage.getItem('echo_user')
    if (storedUser) {
      const { userId } = JSON.parse(storedUser)
      fetch(`/api/profile-picture?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.picture) {
            setProfilePicture(data.picture.dataUrl)
          }
        })
        .catch(console.error)
    }
  }, [])

  const handleUploadProfilePicture = async (dataUrl: string) => {
    const storedUser = localStorage.getItem('echo_user')
    if (!storedUser) return

    const { userId } = JSON.parse(storedUser)
    
    try {
      const response = await fetch('/api/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, dataUrl }),
      })
      
      const data = await response.json()
      if (data.success) {
        setProfilePicture(dataUrl)
      }
    } catch (error) {
      console.error('[echo] Error uploading profile picture:', error)
    }
  }

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !username.trim() || loading) return
    setLoading(true)
    
    const userId = generateUserId()
    localStorage.setItem('echo_user', JSON.stringify({ userId, username }))
    
    try {
      const response = await fetch(`/api/rooms?code=${roomCode.toUpperCase()}`)
      const data = await response.json() as { success: boolean; room?: { code: string }; error?: string }
      
      if (data.success) {
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
        // Still navigate - room will auto-create on first message
        router.push(`/room/${roomCode.toUpperCase()}`)
      }
    } catch (error) {
      console.error('Error joining room:', error)
      router.push(`/room/${roomCode.toUpperCase()}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!username.trim() || loading) return
    setLoading(true)
    
    const userId = generateUserId()
    localStorage.setItem('echo_user', JSON.stringify({ userId, username }))
    
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: customRoomCode.trim().toUpperCase() || undefined,
          createdBy: userId,
        }),
      })
      
      const data = await response.json() as { success: boolean; room?: { code: string }; error?: string }
      
      if (data.success && data.room) {
        router.push(`/room/${data.room.code}`)
      } else {
        // Fallback: generate local code and navigate
        const fallbackCode = customRoomCode.trim().toUpperCase() || generateRoomCode()
        router.push(`/room/${fallbackCode}`)
      }
    } catch (error) {
      console.error('Error creating room:', error)
      const fallbackCode = customRoomCode.trim().toUpperCase() || generateRoomCode()
      router.push(`/room/${fallbackCode}`)
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'home') {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-enhanced" />
        
        {/* Profile Picture Button - Top Left */}
        <button
          onClick={() => setShowProfileUpload(true)}
          className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full border-2 border-border/30 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all flex items-center justify-center overflow-hidden"
        >
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        
        <div className="relative z-10 w-full max-w-sm space-y-10">
          {/* Logo */}
          <div className="text-center space-y-2">
            <h1 className="font-light text-6xl tracking-tight text-foreground">
              echo<span className="text-muted-foreground/40">.</span>
            </h1>
            <p className="text-xs text-muted-foreground/50">
              Anonymous ephemeral messaging
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              onClick={() => setMode('create')}
              className="h-12 w-full rounded-lg border border-border/30 bg-card/50 text-foreground transition-all hover:border-border/50 hover:bg-card flex items-center justify-center gap-2.5 text-sm font-medium"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className="h-12 w-full rounded-lg border border-border/30 bg-card/50 text-foreground transition-all hover:border-border/50 hover:bg-card flex items-center justify-center gap-2.5 text-sm font-medium"
            >
              <LogIn className="h-4 w-4 text-muted-foreground" />
              Join Room
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-[11px] text-muted-foreground/30 flex items-center justify-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>Messages expire after 1 hour</span>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-enhanced" />
        <div className="relative z-10 w-full max-w-sm space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode('home')}
              className="mb-6 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
            <h1 className="font-light text-3xl tracking-tight text-foreground">
              Join Room
            </h1>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="room-code" className="text-xs font-medium text-muted-foreground/70">
                Room Code
              </Label>
              <Input
                id="room-code"
                placeholder="Enter code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={20}
                className="h-11 rounded-lg border-border/30 bg-card/50 text-center text-sm font-mono uppercase tracking-widest text-foreground placeholder:text-muted-foreground/30 focus:border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium text-muted-foreground/70">
                Username
              </Label>
              <Input
                id="username"
                placeholder="Choose a name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="h-11 rounded-lg border-border/30 bg-card/50 text-foreground text-sm placeholder:text-muted-foreground/30 focus:border-border/50"
              />
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={!roomCode.trim() || !username.trim() || loading}
              className="h-11 w-full rounded-lg bg-foreground text-background transition-all hover:bg-foreground/90 disabled:opacity-20 flex items-center justify-center gap-2 text-sm font-medium"
            >
              {loading ? 'Joining...' : 'Join Room'}
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
        <div className="relative z-10 w-full max-w-sm space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode('home')}
              className="mb-6 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
            <h1 className="font-light text-3xl tracking-tight text-foreground">
              Create Room
            </h1>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username-create" className="text-xs font-medium text-muted-foreground/70">
                Username
              </Label>
              <Input
                id="username-create"
                placeholder="Choose a name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="h-11 rounded-lg border-border/30 bg-card/50 text-foreground text-sm placeholder:text-muted-foreground/30 focus:border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-code-create" className="text-xs font-medium text-muted-foreground/70">
                Room Code <span className="text-muted-foreground/30">(optional)</span>
              </Label>
              <Input
                id="room-code-create"
                placeholder="Leave blank for random"
                value={customRoomCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  setCustomRoomCode(value)
                  setRoomCode(value)
                }}
                maxLength={20}
                className="h-11 rounded-lg border-border/30 bg-card/50 text-center text-sm font-mono uppercase tracking-widest text-foreground placeholder:text-muted-foreground/30 placeholder:normal-case placeholder:tracking-normal focus:border-border/50"
              />
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={!username.trim() || loading}
              className="h-11 w-full rounded-lg bg-foreground text-background transition-all hover:bg-foreground/90 disabled:opacity-20 flex items-center justify-center gap-2 text-sm font-medium"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {showProfileUpload && (
        <ProfilePictureUpload
          currentPicture={profilePicture || undefined}
          onUpload={handleUploadProfilePicture}
          onClose={() => setShowProfileUpload(false)}
        />
      )}
    </>
  )
}
