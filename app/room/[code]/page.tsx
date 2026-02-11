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
import { Bookmark, Users, LogOut, Copy, Check, User as UserIcon } from 'lucide-react'

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
      <div className="relative flex min-h-screen items-center justify-center bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_50%)]" />
        <div className="relative z-10 text-muted-foreground">{'Loading...'}</div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen flex-col bg-background overflow-hidden">
      <div className="absolute inset-0 bg-gradient-enhanced" />
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute inset-0 bg-dots-pattern" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/80" />
      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-light text-2xl tracking-tight text-foreground">
              echo<span className="text-muted-foreground">.</span>
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-4 py-2 font-mono text-sm transition-all hover:border-foreground/50 hover:bg-muted shadow-sm hover:shadow group"
              >
                <span className="font-semibold tracking-wide">{resolvedParams.code}</span>
                {copied ? (
                  <Check className="h-4 w-4 text-foreground" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowUsers(!showUsers)}
              variant="ghost"
              size="sm"
              className={`gap-2 h-9 rounded-lg border border-border/50 bg-transparent text-foreground hover:border-foreground/50 hover:bg-accent transition-all ${showUsers ? 'bg-accent border-foreground/30' : ''}`}
            >
              <Users className="h-4 w-4" />
              <span className="font-medium text-sm">{users.length}</span>
            </Button>
            <Button
              onClick={() => setShowClips(!showClips)}
              variant="ghost"
              size="sm"
              className={`gap-2 h-9 rounded-lg border border-border/50 bg-transparent text-foreground hover:border-foreground/50 hover:bg-accent transition-all ${showClips ? 'bg-accent border-foreground/30' : ''}`}
            >
              <Bookmark className="h-4 w-4" />
              <span className="font-medium text-sm">{'Clips'}</span>
            </Button>
            <Button
              onClick={handleLeaveRoom}
              variant="ghost"
              size="sm"
              className="gap-2 h-9 px-3 rounded-lg border border-border/50 bg-transparent text-foreground hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium text-sm">{'Leave'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
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
          <div className="w-72 border-l border-border/50 bg-card/50 backdrop-blur-sm p-5">
            <div className="mb-5 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                {'Active Users'}
              </h3>
              <span className="ml-auto rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground">
                {users.length}
              </span>
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-4 py-3 transition-all hover:border-border hover:bg-background"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 border border-border/50 text-xs font-semibold text-foreground">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">{u.username}</span>
                  {u.isTyping && (
                    <span className="text-xs text-muted-foreground italic">
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
