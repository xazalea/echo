// WebRTC Mesh Network for Distributed Voice Chat

export interface VoicePeer {
  userId: string
  username: string
  connection: RTCPeerConnection
  stream?: MediaStream
}

export class WebRTCMesh {
  private roomCode: string
  private userId: string
  private username: string
  private localStream: MediaStream | null = null
  private peers: Map<string, VoicePeer> = new Map()
  private pollingInterval: NodeJS.Timeout | null = null
  private lastSignalCheck: number = 0
  
  private onPeerJoined?: (userId: string, username: string) => void
  private onPeerLeft?: (userId: string) => void
  private onStreamReceived?: (userId: string, stream: MediaStream) => void
  private onError?: (error: Error) => void

  constructor(
    roomCode: string,
    userId: string,
    username: string,
    callbacks: {
      onPeerJoined?: (userId: string, username: string) => void
      onPeerLeft?: (userId: string) => void
      onStreamReceived?: (userId: string, stream: MediaStream) => void
      onError?: (error: Error) => void
    }
  ) {
    this.roomCode = roomCode
    this.userId = userId
    this.username = username
    this.onPeerJoined = callbacks.onPeerJoined
    this.onPeerLeft = callbacks.onPeerLeft
    this.onStreamReceived = callbacks.onStreamReceived
    this.onError = callbacks.onError
  }

  async connect(): Promise<void> {
    try {
      // Get local audio stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      // Announce presence
      await this.sendSignal({
        type: 'join',
        roomCode: this.roomCode,
        userId: this.userId,
        username: this.username,
      })

      // Start polling for signals
      this.startPolling()
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    // Close all peer connections
    for (const [peerId, peer] of this.peers.entries()) {
      peer.connection.close()
      this.peers.delete(peerId)
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    // Announce departure
    await this.sendSignal({
      type: 'leave',
      roomCode: this.roomCode,
      userId: this.userId,
      username: this.username,
    })
  }

  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted
      })
    }
  }

  private async sendSignal(signal: any): Promise<void> {
    try {
      await fetch('/api/webrtc-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signal),
      })
    } catch (error) {
      console.error('[WebRTC] Failed to send signal:', error)
    }
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(() => {
      this.pollSignals()
    }, 1000) // Poll every second
  }

  private async pollSignals(): Promise<void> {
    try {
      const response = await fetch(
        `/api/webrtc-signal?roomCode=${this.roomCode}&userId=${this.userId}&since=${this.lastSignalCheck}`
      )
      const data = await response.json() as {
        success: boolean
        signals: Array<{
          id: string
          fromUserId: string
          toUserId: string
          type: string
          data: any
          createdAt: number
        }>
        activeUsers: string[]
      }

      if (data.success && data.signals) {
        for (const signal of data.signals) {
          await this.handleSignal(signal)
        }
        
        if (data.signals.length > 0) {
          this.lastSignalCheck = Math.max(...data.signals.map(s => s.createdAt))
        }
      }
    } catch (error) {
      console.error('[WebRTC] Failed to poll signals:', error)
    }
  }

  private async handleSignal(signal: any): Promise<void> {
    const { fromUserId, type, data } = signal

    if (fromUserId === this.userId) return // Ignore own signals

    switch (type) {
      case 'join':
        await this.handlePeerJoin(fromUserId, data.username)
        break
      case 'leave':
        this.handlePeerLeave(fromUserId)
        break
      case 'offer':
        await this.handleOffer(fromUserId, data.offer, data.username)
        break
      case 'answer':
        await this.handleAnswer(fromUserId, data.answer)
        break
      case 'ice-candidate':
        await this.handleIceCandidate(fromUserId, data.candidate)
        break
    }
  }

  private async handlePeerJoin(peerId: string, username: string): Promise<void> {
    if (this.peers.has(peerId)) return

    // Create offer for new peer
    const peerConnection = this.createPeerConnection(peerId, username)
    this.peers.set(peerId, { userId: peerId, username, connection: peerConnection })

    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!)
      })
    }

    // Create and send offer
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    await this.sendSignal({
      type: 'offer',
      roomCode: this.roomCode,
      userId: this.userId,
      username: this.username,
      targetUserId: peerId,
      offer: offer,
    })

    this.onPeerJoined?.(peerId, username)
  }

  private handlePeerLeave(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.connection.close()
      this.peers.delete(peerId)
      this.onPeerLeft?.(peerId)
    }
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit, username: string): Promise<void> {
    if (this.peers.has(peerId)) return

    const peerConnection = this.createPeerConnection(peerId, username)
    this.peers.set(peerId, { userId: peerId, username, connection: peerConnection })

    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!)
      })
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    await this.sendSignal({
      type: 'answer',
      roomCode: this.roomCode,
      userId: this.userId,
      username: this.username,
      targetUserId: peerId,
      answer: answer,
    })

    this.onPeerJoined?.(peerId, username)
  }

  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId)
    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId)
    if (peer && candidate) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  private createPeerConnection(peerId: string, username: string): RTCPeerConnection {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    }

    const peerConnection = new RTCPeerConnection(configuration)

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          roomCode: this.roomCode,
          userId: this.userId,
          username: this.username,
          targetUserId: peerId,
          candidate: event.candidate.toJSON(),
        })
      }
    }

    // Handle incoming stream
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const peer = this.peers.get(peerId)
        if (peer) {
          peer.stream = event.streams[0]
          this.onStreamReceived?.(peerId, event.streams[0])
        }
      }
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'failed' || 
          peerConnection.connectionState === 'disconnected' ||
          peerConnection.connectionState === 'closed') {
        this.handlePeerLeave(peerId)
      }
    }

    return peerConnection
  }

  getPeers(): VoicePeer[] {
    return Array.from(this.peers.values())
  }

  isConnected(): boolean {
    return this.localStream !== null
  }
}
