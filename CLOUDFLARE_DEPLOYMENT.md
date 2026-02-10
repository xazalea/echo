# Cloudflare Deployment Guide for echo.

## Overview

echo. is designed to deploy seamlessly on Cloudflare Pages with Workers and Durable Objects for real-time functionality.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare Edge                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐    ┌─────────────────┐                  │
│  │ Cloudflare     │───▶│ Durable Objects │                  │
│  │ Pages (Next.js)│    │ (Room State)    │                  │
│  └────────────────┘    └─────────────────┘                  │
│                                                               │
│  ┌────────────────┐    ┌─────────────────┐                  │
│  │ Workers        │───▶│ Cloudflare KV   │                  │
│  │ (WebSocket)    │    │ (Session Store) │                  │
│  └────────────────┘    └─────────────────┘                  │
│                                                               │
│  ┌────────────────┐                                          │
│  │ Cloudflare     │                                          │
│  │ Queues         │ (Notification Delivery)                 │
│  └────────────────┘                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Required Cloudflare Services

### 1. Cloudflare Pages
- Hosts the Next.js application
- Automatic builds from Git
- Edge-optimized static assets

### 2. Cloudflare Workers
- WebSocket relay for real-time messaging
- Handles message routing and broadcasting
- Connects to Durable Objects for state management

### 3. Durable Objects
- Maintains room state (messages, users, typing indicators)
- One Durable Object instance per active room
- Automatically cleans up after 1 hour

### 4. Cloudflare KV
- Stores active room codes
- Session metadata
- Rate limiting data

### 5. Cloudflare Queues
- Delivers notifications to offline users
- Handles cross-device notification delivery
- Ensures reliability with retry logic

## Deployment Steps

### Step 1: Set Up Cloudflare Pages

```bash
# Build the Next.js app
pnpm build

# Deploy to Cloudflare Pages (automatic via Git integration)
# Or use Wrangler CLI:
npx wrangler pages deploy .next
```

### Step 2: Configure Environment Variables

In Cloudflare Pages dashboard, add:

```env
NEXT_PUBLIC_WS_ENDPOINT=wss://echo-ws.your-domain.workers.dev
NEXT_PUBLIC_APP_URL=https://echo.your-domain.com
```

### Step 3: Deploy WebSocket Worker

Create `workers/websocket-relay.ts`:

```typescript
import { DurableObject } from 'cloudflare:workers';

export class RoomDurableObject extends DurableObject {
  private sessions: Map<string, WebSocket>;
  private messages: any[];
  private expiresAt: number;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.sessions = new Map();
    this.messages = [];
    this.expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/ws') {
      return this.handleWebSocket(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request: Request) {
    const { 0: client, 1: server } = new WebSocketPair();
    
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username');
    
    if (!userId || !username) {
      return new Response('Missing params', { status: 400 });
    }

    this.sessions.set(userId, server);
    
    server.accept();
    
    server.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data);
      await this.handleMessage(userId, data);
    });
    
    server.addEventListener('close', () => {
      this.sessions.delete(userId);
      this.broadcast({
        type: 'user_left',
        userId
      }, userId);
    });
    
    // Send existing messages
    server.send(JSON.stringify({
      type: 'history',
      messages: this.messages
    }));
    
    // Notify others
    this.broadcast({
      type: 'user_joined',
      user: { id: userId, username }
    }, userId);
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async handleMessage(senderId: string, data: any) {
    switch (data.type) {
      case 'message':
        this.messages.push(data.message);
        this.broadcast({
          type: 'message',
          message: data.message
        });
        
        // Queue notification
        await this.env.NOTIFICATION_QUEUE.send({
          roomCode: this.roomCode,
          message: data.message
        });
        break;
        
      case 'typing':
        this.broadcast({
          type: 'typing',
          userId: senderId,
          isTyping: data.isTyping
        }, senderId);
        break;
    }
  }

  broadcast(message: any, excludeUserId?: string) {
    const payload = JSON.stringify(message);
    
    for (const [userId, ws] of this.sessions) {
      if (userId !== excludeUserId && ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.send(payload);
      }
    }
  }
}

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    const roomCode = url.searchParams.get('room');
    
    if (!roomCode) {
      return new Response('Missing room code', { status: 400 });
    }
    
    const id = env.ROOM.idFromName(roomCode);
    const room = env.ROOM.get(id);
    
    return room.fetch(request);
  }
};
```

Deploy with:

```bash
npx wrangler deploy workers/websocket-relay.ts
```

### Step 4: Configure Wrangler

Create `wrangler.toml`:

```toml
name = "echo-websocket"
main = "workers/websocket-relay.ts"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "ROOM"
class_name = "RoomDurableObject"
script_name = "echo-websocket"

[[migrations]]
tag = "v1"
new_classes = ["RoomDurableObject"]

[[queues.producers]]
binding = "NOTIFICATION_QUEUE"
queue = "echo-notifications"

[[kv_namespaces]]
binding = "ECHO_KV"
id = "your-kv-namespace-id"
```

### Step 5: Set Up Notification Queue

Create `workers/notification-worker.ts`:

```typescript
export default {
  async queue(batch: MessageBatch, env: any) {
    for (const message of batch.messages) {
      const { roomCode, message: msg } = message.body;
      
      // Send Web Push notifications to subscribed users
      const subscriptions = await env.ECHO_KV.get(`subscriptions:${roomCode}`);
      
      if (subscriptions) {
        const subs = JSON.parse(subscriptions);
        
        for (const sub of subs) {
          await sendWebPush(sub, {
            title: 'echo.',
            body: msg.content,
            icon: '/echo-icon.png'
          });
        }
      }
    }
  }
};
```

## Persistent Notifications Setup

### Client-Side Integration

Update your WebSocket hook to include notification subscriptions:

```typescript
// In hooks/use-websocket.ts

import { NotificationService } from '@/lib/notification-service'

export function useWebSocket(props) {
  const notificationService = useRef<NotificationService>()
  
  useEffect(() => {
    // Initialize notification service
    notificationService.current = new NotificationService({
      roomCode: props.roomCode,
      userId: props.userId,
      username: props.username
    })
    
    notificationService.current.connect()
    
    return () => {
      notificationService.current?.disconnect()
    }
  }, [props.roomCode, props.userId, props.username])
  
  // Rest of implementation...
}
```

### Service Worker for Background Notifications

Create `public/service-worker.js`:

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json()
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/echo-badge.png',
      tag: 'echo-notification',
      data: data
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
```

## Production Checklist

- [ ] Set up Cloudflare Pages project
- [ ] Deploy WebSocket Worker with Durable Objects
- [ ] Configure KV namespace
- [ ] Set up Cloudflare Queues for notifications
- [ ] Add custom domain
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring and analytics
- [ ] Test cross-device notifications
- [ ] Verify 1-hour expiry mechanism

## Performance Optimization

1. **Edge Caching**: Static assets cached globally
2. **Durable Objects**: Room state maintained at edge
3. **WebSocket Connections**: Direct client-to-edge connections
4. **KV Read Performance**: Sub-millisecond reads globally

## Monitoring

Use Cloudflare Analytics and Logpush to monitor:
- WebSocket connections per room
- Message throughput
- Notification delivery success rate
- Durable Object invocations
- Edge request latency

## Cost Estimation

Based on usage:
- Pages: Free for most use cases
- Workers: $5/month (includes 10M requests)
- Durable Objects: $0.15 per million requests
- KV: $0.50 per million reads
- Queues: $0.40 per million operations

For 1000 active rooms with 10 users each:
Estimated cost: $20-50/month
