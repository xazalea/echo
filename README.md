# echo.

> Privacy-first anonymous P2P chat with ephemeral messaging, AI assistance, and cross-device notifications

A monochromatic dark mode chat platform optimized for Cloudflare with D1 Database, Workers AI, and polling-based real-time updates. No WebSocket infrastructure required.

![echo. Platform](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🔒 Privacy & Anonymity
- **No Sign-Up**: Join instantly with any username
- **Code-Based Rooms**: Share 6-character codes to invite
- **Auto-Delete**: All messages expire after 1 hour
- **Anonymous Sessions**: No persistent user tracking
- **Local-First**: Preferences stored in browser only

### 💬 Real-Time Communication
- **Polling Updates**: 2-second interval, no WebSocket needed
- **Typing Indicators**: See when others are composing
- **Message Editing**: Edit with "edited" badge
- **Direct Messages**: Hover over usernames for ephemeral DM overlay
- **Online Presence**: See active users in real-time

### 🎨 Rich Media
- **GIF Integration**: Giphy API with search and trending
- **Image Sharing**: Share via URL, client-side rendering
- **IsraelGPT AI**: Mention @israelgpt, @bigyahu, @israel, or @netanyahu
- **Timestamps**: Context-aware time display

### 💾 Message Clipping
- **Save Messages**: Clip others' messages to personal library
- **Visual Indicators**: See clip counts on messages
- **Persistent Storage**: Clips survive 1-hour expiry
- **Easy Management**: View and organize in sidebar

### 🔔 Notifications
- **Local Notification Server**: Node.js process for cross-device delivery
- **Works When Tab Closed**: Get notified even when not active
- **Customizable**: Control what triggers notifications
- **ChromeOS Compatible**: Full native support

### 🎨 Design
- **Monochromatic Theme**: Pure grayscale palette
- **Dark Mode Default**: Easy on eyes, #0a0a0a to #ffffff
- **Ghost UI**: Transparent elements with subtle borders
- **Minimal & Elegant**: Focus on content, not chrome

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm)
- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create D1 Database
wrangler d1 create echo-db
# Copy the database ID and paste it into wrangler.toml

# Run migrations
pnpm db:migrate
```

### 3. Start Development

```bash
# Start Next.js dev server
pnpm dev

# In another terminal, start notification server (optional)
pnpm notify
```

Visit `http://localhost:3000` 🎉

### 4. Deploy to Cloudflare

```bash
# Build and deploy
pnpm cf:deploy

# Or push to GitHub and connect via Cloudflare Pages dashboard
```

See **[CLOUDFLARE_SETUP_GUIDE.md](./CLOUDFLARE_SETUP_GUIDE.md)** for detailed deployment instructions.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              Next.js 16 Application                 │
│         (React 19 + Server Components)              │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│           Cloudflare Workers (Edge)                 │
│              API Routes (Edge Runtime)              │
└──┬─────────┬──────────┬──────────┬──────────────────┘
   │         │          │          │
   ▼         ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌──────────────┐
│   D1   │ │Workers│ │ Giphy  │ │Local Notify  │
│Database│ │  AI   │ │  API   │ │   Server     │
│(SQLite)│ │(Llama)│ │(Proxy) │ │  (Node.js)   │
└────────┘ └──────┘ └────────┘ └──────────────┘
```

### Why Polling Instead of WebSockets?

- ✅ **Cloudflare-Friendly**: No persistent connection infrastructure
- ✅ **Simpler Deployment**: Just deploy to Cloudflare Pages
- ✅ **Universal Compatibility**: Works everywhere, no connection issues
- ✅ **Battery-Efficient**: Less resource usage on mobile
- ✅ **Automatic Reconnection**: No connection management needed
- ✅ **Still Real-Time**: 2-second polling feels instant

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[FEATURES.md](./FEATURES.md)** | Complete feature documentation with code examples |
| **[CLOUDFLARE_SETUP_GUIDE.md](./CLOUDFLARE_SETUP_GUIDE.md)** | Step-by-step Cloudflare deployment guide |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System design and technical architecture |
| **[QUICK_START.md](./QUICK_START.md)** | Getting started guide |
| **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** | User guide for end users |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | Implementation details and decisions |

## 🎯 Key Concepts

### Ephemeral Messaging

All messages automatically expire after **1 hour**:

1. Message created with `expires_at` timestamp
2. Visible and editable for 1 hour
3. Cron job runs every 10 minutes to cleanup
4. After 1 hour: permanently deleted
5. Exception: Clipped messages persist in clips table

### IsraelGPT AI Assistant

Powered by **Cloudflare Workers AI** (Llama 2 7B):

```
User: @israelgpt explain quantum computing
IsraelGPT: Quantum computing uses quantum bits (qubits) that can exist in 
           multiple states simultaneously, enabling parallel processing...
```

Trigger with: `@israelgpt`, `@bigyahu`, `@israel`, or `@netanyahu`

### Local Notification Server

Lightweight Node.js server for cross-device notifications:

```bash
# Start server (port 3001)
pnpm notify

# Server polls API for new messages
# Shows notifications even when tab is closed
# No cloud service needed
```

### Message Lifecycle

```
Create → Active (1 hour) → Expired → Auto-Deleted
    ↓
   Clip → Persists in clips table (survives expiry)
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **React 19**: Latest React with Server Components
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Radix UI component primitives
- **TypeScript**: Type safety

### Backend
- **Cloudflare Workers**: Edge API routes
- **D1 Database**: SQLite at the edge
- **Workers AI**: Llama 2 7B model
- **Cron Triggers**: Automatic cleanup

### APIs
- **Giphy**: GIF search and trending (proxied)
- **Polling**: 2-second interval updates
- **Local Server**: Node.js notification server

## 📦 Project Structure

```
echo/
├── app/
│   ├── api/
│   │   ├── rooms/route.ts          # Create/get rooms
│   │   ├── messages/route.ts       # CRUD messages
│   │   ├── poll/route.ts           # Polling endpoint
│   │   ├── typing/route.ts         # Typing indicators
│   │   ├── join/route.ts           # Join room
│   │   ├── giphy/route.ts          # Giphy proxy
│   │   └── clips/route.ts          # Message clipping
│   ├── room/[code]/page.tsx        # Chat room page
│   ├── page.tsx                    # Home (join/create)
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Theme & styles
├── components/
│   ├── chat-interface.tsx          # Main chat UI
│   ├── message-bubble.tsx          # Message display
│   ├── chat-input.tsx              # Input with media
│   ├── typing-indicator.tsx        # Typing animation
│   ├── user-hover-card.tsx         # Hover for DM
│   ├── direct-message-overlay.tsx  # DM interface
│   ├── clips-library.tsx           # Saved messages
│   ├── gif-picker.tsx              # GIF selection
│   └── ui/                         # shadcn components
├── hooks/
│   ├── use-polling.ts              # Polling hook
│   └── use-mobile.tsx              # Responsive hook
├── lib/
│   ├── types.ts                    # TypeScript types
│   ├── chat-utils.ts               # Helper functions
│   ├── d1-client.ts                # D1 operations
│   └── notification-service.ts     # Notifications
├── notification-server/
│   └── server.js                   # Local notify server
├── scripts/
│   └── setup-d1-database.sql       # Database schema
├── wrangler.toml                   # Cloudflare config
└── next.config.ts                  # Next.js config
```

## 🎨 Customization

### Adjust Polling Interval

In `hooks/use-polling.ts`:

```typescript
usePolling({ 
  roomCode, 
  userId, 
  interval: 2000  // Change to 1000 (faster) or 5000 (slower)
})
```

### Change Message Expiry

In `wrangler.toml`:

```toml
[vars]
MESSAGE_EXPIRY_HOURS = "2"  # Change from 1 to any number
```

### Customize Theme

In `app/globals.css`:

```css
:root {
  --background: 0 0% 4%;     /* Darker: 2%, Lighter: 8% */
  --foreground: 0 0% 95%;    /* Text brightness */
  --border: 0 0% 18%;        /* Border visibility */
}
```

## 🧪 Testing

### Create a Room
1. Visit home page
2. Click "Create Room"
3. Optionally set custom code
4. Enter username
5. Share room code

### Test Features
- ✅ Send text messages
- ✅ Share an image URL
- ✅ Search and send GIFs
- ✅ Mention @israelgpt for AI response
- ✅ Edit your messages
- ✅ Clip someone's message
- ✅ Hover over username for DM
- ✅ See typing indicators
- ✅ Watch messages expire after 1 hour

## 🚀 Performance

### Metrics
- **Time to Interactive**: < 2s
- **First Contentful Paint**: < 1s
- **Message Latency**: ~2s (polling interval)
- **Global Edge**: < 50ms API responses
- **Bundle Size**: < 300KB gzipped

### Optimizations
- Edge-first architecture
- D1 database at edge locations
- Indexed SQL queries
- Code splitting
- Image lazy loading
- Debounced typing indicators

## 🌍 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers
- ✅ ChromeOS (full notification support)

## 🔐 Security & Privacy

### Privacy Features
- Anonymous sessions (no accounts)
- Auto-delete after 1 hour
- No tracking or analytics
- Session-based user IDs only
- Local storage for preferences

### Security Measures
- Parameterized SQL queries (prevent injection)
- Input sanitization (XSS protection)
- HTTPS enforced
- CORS configuration
- Rate limiting ready (optional)

## 📋 Scripts

```bash
# Development
pnpm dev              # Start Next.js dev server
pnpm notify           # Start notification server

# Database
pnpm db:migrate       # Run D1 migrations
pnpm db:shell         # Open D1 shell

# Deployment
pnpm build            # Build for production
pnpm cf:deploy        # Deploy to Cloudflare Pages
pnpm cf:dev           # Test with Cloudflare locally

# Utilities
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript validation
pnpm clean            # Clean build artifacts
```

## 🗺️ Roadmap

### Current Release (v1.0)
- [x] Anonymous code-based rooms
- [x] Ephemeral messaging (1-hour expiry)
- [x] Message clipping
- [x] Polling-based real-time updates
- [x] GIF integration (Giphy)
- [x] Image sharing
- [x] IsraelGPT AI assistant
- [x] Typing indicators
- [x] Message editing
- [x] Direct message overlays
- [x] Local notification server
- [x] Monochromatic dark theme

### Future Features
- [ ] End-to-end encryption
- [ ] Voice messages
- [ ] File sharing
- [ ] Message reactions
- [ ] Threading/replies
- [ ] Room passwords
- [ ] Custom expiry times
- [ ] Native mobile apps
- [ ] Multiple AI models
- [ ] Advanced analytics (anonymous)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing`
5. Open Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file.

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Cloudflare](https://cloudflare.com/) - Edge platform
- [Giphy](https://giphy.com/) - GIF integration

## 💬 Support

- **Documentation**: See `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/echo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/echo/discussions)

---

**echo.** - Ephemeral messaging for the privacy-conscious web.

Made with ♥ for anonymous, temporary conversations.
