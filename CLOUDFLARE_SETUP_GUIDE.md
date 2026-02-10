# echo. - Cloudflare Deployment Guide

Complete guide for deploying echo. on Cloudflare with D1, Workers AI, and local notification server.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Wrangler CLI installed: `npm install -g wrangler`
- Authenticated with Wrangler: `wrangler login`

## Part 1: Cloudflare D1 Database Setup

### 1. Create D1 Database

```bash
wrangler d1 create echo-db
```

This will output a database ID. Copy it and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "echo-db"
database_id = "your-database-id-here"  # Paste your ID here
```

### 2. Run Database Migrations

```bash
wrangler d1 execute echo-db --file=./scripts/setup-d1-database.sql
```

### 3. Verify Database Schema

```bash
wrangler d1 execute echo-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

You should see: rooms, messages, room_users, clips, typing_indicators, direct_messages, notification_settings

## Part 2: Workers AI Setup

Workers AI is automatically available with your Cloudflare account. No additional setup required!

The wrangler.toml already includes:

```toml
[ai]
binding = "AI"
```

## Part 3: KV Namespace (Optional - for rate limiting)

```bash
wrangler kv:namespace create RATE_LIMITER
```

Update the ID in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMITER"
id = "your-kv-id-here"
```

## Part 4: Environment Variables

The Giphy API key is already configured in `wrangler.toml`:

```toml
[vars]
GIPHY_API_KEY = "6zzmXysXbC6FVLIrBCIeQUTEjtl9DNN5"
MESSAGE_EXPIRY_HOURS = "1"
ROOM_EXPIRY_HOURS = "24"
```

## Part 5: Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Local Cloudflare Dev Server

```bash
pnpm dev
```

This runs Next.js with Cloudflare Workers locally, connecting to your D1 database.

### 3. Test API Endpoints

Open your browser to `http://localhost:3000` and test:

1. Create a room
2. Join with a username
3. Send messages
4. Try mentioning @israelgpt
5. Share a GIF
6. Clip a message

## Part 6: Deploy to Cloudflare Pages

### Option A: Deploy via Wrangler

```bash
# Build the project
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy .next
```

### Option B: Deploy via Git (Recommended)

1. Push your code to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Create new project → Connect to Git
4. Select your repository
5. Configure build settings:
   - Build command: `pnpm build`
   - Build output directory: `.next`
   - Root directory: `/`
6. Add environment variables (they'll be copied from wrangler.toml automatically)
7. Click "Save and Deploy"

### Option C: Automatic Deployments

Set up GitHub Actions for automatic deployments:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: echo-chat
          directory: .next
```

## Part 7: Local Notification Server

The notification server runs locally to deliver notifications when the chat tab is closed.

### 1. Install Notification Server

From the project root:

```bash
# Option A: Run directly
node notification-server/server.js

# Option B: Install as a global command (optional)
cd notification-server
npm link
echo-notify
```

### 2. Start Notification Server

```bash
node notification-server/server.js
```

The server will start on port 3001. Keep it running in a separate terminal.

### 3. Configure Client

The client automatically detects the notification server at `http://localhost:3001`.

When you join a room, it subscribes for notifications. When you close the tab, you'll still receive notifications for new messages.

### 4. Test Notifications

1. Open two browser windows
2. Join the same room in both
3. Close one window
4. Send a message from the other
5. Check your terminal - you should see the notification logged

### 5. Native Notifications (Optional)

For native OS notifications, install additional dependencies:

**macOS:**
```bash
# Uses osascript (built-in)
```

**Windows:**
```bash
npm install node-notifier
```

**Linux:**
```bash
# Uses notify-send (install via package manager)
sudo apt-get install libnotify-bin
```

Then uncomment the native notification code in `notification-server/server.js`.

## Part 8: Cloudflare Cron Jobs

The platform includes automatic cleanup of expired messages. This is configured in `wrangler.toml`:

```toml
[triggers]
crons = ["*/10 * * * *"]  # Run every 10 minutes
```

Add a cron handler in your Workers code (already included in API routes):

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await cleanupExpiredData(env.DB)
  }
}
```

## Part 9: Testing Your Deployment

### 1. Test Basic Functionality

1. Visit your deployed URL
2. Click "Create Room"
3. Set a custom code and username
4. Share the code with someone
5. Have them join
6. Exchange messages

### 2. Test IsraelGPT

Send a message mentioning:
- @israelgpt
- @bigyahu
- @israel
- @netanyahu

You should get an AI-generated response.

### 3. Test GIF Sharing

1. Click the GIF button in chat input
2. Search for a GIF
3. Click to send
4. Verify it appears in chat

### 4. Test Message Clipping

1. Hover over any message
2. Click the bookmark icon
3. Open the Clips sidebar
4. Verify the message is saved

### 5. Test Message Expiry

1. Send a message
2. Note the timestamp
3. Wait 1 hour (or adjust MESSAGE_EXPIRY_HOURS for testing)
4. Refresh the page
5. Verify old messages are gone

## Part 10: Monitoring & Debugging

### View Logs

```bash
# Watch real-time logs
wrangler tail

# View specific worker logs
wrangler tail --format pretty
```

### Check D1 Database

```bash
# View all rooms
wrangler d1 execute echo-db --command="SELECT * FROM rooms"

# View all messages
wrangler d1 execute echo-db --command="SELECT * FROM messages"

# Check message expiry
wrangler d1 execute echo-db --command="SELECT id, content, expires_at FROM messages WHERE expires_at < $(date +%s)000"
```

### Performance Metrics

Monitor from Cloudflare Dashboard:
- Workers Analytics
- D1 Database metrics
- AI usage
- Request count and latency

## Part 11: Customization

### Adjust Polling Interval

In `hooks/use-polling.ts`, change the interval:

```typescript
export function usePolling({ interval = 2000 }: UsePollingOptions) {
  // 2000ms = 2 seconds
  // Adjust based on your needs:
  // - Faster: 1000ms (more responsive, more requests)
  // - Slower: 5000ms (less responsive, fewer requests)
}
```

### Adjust Message Expiry

In `wrangler.toml`:

```toml
[vars]
MESSAGE_EXPIRY_HOURS = "2"  # Change to any number
```

### Customize Theme

Edit `app/globals.css` to adjust the monochromatic theme:

```css
:root {
  --background: 0 0% 4%;     /* Darker or lighter background */
  --foreground: 0 0% 95%;    /* Text color */
  --accent: 0 0% 18%;        /* Hover states */
  /* ... */
}
```

## Part 12: Troubleshooting

### Issue: "Database not available"

**Solution:** Ensure D1 binding is correct in wrangler.toml and you're running `wrangler dev` or deployed to Cloudflare.

### Issue: GIFs not loading

**Solution:** Check that the Giphy API key is set correctly in wrangler.toml.

### Issue: IsraelGPT not responding

**Solution:** Ensure Workers AI is enabled for your account. Check Cloudflare Dashboard → AI.

### Issue: Messages not persisting

**Solution:** Run database migrations again:
```bash
wrangler d1 execute echo-db --file=./scripts/setup-d1-database.sql
```

### Issue: Notification server not working

**Solution:** 
1. Ensure it's running on port 3001
2. Check CORS is enabled
3. Verify client is connecting: check browser Network tab for requests to localhost:3001

### Issue: White screen on deployment

**Solution:**
1. Check build output: `pnpm build`
2. Ensure `next.config.ts` has correct settings for Cloudflare
3. Check browser console for errors
4. Verify all API routes are deployed

## Part 13: Production Checklist

Before going live:

- [ ] D1 database created and migrated
- [ ] Wrangler.toml configured with correct IDs
- [ ] Environment variables set
- [ ] Cron job configured for cleanup
- [ ] Custom domain connected (optional)
- [ ] Analytics enabled
- [ ] Rate limiting configured (optional)
- [ ] Tested all features:
  - [ ] Room creation
  - [ ] Joining rooms
  - [ ] Sending messages
  - [ ] GIF sharing
  - [ ] Message clipping
  - [ ] IsraelGPT responses
  - [ ] Typing indicators
  - [ ] Message editing
  - [ ] Message expiry
- [ ] Notification server documented for users
- [ ] Privacy policy added (messages expire after 1 hour)

## Support

For issues:
1. Check Cloudflare Workers logs: `wrangler tail`
2. Check browser console
3. Verify database schema
4. Test API endpoints directly

## Architecture Summary

```
┌─────────────────┐
│   Next.js App   │ ← User interface
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │ ← Edge functions
│  (Edge Runtime) │
└────────┬────────┘
         │
         ├──────────┬──────────┬──────────┐
         ▼          ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐
    │   D1   │ │Workers │ │ Giphy  │ │  Local  │
    │Database│ │   AI   │ │  API   │ │ Notify  │
    └────────┘ └────────┘ └────────┘ └─────────┘
```

All running on Cloudflare's global network for low latency worldwide!
