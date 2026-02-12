'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface VoiceParticipant {
  userId: string
  username: string
  isMuted: boolean
  isSpeaking: boolean
}

interface UseWebRTCVoiceProps {
  roomCode: string
  userId: string
  username: string
  enabled: boolean
}

export function useWebRTCVoice({ roomCode, userId, username, enabled }: UseWebRTCVoiceProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [participants, setParticipants] = useState<VoiceParticipant[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)

  // Initialize WebSocket connection for signaling
  const connectSignaling = useCallback(() => {
    if (!enabled || wsRef.current) return

    try {
      // Use wss:// for production, ws:// for local development
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${window.location.host}/api/voice-signal?room=${roomCode}&userId=${userId}&username=${encodeURIComponent(username)}`
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WebRTC] Signaling connected')
      }

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data)
          await handleSignalingMessage(message)
        } catch (error) {
          console.error('[WebRTC] Error handling message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebRTC] WebSocket error:', error)
        setError('Connection error')
      }

      ws.onclose = () => {
        console.log('[WebRTC] Signaling disconnected')
        wsRef.current = null
      }
    } catch (error) {
      console.error('[WebRTC] Error connecting signaling:', error)
      setError('Failed to connect')
    }
  }, [enabled, roomCode, userId, username])

  const handleSignalingMessage = async (message: any) => {
    switch (message.type) {
      case 'participants':
        setParticipants(message.participants || [])
        break
      
      case 'user-joined':
        // Create peer connection for new user
        if (message.userId !== userId) {
          await createPeerConnection(message.userId, true)
        }
        break
      
      case 'user-left':
        // Close peer connection
        const pc = peerConnectionsRef.current.get(message.userId)
        if (pc) {
          pc.close()
          peerConnectionsRef.current.delete(message.userId)
        }
        break
      
      case 'offer':
        await handleOffer(message.from, message.offer)
        break
      
      case 'answer':
        await handleAnswer(message.from, message.answer)
        break
      
      case 'ice-candidate':
        await handleIceCandidate(message.from, message.candidate)
        break
    }
  }

  const createPeerConnection = async (peerId: string, isInitiator: boolean) => {
    if (peerConnectionsRef.current.has(peerId)) return

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    })

    peerConnectionsRef.current.set(peerId, pc)

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track from', peerId)
      const audio = new Audio()
      audio.srcObject = event.streams[0]
      audio.play().catch(e => console.error('[WebRTC] Error playing audio:', e))
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          to: peerId,
          candidate: event.candidate
        }))
      }
    }

    // Create offer if initiator
    if (isInitiator) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          to: peerId,
          offer
        }))
      }
    }
  }

  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    let pc = peerConnectionsRef.current.get(from)
    if (!pc) {
      await createPeerConnection(from, false)
      pc = peerConnectionsRef.current.get(from)
    }
    
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'answer',
          to: from,
          answer
        }))
      }
    }
  }

  const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionsRef.current.get(from)
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }

  const handleIceCandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionsRef.current.get(from)
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  const connect = async () => {
    try {
      setError(null)
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      
      // Connect signaling
      connectSignaling()
      
      setIsConnected(true)
    } catch (error) {
      console.error('[WebRTC] Error connecting:', error)
      setError('Could not access microphone')
      throw error
    }
  }

  const disconnect = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close())
    peerConnectionsRef.current.clear()
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
    setParticipants([])
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
        
        // Notify other participants
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'mute-status',
            isMuted: !audioTrack.enabled
          }))
        }
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    isMuted,
    participants,
    error,
    connect,
    disconnect,
    toggleMute
  }
}
