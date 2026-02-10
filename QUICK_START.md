# Quick Start Guide

## Get Running in 5 Minutes

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```

### 3. Open Browser
Visit [http://localhost:3000](http://localhost:3000)

### 4. Test the App

#### Create Your First Room
1. Click "Create Room"
2. Enter username: `Alice`
3. Note the 6-character room code

#### Join from Another Window
1. Open a new incognito/private window
2. Go to [http://localhost:3000](http://localhost:3000)
3. Click "Join Room"
4. Enter the room code from step 1
5. Enter username: `Bob`

#### Test Features
- Send messages back and forth
- Try editing a message (hover over your message → Edit)
- Clip a message from the other user (hover → Clip)
- Open Clips library (Bookmark icon in header)
- Try the direct message feature (hover over username)
- Upload an image (click image icon in input)
- Test typing indicators

## Project Structure

```
/app                    # Next.js pages
  /page.tsx            # Home (create/join)
  /room/[code]         # Chat room
  /layout.tsx          # Root layout
  /globals.css         # Theme & styles

/components            # React components
  chat-interface.tsx   # Main chat
  message-bubble.tsx   # Individual message
  chat-input.tsx       # Input with media
  clips-library.tsx    # Saved messages
  (+ more)

/hooks                 # Custom React hooks
  use-websocket.ts     # WebSocket management

/lib                   # Utilities & types
  types.ts             # TypeScript interfaces
  chat-utils.ts        # Helper functions
  notification-service.ts

/public                # Static assets
```

## Key Files to Understand

### 1. Theme Configuration
**File**: `app/globals.css`
- Monochromatic color tokens
- Custom CSS variables
- Dark theme defaults

### 2. WebSocket Logic
**File**: `hooks/use-websocket.ts`
- Connection management
- Message sending/receiving
- Typing indicators
- Currently simulated (needs backend)

### 3. Message State
**File**: `components/chat-interface.tsx`
- Message list management
- Auto-scrolling
- Timer display
- User list

### 4. Data Types
**File**: `lib/types.ts`
- Message interface
- User interface
- Room interface
- Notification types

## Development Tips

### Hot Reload
- Changes auto-reload
- Turbopack enabled (faster)
- Check console for errors

### Type Safety
```bash
pnpm type-check
```

### Code Style
- Follow existing patterns
- Use Tailwind utilities
- Keep components small
- Add types to everything

### Testing Changes
1. Test in Chrome (primary)
2. Test in Firefox
3. Test responsive (mobile)
4. Check console for errors
5. Verify no TypeScript errors

## Common Tasks

### Add a New Feature
1. Define types in `lib/types.ts`
2. Create component in `components/`
3. Add logic to `chat-interface.tsx` or relevant page
4. Update WebSocket hook if needed
5. Test thoroughly

### Modify Theme
1. Edit `app/globals.css`
2. Change CSS variables
3. Maintain monochrome palette
4. Test all components

### Add a New Page
1. Create in `app/[name]/page.tsx`
2. Follow existing structure
3. Use proper TypeScript types
4. Test routing

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module Not Found
```bash
pnpm install
rm -rf .next
pnpm dev
```

### TypeScript Errors
```bash
pnpm type-check
# Fix errors before committing
```

### Styling Issues
- Check Tailwind class names
- Verify dark mode classes
- Inspect with browser DevTools
- Check CSS variable names

## Next Steps

1. **Read Documentation**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
   - [README.md](./README.md) - Full overview
   - [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Status

2. **Understand the Stack**
   - Next.js 16 with App Router
   - React 19.2 with Server Components
   - Tailwind CSS for styling
   - TypeScript for type safety

3. **Plan Backend Integration**
   - Review [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
   - Understand WebSocket architecture
   - Plan Durable Objects structure

4. **Deploy**
   - Test production build: `pnpm build`
   - Deploy to Cloudflare or Vercel
   - Set up WebSocket backend

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Cloudflare Workers](https://developers.cloudflare.com/workers)

## Getting Help

- Check existing documentation
- Review code comments
- Look at similar components
- Test in isolation
- Ask for help with context

---

**Happy coding!** 🚀
