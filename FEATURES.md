# echo. - Features Documentation

Comprehensive guide to all features in the echo. P2P chat platform.

## Core Features

### 1. Anonymous Code-Based Rooms

**How it works:**
- No sign-up or authentication required
- Generate a unique 6-character room code
- Share the code to invite others
- Choose any username when joining

**Usage:**
```typescript
// Create a room with custom code
POST /api/rooms
{
  "code": "MYROOM", // Optional: auto-generated if not provided
  "createdBy": "user-id"
}

// Join a room
POST /api/join
{
  "roomCode": "MYROOM",
  "userId": "generated-user-id",
  "username": "YourName"
}
```

**Benefits:**
- ✅ No personal information required
- ✅ Instant room creation
- ✅ Easy sharing via code
- ✅ Temporary sessions

### 2. Ephemeral Messaging (1-Hour Auto-Delete)

**How it works:**
- All messages automatically expire after 1 hour
- Background cron job cleans up expired data every 10 minutes
- Expiry timestamp stored with each message
- Privacy-first design

**Database Schema:**
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  content TEXT,
  created_at INTEGER,
  expires_at INTEGER,  -- created_at + 3600000ms
  ...
);
```

**API:**
```typescript
// Messages include expiry info
{
  "id": "msg123",
  "content": "Hello",
  "created_at": 1700000000000,
  "expires_at": 1700003600000  // +1 hour
}
```

**Benefits:**
- ✅ Privacy-focused (no permanent storage)
- ✅ Automatic cleanup
- ✅ Visible countdown timer
- ✅ Encourages in-the-moment conversations

### 3. Message Clipping System

**How it works:**
- Users can "clip" important messages to save them
- Clipped messages persist beyond the 1-hour window
- Stored in personal library
- Visual indicator shows when a message is clipped

**Usage:**
```typescript
// Clip a message
POST /api/clips
{
  "userId": "user123",
  "messageId": "msg456",
  "messageContent": "Important info",
  "originalUsername": "John",
  "roomCode": "ROOM01"
}

// Get your clips
GET /api/clips?userId=user123
```

**UI Features:**
- Bookmark icon on message hover
- Clips counter showing how many people clipped
- Dedicated Clips Library sidebar
- Search and filter clips

**Benefits:**
- ✅ Save important information
- ✅ Personal archive
- ✅ Survives message expiry
- ✅ Shareable references

### 4. IsraelGPT AI Assistant

**How it works:**
- Mention @israelgpt, @bigyahu, @israel, or @netanyahu
- Powered by Cloudflare Workers AI (Llama 2 7B)
- Responds automatically in chat
- Context-aware responses

**Usage:**
```
User: @israelgpt what's the weather like?
IsraelGPT: I'm an AI assistant in the echo chat platform. While I can't check real-time weather, I'm here to help with questions and conversations!
```

**Implementation:**
```typescript
// Auto-detected in message creation
if (/@israelgpt|@bigyahu|@israel|@netanyahu/gi.test(content)) {
  const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [
      { role: 'system', content: 'You are IsraelGPT...' },
      { role: 'user', content: userMessage }
    ]
  });
}
```

**Capabilities:**
- ✅ Natural language understanding
- ✅ Contextual responses
- ✅ Multiple trigger aliases
- ✅ Integrated seamlessly in chat

### 5. GIF Integration (Giphy API)

**How it works:**
- Middleware-proxied Giphy API
- Search and trending GIFs
- API key: `6zzmXysXbC6FVLIrBCIeQUTEjtl9DNN5`
- Client-side rendering

**API Endpoint:**
```typescript
// Search GIFs
GET /api/giphy?q=funny&limit=20

// Trending GIFs
GET /api/giphy?endpoint=trending&limit=20

// Response:
{
  "success": true,
  "gifs": [
    {
      "id": "abc123",
      "title": "Funny Cat",
      "url": "https://media.giphy.com/...",
      "preview": "https://media.giphy.com/.../preview.gif",
      "width": 480,
      "height": 270
    }
  ]
}
```

**UI Features:**
- GIF button in chat input
- Searchable GIF picker
- Trending GIFs on load
- Grid preview layout
- Click to send

**Benefits:**
- ✅ Rich media sharing
- ✅ No direct API key exposure
- ✅ Easy to use
- ✅ Enhances communication

### 6. Image Sharing

**How it works:**
- Share images via URL
- Client-side rendering
- Supports any publicly accessible image URL
- Renders inline in chat

**Usage:**
```typescript
// Send image message
sendMessage(imageUrl, 'image')

// Message structure:
{
  "type": "image",
  "content": "https://example.com/image.jpg"
}
```

**Supported Formats:**
- JPG/JPEG
- PNG
- GIF (static or animated)
- WebP
- SVG

**Benefits:**
- ✅ Visual communication
- ✅ No file upload limits
- ✅ Fast loading
- ✅ Works with any CDN

### 7. Real-Time Typing Indicators

**How it works:**
- Polling-based updates every 2 seconds
- Shows "username is typing..." below messages
- Auto-clears after 5 seconds of inactivity
- Debounced to reduce server load

**Implementation:**
```typescript
// Update typing status
POST /api/typing
{
  "roomCode": "ROOM01",
  "userId": "user123",
  "username": "John",
  "isTyping": true
}

// Get typing users
GET /api/poll?roomCode=ROOM01
// Returns: { typingUsers: [...] }
```

**UI Features:**
- Animated dots indicator
- Multiple users shown
- Subtle, non-intrusive
- Auto-clears

**Benefits:**
- ✅ Real-time feedback
- ✅ Natural conversation flow
- ✅ No WebSocket required
- ✅ Low overhead

### 8. Message Editing

**How it works:**
- Edit your own messages
- Shows "edited" indicator
- Updates in real-time for all users
- Preserves original timestamp

**Usage:**
```typescript
// Edit a message
PATCH /api/messages
{
  "messageId": "msg123",
  "content": "Updated content"
}

// Response includes edited_at timestamp
```

**UI Features:**
- Edit button on own messages
- Inline editing interface
- "Edited" badge on message
- Cancel option

**Limitations:**
- ⚠️ Can only edit own messages
- ⚠️ Cannot edit after expiry
- ⚠️ No edit history (current implementation)

**Benefits:**
- ✅ Fix typos
- ✅ Clarify messages
- ✅ Professional communication

### 9. Ephemeral DM Overlays

**How it works:**
- Hover over username to see DM button
- Small overlay appears
- Send quick direct messages
- Auto-dismisses after use

**UI Features:**
- Hover-triggered overlay
- Compact message input
- Send and close buttons
- Non-modal (doesn't block chat)

**Implementation:**
```typescript
<UserHoverCard username={message.username} userId={message.userId}>
  <span className="cursor-pointer hover:underline">
    {message.username}
  </span>
</UserHoverCard>
```

**Benefits:**
- ✅ Quick private messages
- ✅ Doesn't interrupt flow
- ✅ Context-aware
- ✅ Easy to use

### 10. Polling-Based Real-Time Updates

**How it works:**
- No WebSocket server required
- Polls every 2 seconds for updates
- Long-polling support
- Efficient delta updates

**API:**
```typescript
GET /api/poll?roomCode=ROOM01&userId=user123&lastMessageId=msg456

// Response:
{
  "messages": [...],        // New messages since lastMessageId
  "typingUsers": [...],     // Currently typing
  "onlineUsers": [...],     // Active in room
  "timestamp": 1700000000
}
```

**Advantages:**
- ✅ No WebSocket infrastructure needed
- ✅ Works everywhere (no connection issues)
- ✅ Cloudflare-friendly
- ✅ Automatic reconnection
- ✅ Battery-efficient on mobile

**Configuration:**
```typescript
// Adjust polling interval
usePolling({ 
  roomCode, 
  userId, 
  interval: 2000  // milliseconds
})
```

### 11. Local Notification Server

**How it works:**
- Lightweight Node.js server runs locally
- Receives notifications when tab is closed
- Cross-device notification delivery
- No sign-in required

**Architecture:**
```
Browser Tab Closed → Local Server (port 3001) → OS Notification
```

**Setup:**
```bash
# Start notification server
node notification-server/server.js

# Server subscribes to room updates
# Polls API on behalf of user
# Shows notifications for new messages
```

**API:**
```typescript
// Subscribe to notifications
POST http://localhost:3001/subscribe
{
  "roomCode": "ROOM01",
  "userId": "user123",
  "username": "John",
  "apiUrl": "https://your-app.pages.dev"
}

// Unsubscribe
POST http://localhost:3001/unsubscribe
{
  "roomCode": "ROOM01",
  "userId": "user123"
}
```

**Benefits:**
- ✅ Get notified when tab is closed
- ✅ No push notification service needed
- ✅ Works cross-device
- ✅ Privacy-friendly (local only)

### 12. Customizable Notification Settings

**How it works:**
- Per-user notification preferences
- Store in D1 database or localStorage
- Control what triggers notifications
- Sound and visual customization

**Settings:**
```typescript
interface NotificationSettings {
  notify_on_mention: boolean;    // @username mentions
  notify_on_dm: boolean;          // Direct messages
  notify_on_clip: boolean;        // When someone clips your message
  notify_sound: boolean;          // Play sound
}
```

**UI:**
- Settings panel in user menu
- Toggle switches
- Preview notification
- Sound test

**Benefits:**
- ✅ User control
- ✅ Reduce notification fatigue
- ✅ Personalized experience

### 13. Monochromatic Dark Mode Theme

**How it works:**
- Pure grayscale palette
- No colors except black/white/gray
- Elegant, minimalist design
- CSS custom properties for theming

**Theme System:**
```css
:root {
  --background: 0 0% 4%;        /* Pure black background */
  --foreground: 0 0% 95%;       /* White text */
  --card: 0 0% 6%;              /* Slightly lighter cards */
  --border: 0 0% 18%;           /* Subtle borders */
  --muted: 0 0% 15%;            /* Muted elements */
  --accent: 0 0% 18%;           /* Hover states */
}
```

**Design Principles:**
- Clean and distraction-free
- High contrast for readability
- Subtle hover states
- Ghost buttons
- No color distractions

**Benefits:**
- ✅ Focus on content
- ✅ Easy on eyes
- ✅ Professional appearance
- ✅ Consistent across platform

### 14. Timestamps & Context

**How it works:**
- Relative timestamps ("2m ago", "5h ago")
- Absolute time on hover
- Message age indicators
- Expiry countdowns

**Display Formats:**
- Just now (< 1 minute)
- X minutes ago
- X hours ago
- HH:MM (same day)
- MM/DD HH:MM (older)

**Implementation:**
```typescript
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return date.toLocaleTimeString();
}
```

**Benefits:**
- ✅ Context awareness
- ✅ Easy to scan
- ✅ Accurate time display

## Advanced Features

### Room Management

- **Custom Codes:** Choose your own room code
- **Room Expiry:** Rooms expire after 24 hours of inactivity
- **User List:** See who's online
- **Leave Room:** Clean exit

### Message Features

- **Rich Content:** Text, images, GIFs
- **Mentions:** @username mentions (visual highlighting)
- **Replies:** (Planned feature)
- **Reactions:** (Planned feature)

### Privacy Features

- **Anonymous Sessions:** No personal data collected
- **Auto-Delete:** Messages expire after 1 hour
- **No Tracking:** No analytics or tracking scripts
- **Local Storage:** User preferences stored locally

## Performance Optimizations

### Cloudflare Edge

- Global CDN
- Edge API routes
- < 50ms latency worldwide
- Automatic scaling

### D1 Database

- SQLite at edge
- Indexed queries
- Automatic cleanup
- Fast reads/writes

### Polling Efficiency

- Delta updates only
- Configurable intervals
- Debounced requests
- Automatic backoff on errors

### Image Optimization

- Lazy loading
- Progressive loading
- CDN delivery
- Responsive sizing

## Security Features

### Input Validation

- SQL injection prevention (parameterized queries)
- XSS protection (sanitized content)
- CSRF tokens
- Rate limiting (optional)

### Data Privacy

- No permanent message storage
- Anonymous user IDs
- No IP logging
- HTTPS only

### API Security

- CORS configuration
- Request throttling
- Validation middleware
- Error handling

## Accessibility Features

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast theme
- Focus indicators

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers
- No IE11 support

## API Reference

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

## Future Features (Roadmap)

- [ ] End-to-end encryption
- [ ] Voice messages
- [ ] File sharing
- [ ] Message reactions
- [ ] Threading/replies
- [ ] User profiles (optional)
- [ ] Room passwords
- [ ] Admin controls
- [ ] Message search
- [ ] Export chat history
- [ ] Custom themes
- [ ] Mobile apps

## Contributing

Feature requests and bug reports welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
