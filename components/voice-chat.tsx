'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, ChevronDown, ChevronUp, User } from 'lucide-react'
import { WebRTCMesh, VoicePeer } from '@/lib/webrtc-mesh'

interface VoiceChatProps {
  roomCode: string
  userId: string
  username: string
}

export function VoiceChat({ roomCode, userId, username }: VoiceChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [participants, setParticipants] = useState<VoicePeer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [participantPictures, setParticipantPictures] = useState<Record<string, string | null>>({})
  
  const meshRef = useRef<WebRTCMesh | null>(null)
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Fetch profile pictures for participants
  useEffect(() => {
    participants.forEach(participant => {
      if (!participantPictures[participant.userId]) {
        fetch(`/api/profile-picture?userId=${participant.userId}`)
          .then(res => res.json())
          .then((data) => {
            const typedData = data as { success: boolean; picture?: { dataUrl: string } }
            if (typedData.success && typedData.picture) {
              setParticipantPictures(prev => ({
                ...prev,
                [participant.userId]: typedData.picture!.dataUrl
              }))
            }
          })
          .catch(() => {})
      }
    })
  }, [participants, participantPictures])

  const handleConnect = async () => {
    try {
      setError(null)
      
      const mesh = new WebRTCMesh(roomCode, userId, username, {
        onPeerJoined: (peerId, peerUsername) => {
          console.log('[VoiceChat] Peer joined:', peerId, peerUsername)
          setParticipants(prev => {
            if (prev.find(p => p.userId === peerId)) return prev
            return [...prev, { userId: peerId, username: peerUsername, connection: null as any }]
          })
        },
        onPeerLeft: (peerId) => {
          console.log('[VoiceChat] Peer left:', peerId)
          setParticipants(prev => prev.filter(p => p.userId !== peerId))
          
          // Remove audio element
          const audioEl = audioElementsRef.current.get(peerId)
          if (audioEl) {
            audioEl.pause()
            audioEl.srcObject = null
            audioElementsRef.current.delete(peerId)
          }
        },
        onStreamReceived: (peerId, stream) => {
          console.log('[VoiceChat] Stream received from:', peerId)
          
          // Create or update audio element for this peer
          let audioEl = audioElementsRef.current.get(peerId)
          if (!audioEl) {
            audioEl = new Audio()
            audioEl.autoplay = true
            audioElementsRef.current.set(peerId, audioEl)
          }
          audioEl.srcObject = stream
        },
        onError: (err) => {
          console.error('[VoiceChat] Error:', err)
          setError(err.message)
          setIsConnected(false)
        },
      })

      await mesh.connect()
      meshRef.current = mesh
      setIsConnected(true)
      setError(null)
    } catch (err) {
      console.error('[VoiceChat] Connection error:', err)
      setError((err as Error).message || 'Failed to connect to voice chat')
      setIsConnected(false)
    }
  }

  const handleDisconnect = async () => {
    if (meshRef.current) {
      await meshRef.current.disconnect()
      meshRef.current = null
    }
    
    // Clean up all audio elements
    audioElementsRef.current.forEach(audioEl => {
      audioEl.pause()
      audioEl.srcObject = null
    })
    audioElementsRef.current.clear()
    
    setIsConnected(false)
    setParticipants([])
  }

  const toggleMute = () => {
    if (meshRef.current) {
      meshRef.current.setMuted(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (meshRef.current) {
        meshRef.current.disconnect()
      }
      audioElementsRef.current.forEach(audioEl => {
        audioEl.pause()
        audioEl.srcObject = null
      })
    }
  }, [])

  return (
    <div className="border-b border-border/30 bg-card/60 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-primary'}`} />
            <h3 className="text-sm font-semibold text-foreground">Voice Chat</h3>
            {isConnected && participants.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {participants.length} {participants.length === 1 ? 'person' : 'people'}
              </span>
            )}
            {error && (
              <span className="text-xs text-red-500">{error}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className={`h-8 w-8 ${isMuted ? 'text-red-400' : 'text-muted-foreground'} hover:text-foreground hover:bg-muted/20`}
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
                className="h-8 px-3 text-xs border border-border/30 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-500"
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

        {/* Expanded view with participants */}
        {isExpanded && isConnected && participants.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <div className="flex flex-wrap gap-2">
              {participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/20 border border-border/20"
                  title={participant.username}
                >
                  <div className="h-6 w-6 rounded-full bg-muted/40 flex items-center justify-center text-[10px] font-semibold overflow-hidden">
                    {participantPictures[participant.userId] ? (
                      <img 
                        src={participantPictures[participant.userId]!} 
                        alt={participant.username} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground/80">
                    {participant.username}
                  </span>
                  <Volume2 className="h-3 w-3 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
