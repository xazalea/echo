# echo. - Anonymous P2P Chat Platform

A privacy-focused, ephemeral messaging platform with a monochromatic dark mode aesthetic. Built with Next.js 16, designed for Cloudflare deployment.

## Features

### Core Functionality

#### 1. Anonymous Code-Based Rooms
- **Create Room**: Generate a unique 6-character room code
- **Join Room**: Enter existing room with custom username
- **No Sign-In Required**: Complete anonymity, no persistent user accounts
- **Room Expiry**: All rooms and messages automatically deleted after 1 hour

#### 2. Real-Time Messaging
- **WebSocket Communication**: Instant message delivery
- **Typing Indicators**: See when others are typing
- **Message Editing**: Edit your own messages (marked as edited)
- **Timestamps**: Context-aware time display (just now, Xm ago, specific time)

#### 3. Message Clipping System
- **Save Messages**: Clip messages from others to your personal library
- **Visual Indicators**: See how many users clipped a message
- **Persistent Storage**: Clips survive beyond the 1-hour room expiry
- **Clip Management**: View, copy, and remove clips from library

#### 4. Rich Media Sharing
- **Image Upload**: Share images in conversations
- **GIF Integration**: Easy-to-add GIFs (Giphy/Tenor integration ready)
- **Sticker Support**: Visual stickers for enhanced expression

#### 5. Direct Messaging
- **Hover-to-DM**: Hover over username to reveal DM overlay
- **Ephemeral DMs**: Direct messages expire with the room
- **Quick Access**: Seamless transition from group to private chat

#### 6. Cross-Device Notifications
- **Persistent Notifications**: Receive notifications even when tab is closed
- **ChromeOS Compatible**: Full notification support for ChromeOS
- **Lightweight Process**: Minimal resource usage on sender's device
- **No Sign-In Required**: Notifications work anonymously
- **Notification Types**:
  - New messages
  - User joined/left
  - Direct messages
  - Typing indicators (optional)

#### 7. AI Assistant (IsraelGPT)
- **Integrated Help**: AI assistant for user queries
- **Context-Aware**: Understands room and conversation context
- **Privacy-Focused**: Processes queries without storing personal data

### Design & UX

#### Monochromatic Dark Theme
- **Pure Grayscale**: Black (#0a0a0a) to White (#ffffff)
- **Subtle Hover States**: Minimal border color changes
- **Ghost UI Elements**: Transparent backgrounds with border outlines
- **Distraction-Free**: Focus on content, not chrome

#### Typography
- **Primary Font**: Inter (clean, modern sans-serif)
- **Optimal Readability**: 1.6 line-height for body text
- **Font Weights**: Light for headings, regular for body

#### Layout
- **Mobile-First**: Responsive design from 320px up
- **Flexbox-Driven**: Efficient, maintainable layouts
- **Smooth Scrolling**: Auto-scroll to new messages
- **Custom Scrollbars**: Themed to match monochrome aesthetic

## Architecture

### Frontend Stack
- **Framework**: Next.js 16 with React 19.2
- **Styling**: Tailwind CSS with custom monochrome tokens
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Real-Time**: WebSocket with Socket.io client
- **State Management**: React hooks with SWR for data sync
- **Notifications**: Web Notifications API + Service Workers

### Backend Architecture (Production)
```
┌─────────────────────────────────────────┐
│         Cloudflare Edge Network         │
├─────────────────────────────────────────┤
│                                          │
│  Next.js App (Cloudflare Pages)        │
│           ↓                              │
│  WebSocket Worker (Cloudflare Workers)  │
│           ↓                              │
│  Durable Objects (Room State)           │
│           ↓                              │
│  KV Store (Session Data)                │
│           ↓                              │
│  Queues (Notification Delivery)         │
│                                          │
└─────────────────────────────────────────┘
```

### Data Flow

#### Message Lifecycle
1. User sends message
2. WebSocket sends to Worker
3. Worker forwards to Room Durable Object
4. Durable Object broadcasts to all connected clients
5. Message stored in memory (expires after 1 hour)
6. Notification queued for offline users
7. After 1 hour: Room deleted, all data purged

#### Notification Flow (Cross-Device)
1. Message sent from Device A
2. WebSocket Worker receives message
3. Worker queries KV for room subscribers
4. Notification queued in Cloudflare Queue
5. Queue worker processes notification
6. Web Push sent to all subscribed devices
7. Service Worker receives push on Device B (even if tab closed)
8. OS-level notification displayed

### Privacy & Security

#### Privacy-First Design
- **Anonymous Sessions**: No user accounts or tracking
- **Temporary Data**: All data expires after 1 hour
- **No Persistent Storage**: Messages not saved to database
- **Local Clips**: Saved messages stored only in browser localStorage
- **Optional E2E Encryption**: Can be added for message content

#### Security Measures
- **Rate Limiting**: Prevent spam and abuse
- **Input Sanitization**: XSS protection
- **HTTPS Only**: Enforced secure connections
- **CORS Configuration**: Restrict API access
- **WebSocket Authentication**: Room code validation

## File Structure

```
echo/
├── app/
│   ├── layout.tsx              # Root layout with theme
│   ├── page.tsx                # Home (join/create room)
│   ├── room/
│   │   └── [code]/
│   │       └── page.tsx        # Chat room interface
│   └── globals.css             # Global styles & theme tokens
├── components/
│   ├── chat-interface.tsx      # Main chat container
│   ├── message-bubble.tsx      # Individual message component
│   ├── chat-input.tsx          # Message input with media
│   ├── typing-indicator.tsx    # Typing animation
│   ├── user-hover-card.tsx     # Username hover with DM option
│   ├── direct-message-overlay.tsx  # DM modal
│   ├── clips-library.tsx       # Saved messages sidebar
│   ├── gif-picker.tsx          # GIF selection UI
│   └── ui/                     # shadcn/ui components
├── hooks/
│   ├── use-websocket.ts        # WebSocket connection hook
│   ├── use-mobile.tsx          # Responsive breakpoint hook
│   └── use-toast.ts            # Toast notification hook
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── chat-utils.ts           # Helper functions
│   ├── notification-service.ts # Notification management
│   └── utils.ts                # General utilities
├── workers/
│   ├── websocket-relay.ts      # Cloudflare Worker for WS
│   └── notification-worker.ts  # Queue worker for notifications
├── public/
│   ├── service-worker.js       # Background notifications
│   ├── echo-icon.png           # Notification icon
│   └── echo-badge.png          # Notification badge
├── ARCHITECTURE.md             # Detailed architecture docs
├── CLOUDFLARE_DEPLOYMENT.md    # Deployment guide
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind theme
└── package.json
```

## Development

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/echo.git
cd echo

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Visit `http://localhost:3000`

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_WS_ENDPOINT=ws://localhost:8787
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running WebSocket Server Locally

```bash
# In a separate terminal
cd workers
npx wrangler dev websocket-relay.ts
```

## Deployment

### Cloudflare Pages (Recommended)

```bash
# Build for production
pnpm build

# Deploy
npx wrangler pages deploy .next
```

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed instructions.

### Alternative: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Note: WebSocket Workers will need separate deployment on Cloudflare.

## Roadmap

### Phase 1: Core Features (Current)
- [x] Room creation/joining
- [x] Real-time messaging
- [x] Message clipping
- [x] Typing indicators
- [x] Image sharing
- [x] Direct messaging
- [x] Basic notifications

### Phase 2: Enhanced Features
- [ ] End-to-end encryption
- [ ] Voice messages
- [ ] File sharing (non-image)
- [ ] Message reactions
- [ ] User presence (online/away)
- [ ] Room settings (custom expiry time)
- [ ] AI assistant (IsraelGPT) full integration

### Phase 3: Advanced Features
- [ ] Video sharing
- [ ] Screen sharing
- [ ] Voice/video calls
- [ ] Message threads
- [ ] Search functionality
- [ ] Room analytics (anonymous)
- [ ] PWA support

## Performance

### Metrics (Target)
- **Time to Interactive**: < 2s
- **First Contentful Paint**: < 1s
- **Message Latency**: < 100ms
- **Bundle Size**: < 200KB (initial)
- **Lighthouse Score**: > 95

### Optimizations
- Code splitting by route
- Image lazy loading
- WebSocket connection pooling
- Edge caching for static assets
- Durable Objects for low-latency state

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- ChromeOS (full notification support)

## Contributing

Contributions welcome! Please read our contributing guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Radix UI](https://radix-ui.com/)

## Support

For issues and questions:
- GitHub Issues: [github.com/yourusername/echo/issues](https://github.com/yourusername/echo/issues)
- Email: support@echo.your-domain.com

---

**echo.** - Privacy-first ephemeral messaging for the modern web.
