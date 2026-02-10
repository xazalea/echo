# echo. - Architecture & Feature Specification

## Overview
echo. is a privacy-first, anonymous P2P chat platform with ephemeral messaging, clipping capabilities, and AI assistance. The platform emphasizes minimalist monochromatic dark design and rapid, seamless interactions.

---

## Core Features

### 1. Anonymous Code-Based Access
- **Custom Room Codes**: Users create or join rooms using unique alphanumeric codes (6-8 characters)
- **Username Customization**: Temporary usernames set per session (no account required)
- **No Authentication**: Zero login barriers - direct access via code
- **Code Validation**: Real-time code availability checking

### 2. Ephemeral Messaging System
- **1-Hour Auto-Deletion**: All messages automatically purge after 60 minutes
- **Room Lifecycle**: Rooms persist as long as at least one user is connected
- **Message Expiry Indicators**: Visual countdown showing remaining time
- **Clean State**: Automatic cleanup prevents data accumulation

### 3. Message Clipping Feature
- **Personal Library**: Users can "clip" (save) messages from others to personal storage
- **Visual Confirmation**: 
  - Clip icon appears on each message (others' messages only)
  - Animation + notification on successful clip
  - Badge showing clip count per message across all users
- **Persistent Storage**: Clipped messages survive the 1-hour deletion
- **Library View**: Dedicated interface to browse saved clips with original context

### 4. Real-Time Communication Features
- **Typing Indicators**: "User is typing..." with 3-second timeout
- **Live Message Updates**: Instant delivery via WebSocket
- **Online Status**: Active user count per room
- **Message Editing**: Edit own messages within 5 minutes (marked as "edited")
- **Delivery Receipts**: Subtle indicators for message delivery

### 5. Rich Media Support
- **Image Sharing**: 
  - Drag-and-drop or click-to-upload
  - Preview thumbnails with lightbox view
  - Max 10MB per image
  - Formats: PNG, JPG, GIF, WEBP
- **GIF Integration**: 
  - Tenor/GIPHY API integration
  - Searchable GIF picker modal
  - Quick-add from popular selections
- **Sticker Packs**: 
  - Curated monochrome sticker library
  - Custom upload capability (future)

### 6. IsraelGPT AI Assistant
- **Contextual Help**: Answers questions about platform usage
- **Chat Enhancement**: Can summarize conversations, suggest responses
- **Command Interface**: Triggered via `/ask` or dedicated button
- **Privacy-Aware**: Processes queries without storing conversation history

### 7. Notification System
- **ChromeOS Integration**: Native notification API
- **Triggers**:
  - New messages when tab is inactive
  - @mentions (if username is mentioned)
  - Room activity updates (user joins/leaves)
- **Notification Preferences**: Mute/unmute per room

### 8. Timestamps & Context
- **Relative Timestamps**: "Just now", "5 min ago", "1 hour ago"
- **Absolute Time on Hover**: Full timestamp (YYYY-MM-DD HH:MM:SS)
- **Timezone Awareness**: Display in user's local timezone
- **Expiry Countdown**: Visual indicator showing message TTL

---

## System Architecture

### Technology Stack Recommendation

#### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS with monochrome theme
- **State Management**: SWR for data fetching, React Context for room state
- **Real-Time**: Socket.io-client or native WebSocket API
- **Notifications**: Web Notifications API + ChromeOS specific hooks

#### Backend
- **Runtime**: Node.js with Next.js API routes
- **Real-Time Engine**: Socket.io or Pusher Channels
- **Database**: PostgreSQL (Supabase/Neon recommended)
- **File Storage**: Vercel Blob for images
- **AI Integration**: Vercel AI SDK with OpenAI/Anthropic

#### Infrastructure
- **Hosting**: Vercel (serverless functions + edge)
- **CDN**: Automatic via Vercel
- **Caching**: Redis (Upstash) for active room state
- **Monitoring**: Vercel Analytics

---

## Database Schema

### Tables

#### `rooms`
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  active_users INTEGER DEFAULT 0,
  INDEX idx_code (code),
  INDEX idx_last_activity (last_activity)
);
```

#### `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Session-based anonymous ID
  username VARCHAR(50) NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- created_at + 1 hour
  clip_count INTEGER DEFAULT 0,
  INDEX idx_room_expires (room_id, expires_at),
  INDEX idx_expires_at (expires_at)
);
```

#### `clips`
```sql
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- Session-based anonymous ID
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  message_snapshot JSONB NOT NULL, -- Store full message data
  room_code VARCHAR(8) NOT NULL,
  clipped_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_clipped_at (clipped_at)
);
```

#### `typing_indicators`
```sql
-- Stored in Redis for ephemeral state
-- Key: room:{room_code}:typing
-- Value: Set of usernames
-- TTL: 3 seconds
```

---

## API Endpoints

### REST APIs

#### Room Management
```
POST   /api/rooms/create
  Body: { customCode?: string }
  Returns: { roomCode: string, roomId: string }

GET    /api/rooms/join/:code
  Returns: { exists: boolean, roomId: string, activeUsers: number }

DELETE /api/rooms/leave/:code
  Body: { userId: string }
```

#### Messages
```
GET    /api/messages/:roomId
  Query: { before?: timestamp, limit?: number }
  Returns: { messages: Message[], hasMore: boolean }

POST   /api/messages/:roomId
  Body: { content: string, userId: string, username: string }
  Returns: { message: Message }

PATCH  /api/messages/:messageId
  Body: { content: string }
  Returns: { message: Message }

DELETE /api/messages/:messageId
  Body: { userId: string }
  Returns: { success: boolean }
```

#### Clipping
```
POST   /api/clips
  Body: { messageId: string, userId: string }
  Returns: { clip: Clip, success: boolean }

GET    /api/clips/:userId
  Returns: { clips: Clip[] }

DELETE /api/clips/:clipId
  Body: { userId: string }
  Returns: { success: boolean }
```

#### Media Upload
```
POST   /api/upload/image
  Body: FormData with file
  Returns: { url: string, size: number }
```

#### AI Assistant
```
POST   /api/ai/query
  Body: { query: string, context?: string }
  Returns: { response: string, suggestions?: string[] }
```

### WebSocket Events

#### Client → Server
```javascript
// Connection
socket.emit('join_room', { roomCode, userId, username })
socket.emit('leave_room', { roomCode, userId })

// Messaging
socket.emit('send_message', { roomId, content, userId, username })
socket.emit('edit_message', { messageId, content, userId })
socket.emit('typing_start', { roomCode, username })
socket.emit('typing_stop', { roomCode, username })

// Clipping
socket.emit('clip_message', { messageId, userId })
```

#### Server → Client
```javascript
// Room updates
socket.on('user_joined', { username, activeUsers })
socket.on('user_left', { username, activeUsers })

// Messaging
socket.on('new_message', { message })
socket.on('message_edited', { messageId, content, editedAt })
socket.on('message_deleted', { messageId })

// Typing
socket.on('typing_update', { usernames: string[] })

// Clipping
socket.on('message_clipped', { messageId, newClipCount })

// System
socket.on('message_expiring_soon', { messageId, expiresIn: number })
```

---

## Real-Time Communication Strategy

### Option 1: Socket.io (Recommended)
**Pros**:
- Automatic fallback (WebSocket → HTTP long-polling)
- Built-in room management
- Reconnection handling
- Binary support for images

**Implementation**:
```javascript
// Server: /api/socket/route.ts
io.on('connection', (socket) => {
  socket.on('join_room', async ({ roomCode, userId, username }) => {
    await socket.join(roomCode)
    io.to(roomCode).emit('user_joined', { username })
  })
  
  socket.on('send_message', async (data) => {
    const message = await saveMessage(data)
    io.to(data.roomCode).emit('new_message', { message })
    scheduleMessageDeletion(message.id, 3600000) // 1 hour
  })
})
```

### Option 2: Pusher Channels
**Pros**:
- Managed service (no server setup)
- Built-in presence channels
- Excellent scaling

**Cons**:
- Costs scale with connections
- Less control over infrastructure

### Option 3: Native WebSocket + Redis Pub/Sub
**Pros**:
- Full control
- No external dependencies
- Cost-effective

**Cons**:
- More complex implementation
- Manual scaling considerations

---

## Privacy & Security Considerations

### Data Protection
1. **No Persistent User Data**: Anonymous IDs stored in session storage only
2. **Ephemeral by Default**: All messages auto-delete (except clipped)
3. **End-to-End Option**: Future enhancement for encrypted rooms
4. **No Analytics Tracking**: Privacy-first approach

### Security Measures
1. **Rate Limiting**: 
   - 50 messages per user per minute
   - 10 room creations per IP per hour
2. **Content Validation**:
   - XSS prevention via sanitization
   - Max message length: 2000 characters
3. **Image Safety**:
   - File type validation
   - Size limits (10MB)
   - Virus scanning (ClamAV integration recommended)
4. **Room Code Protection**:
   - No enumeration (random codes only)
   - Code expiry after 7 days of inactivity

---

## Background Jobs & Cleanup

### Scheduled Tasks

#### Message Cleanup (Runs every 5 minutes)
```sql
DELETE FROM messages 
WHERE expires_at < NOW();
```

#### Room Cleanup (Runs every 30 minutes)
```sql
DELETE FROM rooms 
WHERE last_activity < NOW() - INTERVAL '7 days'
AND active_users = 0;
```

#### Image Cleanup (Runs daily)
```javascript
// Delete images associated with deleted messages
const orphanedImages = await getOrphanedBlobFiles()
await Promise.all(orphanedImages.map(del))
```

---

## UI/UX Design Guidelines

### Monochromatic Dark Theme

#### Color Palette
```css
:root {
  --bg-primary: #0a0a0a;      /* Deep black */
  --bg-secondary: #151515;    /* Card backgrounds */
  --bg-tertiary: #1f1f1f;     /* Hover states */
  
  --text-primary: #ffffff;    /* Primary text */
  --text-secondary: #a0a0a0;  /* Secondary text */
  --text-tertiary: #666666;   /* Disabled/hints */
  
  --accent: #ffffff;          /* Primary actions */
  --accent-hover: #e5e5e5;    /* Action hover */
  
  --border: #2a2a2a;          /* Dividers */
  --success: #888888;         /* Success states */
  --error: #666666;           /* Error states */
}
```

#### Typography
- **Headings**: Inter/Geist Sans, 600-700 weight
- **Body**: Inter/Geist Sans, 400 weight
- **Monospace**: Geist Mono (for codes)
- **Sizes**: 14px base, scale up for headings

#### Component Patterns
1. **Messages**: Left-aligned bubbles, subtle borders, no colors
2. **Inputs**: Minimal borders, focus states with subtle glow
3. **Buttons**: Ghost/outline style, hover lift effect
4. **Icons**: Lucide React, 20px standard size
5. **Animations**: Subtle fades, 200ms transitions

### Key Screens

#### 1. Landing/Join Screen
- Large centered input for room code
- "Create New Room" button below
- Minimalist logo ("echo.")
- No distractions

#### 2. Chat Interface
```
┌──────────────────────────────────────┐
│  echo.        [users: 3]    [•••]    │ ← Header
├──────────────────────────────────────┤
│  @user1: Hey everyone     [clip] 5m  │ ← Message
│  @user2: What's up?       [clip] 3m  │
│  @you: Just joined!              now │
│                                      │
│  [user3 is typing...]               │ ← Typing indicator
├──────────────────────────────────────┤
│  [Type message...] [📎] [GIF] [🤖]  │ ← Input bar
└──────────────────────────────────────┘
```

#### 3. Clips Library
- Grid/list view of saved messages
- Original context preserved (room, timestamp)
- Search/filter functionality
- Export option

---

## Performance Optimization

### Strategies
1. **Message Pagination**: Load 50 messages initially, infinite scroll for history
2. **Image Lazy Loading**: Load images as they enter viewport
3. **WebSocket Compression**: Enable permessage-deflate
4. **Redis Caching**: Cache active room metadata (TTL: 5 minutes)
5. **Database Indexing**: Optimize queries on `expires_at`, `room_id`

### Scaling Considerations
- **Horizontal Scaling**: Stateless API design allows multiple instances
- **Redis for Session**: Share state across server instances
- **CDN for Media**: Serve images from edge locations
- **Database Read Replicas**: Separate read/write workloads

---

## Future Enhancements

### Phase 2
- [ ] Voice messages (3-minute max)
- [ ] End-to-end encryption option
- [ ] Custom sticker creation
- [ ] Multi-room support (tabs)

### Phase 3
- [ ] Video calls (WebRTC)
- [ ] Screen sharing
- [ ] Message reactions (limited emoji set)
- [ ] Thread conversations

### Phase 4
- [ ] Mobile apps (React Native)
- [ ] Desktop app (Electron)
- [ ] API for third-party integrations
- [ ] Custom AI assistant training

---

## Development Roadmap

### MVP (4-6 weeks)
1. ✓ Basic room creation/joining
2. ✓ Real-time messaging (WebSocket)
3. ✓ 1-hour auto-deletion
4. ✓ Image upload
5. ✓ Typing indicators
6. ✓ Dark monochrome UI

### V1.0 (8-10 weeks)
1. ✓ Clipping feature with library
2. ✓ IsraelGPT integration
3. ✓ Message editing
4. ✓ GIF/sticker support
5. ✓ Notifications (ChromeOS)
6. ✓ Performance optimizations

### V1.5 (12-14 weeks)
1. Advanced moderation tools
2. Custom room settings
3. Enhanced AI capabilities
4. Analytics dashboard (privacy-safe)

---

## Testing Strategy

### Unit Tests
- Message lifecycle functions
- Clipping logic
- Room code generation
- Timestamp utilities

### Integration Tests
- WebSocket connection flow
- Message sending/receiving
- Image upload pipeline
- Notification triggers

### E2E Tests (Playwright)
- Complete user journey: Join → Chat → Clip → Leave
- Multi-user scenarios
- Edge cases (disconnection, expiry)

---

## Monitoring & Observability

### Metrics to Track
1. **Performance**: Message latency, WebSocket connection time
2. **Usage**: Active rooms, messages per minute, clip rate
3. **Errors**: Failed uploads, WebSocket disconnections, API errors
4. **Resources**: Database query time, Redis memory, blob storage

### Tools
- **Vercel Analytics**: Page views, Web Vitals
- **Sentry**: Error tracking and performance monitoring
- **Custom Dashboard**: Real-time room/message statistics

---

## Conclusion

echo. provides a unique blend of ephemeral messaging with selective persistence through clipping. The architecture prioritizes:

1. **Privacy**: Anonymous, temporary by default
2. **Simplicity**: No accounts, instant access
3. **Performance**: Real-time with minimal latency
4. **Aesthetics**: Clean, monochromatic design
5. **Intelligence**: AI-assisted interactions

The tech stack leverages modern, scalable solutions while maintaining simplicity and cost-effectiveness. The modular design allows for incremental feature additions without architectural rewrites.

---

*Document Version: 1.0*  
*Last Updated: 2026-02-09*
