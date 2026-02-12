'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Users, User } from 'lucide-react'
import { useWebRTCVoice } from '@/hooks/use-webrtc-voice'
import { fetchProfilePicture } from '@/lib/profile-sync'

interface VoiceChatProps {
  roomCode: string
  userId: string
  username: string
}

export function VoiceChat({ roomCode, userId, username }: VoiceChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [participantPictures, setParticipantPictures] = useState<Record<string, string | null>>({})
  
  const {
    isConnected,
    isMuted,
    participants,
    error,
    connect,
    disconnect,
    toggleMute
  } = useWebRTCVoice({
    roomCode,
    userId,
    username,
    enabled: true
  })

  // Fetch profile pictures for participants
  useEffect(() => {
    participants.forEach(async (participant) => {
      if (!participantPictures[participant.userId]) {
        const picture = await fetchProfilePicture(participant.userId)
        setParticipantPictures(prev => ({
          ...prev,
          [participant.userId]: picture
        }))
      }
    })
  }, [participants])

  const toggleConnection = async () => {
    if (isConnected) {
      disconnect()
    } else {
      try {
        await connect()
      } catch (error) {
        alert('Could not access microphone. Please check permissions.')
      }
    }
  }

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
          
          {/* Participants List with Profile Pictures */}
          {isConnected && participants.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((participant) => (
                  <div
                    key={participant.userId}
                    className="relative group"
                    title={participant.username}
                  >
                    <div className={`h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden ${
                      participant.isMuted ? 'opacity-50' : ''
                    }`}>
                      {participantPictures[participant.userId] ? (
                        <img 
                          src={participantPictures[participant.userId]!} 
                          alt={participant.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {participant.username}
                      {participant.isMuted && ' (muted)'}
                    </div>
                  </div>
                ))}
                {participants.length > 5 && (
                  <div className="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    +{participants.length - 5}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {participants.length + 1}
              </span>
            </div>
          )}

          {error && (
            <span className="text-xs text-red-400">{error}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${isMuted ? 'text-red-500 hover:text-red-600' : 'text-foreground'}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
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
