'use client'

// Edge runtime configuration for Cloudflare Pages
export const runtime = 'edge'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat-interface'
import { ClipsLibrary } from '@/components/clips-library'
import type { Message, User } from '@/lib/types'
import { requestNotificationPermission, showNotification } from '@/lib/chat-utils'
import { Button } from '@/components/ui/button'
import { Bookmark, Users, LogOut, Copy, Check } from 'lucide-react'

interface PageProps {
  params: Promise<{
    code: string
  }>
}

export default function RoomPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [user, setUser] = useState<{ userId: string; username: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showClips, setShowClips] = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expiresAt] = useState(new Date(Date.now() + 60 * 60 * 1000)) // 1 hour from now
  const notificationPermissionRequested = useRef(false)

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('echo_user')
    if (!storedUser) {
      router.push('/')
      return
    }

    const userData = JSON.parse(storedUser)
    setUser(userData)

    // Request notification permission
    if (!notificationPermissionRequested.current) {
      notificationPermissionRequested.current = true
      requestNotificationPermission().then(granted => {
        if (granted) {
          console.log('[v0] Notification permission granted')
        }
      })
    }

    // Simulate user joining
    const newUser: User = {
      id: userData.userId,
      username: userData.username,
      isTyping: false
    }
    setUsers([newUser])

    // Show notification for room joined
    if (document.hidden) {
      showNotification('echo.', `You joined room ${resolvedParams.code}`)
    }
  }, [resolvedParams.code, router])

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(resolvedParams.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeaveRoom = () => {
    localStorage.removeItem('echo_user')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">{'Loading...'}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-light text-2xl tracking-tight text-foreground">
              echo<span className="text-muted-foreground">.</span>
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 rounded border border-border bg-muted px-3 py-1.5 font-mono text-sm transition-colors hover:border-foreground"
              >
                <span>{resolvedParams.code}</span>
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowUsers(!showUsers)}
              variant="ghost"
              size="sm"
              className="gap-2 border border-border bg-transparent text-foreground hover:border-foreground hover:bg-accent"
            >
              <Users className="h-4 w-4" />
              <span>{users.length}</span>
            </Button>
            <Button
              onClick={() => setShowClips(!showClips)}
              variant="ghost"
              size="sm"
              className="gap-2 border border-border bg-transparent text-foreground hover:border-foreground hover:bg-accent"
            >
              <Bookmark className="h-4 w-4" />
              <span>{'Clips'}</span>
            </Button>
            <Button
              onClick={handleLeaveRoom}
              variant="ghost"
              size="sm"
              className="gap-2 border border-border bg-transparent text-foreground hover:border-foreground hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface
            roomCode={resolvedParams.code}
            userId={user.userId}
            username={user.username}
            messages={messages}
            setMessages={setMessages}
            users={users}
            expiresAt={expiresAt}
          />
        </div>

        {/* Clips Sidebar */}
        {showClips && (
          <div className="w-80 border-l border-border bg-card">
            <ClipsLibrary />
          </div>
        )}

        {/* Users Sidebar */}
        {showUsers && (
          <div className="w-64 border-l border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-medium text-foreground">
              {'Active Users'}
            </h3>
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded border border-border bg-background px-3 py-2"
                >
                  <div className="h-2 w-2 rounded-full bg-foreground" />
                  <span className="text-sm text-foreground">{u.username}</span>
                  {u.isTyping && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {'typing...'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
