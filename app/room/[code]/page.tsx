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
import { Bookmark, Users, LogOut, Copy, Check, User as UserIcon, X } from 'lucide-react'

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
  const [expiresAt] = useState(new Date(Date.now() + 60 * 60 * 1000))
  const notificationPermissionRequested = useRef(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('echo_user')
    if (!storedUser) {
      router.push('/')
      return
    }

    const userData = JSON.parse(storedUser)
    setUser(userData)

    if (!notificationPermissionRequested.current) {
      notificationPermissionRequested.current = true
      requestNotificationPermission()
    }

    const newUser: User = {
      id: userData.userId,
      username: userData.username,
      isTyping: false
    }
    setUsers([newUser])
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
        <div className="text-muted-foreground/60 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-md px-4 py-2.5 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-light text-xl tracking-tight text-foreground">
              echo<span className="text-muted-foreground/50">.</span>
            </h1>
            <div className="h-4 w-px bg-border/30" />
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-md bg-muted/20 border border-border/20 px-2.5 py-1.5 font-mono text-xs transition-all hover:border-border/40 hover:bg-muted/30 group"
            >
              <span className="font-semibold tracking-wider text-foreground/80">{resolvedParams.code}</span>
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setShowUsers(!showUsers); setShowClips(false) }}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs transition-colors ${
                showUsers 
                  ? 'bg-muted/40 text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium">{users.length}</span>
            </button>
            <button
              onClick={() => { setShowClips(!showClips); setShowUsers(false) }}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs transition-colors ${
                showClips 
                  ? 'bg-muted/40 text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span className="font-medium">Clips</span>
            </button>
            <div className="h-4 w-px bg-border/20 mx-0.5" />
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="font-medium">Leave</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Interface */}
        <div className="flex-1 min-w-0">
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
          <div className="w-72 border-l border-border/30 bg-card/30 backdrop-blur-sm flex-shrink-0">
            <ClipsLibrary onClose={() => setShowClips(false)} />
          </div>
        )}

        {/* Users Sidebar */}
        {showUsers && (
          <div className="w-64 border-l border-border/30 bg-card/30 backdrop-blur-sm flex-shrink-0">
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">Online</h3>
                <span className="text-[10px] text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded">
                  {users.length}
                </span>
              </div>
              <button
                onClick={() => setShowUsers(false)}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors hover:bg-muted/20"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/30 border border-border/20 text-[10px] font-semibold text-foreground/70">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-foreground/80 block truncate">{u.username}</span>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500/60 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
