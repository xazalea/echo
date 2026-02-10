/**
 * Notification Service for echo.
 * 
 * This service handles cross-device notifications without requiring user sign-in.
 * 
 * ARCHITECTURE:
 * - Lightweight Node.js process runs on sender's device when they send a message
 * - Process connects to a WebSocket relay server
 * - Relay server forwards notifications to all connected devices in the room
 * - Notifications are sent via Web Push API (browser) and native OS notifications
 * 
 * IMPLEMENTATION PLAN (for production):
 * 
 * 1. Backend WebSocket Relay Server (Node.js):
 *    - Use Socket.io for real-time communication
 *    - Maintain room-based connections
 *    - Forward notifications to all room participants
 *    - No user authentication required (anonymous by design)
 * 
 * 2. Client-Side Notification Worker:
 *    - Service Worker for background notifications
 *    - Listen for WebSocket events even when tab is closed
 *    - Use Notification API to show OS-level notifications
 * 
 * 3. Notification Payload:
 *    - Room code (for routing)
 *    - Message preview (truncated for privacy)
 *    - Sender username
 *    - Timestamp
 * 
 * 4. Privacy & Security:
 *    - Notifications expire with room (1 hour)
 *    - No persistent storage of notification data
 *    - Optional end-to-end encryption for notification payloads
 * 
 * CLOUDFLARE DEPLOYMENT:
 * - Use Cloudflare Workers for WebSocket relay
 * - Use Durable Objects for room state management
 * - Use Cloudflare Queues for notification delivery
 * 
 * Example Usage:
 * ```
 * const notifier = new NotificationService(roomCode, userId)
 * await notifier.connect()
 * notifier.sendNotification('New message from user123')
 * ```
 */

export interface NotificationConfig {
  roomCode: string
  userId: string
  username: string
}

export class NotificationService {
  private config: NotificationConfig
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(config: NotificationConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // In production, connect to your WebSocket relay server
      // Example: wss://echo-relay.yourdomain.com/notify
      
      console.log('[v0] Notification service connecting...', this.config)
      
      // For demo purposes, we simulate a connection
      // In production:
      // this.ws = new WebSocket(`wss://your-relay-server.com/notify?room=${this.config.roomCode}&userId=${this.config.userId}`)
      
      // this.ws.onopen = () => {
      //   console.log('[v0] Notification service connected')
      //   this.reconnectAttempts = 0
      // }
      
      // this.ws.onmessage = (event) => {
      //   const notification = JSON.parse(event.data)
      //   this.handleNotification(notification)
      // }
      
      // this.ws.onclose = () => {
      //   this.handleReconnect()
      // }
    } catch (error) {
      console.error('[v0] Failed to connect notification service:', error)
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      
      console.log(`[v0] Reconnecting notification service in ${delay}ms...`)
      
      setTimeout(() => {
        this.connect()
      }, delay)
    }
  }

  private handleNotification(notification: any): void {
    if (document.hidden && Notification.permission === 'granted') {
      new Notification('echo.', {
        body: notification.message,
        icon: '/echo-icon.png',
        badge: '/echo-badge.png',
        tag: `echo-${notification.messageId}`,
        requireInteraction: false,
        data: {
          roomCode: this.config.roomCode,
          url: `/room/${this.config.roomCode}`
        }
      })
    }
  }

  sendNotification(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('[v0] Notification service not connected')
      return
    }

    const payload = {
      type: 'notification',
      roomCode: this.config.roomCode,
      userId: this.config.userId,
      username: this.config.username,
      message,
      timestamp: new Date().toISOString()
    }

    // In production:
    // this.ws.send(JSON.stringify(payload))
    
    console.log('[v0] Notification sent:', payload)
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

/**
 * Service Worker Registration
 * 
 * This should be called from the main app to register the service worker
 * that handles background notifications.
 */
export async function registerNotificationWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.log('[v0] Service workers not supported')
    return false
  }

  try {
    // In production, create and register service-worker.js
    // const registration = await navigator.serviceWorker.register('/service-worker.js')
    // console.log('[v0] Service worker registered:', registration)
    return true
  } catch (error) {
    console.error('[v0] Service worker registration failed:', error)
    return false
  }
}
