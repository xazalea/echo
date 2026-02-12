'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Users } from 'lucide-react'

interface VoiceChatProps {
  roomCode: string
  userId: string
  username: string
}

export function VoiceChat({ roomCode, userId, username }: VoiceChatProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())

  const toggleConnection = async () => {
    if (isConnected) {
      // Disconnect
      disconnect()
    } else {
      // Connect
      await connect()
    }
  }

  const connect = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      setIsConnected(true)
      
      // TODO: Implement WebRTC signaling via WebSocket
      console.log('[VoiceChat] Connected to voice chat')
    } catch (error) {
      console.error('[VoiceChat] Error connecting:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const disconnect = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    
    peerConnectionsRef.current.forEach(pc => pc.close())
    peerConnectionsRef.current.clear()
    
    setIsConnected(false)
    setParticipants([])
    console.log('[VoiceChat] Disconnected from voice chat')
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted)
    // TODO: Implement speaker mute for all remote streams
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  if (!isExpanded && !isConnected) {
    return (
      <div className="border-b border-border/30 bg-card/40 backdrop-blur-sm px-4 py-2">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="h-4 w-4" />
          <span>Voice Chat</span>
        </button>
      </div>
    )
  }

  return (
    <div className="border-b border-border/30 bg-card/40 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
            <Phone className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isConnected ? 'Voice Chat Active' : 'Voice Chat'}
            </span>
          </div>
          
          {isConnected && participants.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{participants.length + 1} participant{participants.length > 0 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isMuted ? 'text-red-500 hover:text-red-600' : 'text-foreground'}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={toggleSpeaker}
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isSpeakerMuted ? 'text-red-500 hover:text-red-600' : 'text-foreground'}`}
                title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
              >
                {isSpeakerMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </>
          )}
          
          <Button
            onClick={toggleConnection}
            variant={isConnected ? 'destructive' : 'default'}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            {isConnected ? (
              <>
                <PhoneOff className="h-3.5 w-3.5 mr-1.5" />
                Leave
              </>
            ) : (
              <>
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Join
              </>
            )}
          </Button>
          
          {!isConnected && (
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
