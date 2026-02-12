'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react'

interface VoiceChatProps {
  roomCode: string
  userId: string
  username: string
}

export function VoiceChat({ roomCode, userId, username }: VoiceChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleConnect = () => {
    setError('Voice chat coming soon! WebRTC integration in progress.')
    setTimeout(() => setError(null), 3000)
  }
  
  const handleDisconnect = () => {
    setIsConnected(false)
  }
  
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="border-b border-border/30 bg-card/60 backdrop-blur-md px-4 py-2">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Voice Chat</h3>
            {error && (
              <span className="text-xs text-yellow-500">{error}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  className="h-8 px-3 text-xs"
                >
                  <PhoneOff className="h-4 w-4 mr-1" /> Leave
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleConnect}
                className="h-8 px-3 text-xs border border-border/30"
              >
                <Phone className="h-4 w-4 mr-1" /> Join Voice
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/20"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
