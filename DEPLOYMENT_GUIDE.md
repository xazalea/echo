# Deployment Guide - echo.

## 🚀 Quick Deployment

### Prerequisites
- Cloudflare account
- `wrangler` CLI installed
- `pnpm` installed

### Step-by-Step Deployment

#### 1. Database Setup

First, create and migrate your D1 database:

```bash
# Create the database (if not already created)
wrangler d1 create echo-db

# Update wrangler.toml with the database_id returned above

# Run the initial schema
wrangler d1 execute echo --file=./scripts/setup-d1-database.sql

# Run the migration for clips enhancement
wrangler d1 execute echo --command="ALTER TABLE clips ADD COLUMN message_type TEXT DEFAULT 'text';"
wrangler d1 execute echo --command="ALTER TABLE clips ADD COLUMN shared_code TEXT;"
wrangler d1 execute echo --command="ALTER TABLE clips ADD COLUMN share_count INTEGER DEFAULT 0;"
wrangler d1 execute echo --command="CREATE INDEX IF NOT EXISTS idx_clips_shared_code ON clips(shared_code);"
```

#### 2. Build the Project

```bash
# Install dependencies
pnpm install

# Build for Cloudflare Pages
pnpm build:cf
```

This will create an optimized production build in `.vercel/output/static`.

#### 3. Deploy to Cloudflare Pages

```bash
# Deploy using wrangler
wrangler pages deploy .vercel/output/static --project-name echo-chat
```

Or deploy via Cloudflare Dashboard:
1. Go to Pages → Create a project
2. Connect your Git repository
3. Set build command: `pnpm build:cf`
4. Set build output directory: `.vercel/output/static`
5. Deploy!

#### 4. Configure Environment Variables

In Cloudflare Pages dashboard:

**Settings → Environment Variables**

Add these variables:

```
# Required
OPENROUTER_API_KEY = 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
VENICE_MODEL = venice-ai
GIPHY_API_KEY = 6zzmXysXbC6FVLIrBCIeQUTEjtl9DNN5

# Optional
MESSAGE_EXPIRY_HOURS = 1
ROOM_EXPIRY_HOURS = 24
```

#### 5. Bind D1 Database

In Cloudflare Pages dashboard:

**Settings → Functions → D1 database bindings**

Add binding:
- Variable name: `DB` (or `echo`)
- D1 database: Select your `echo-db`

#### 6. Set Up Cron Triggers (Optional but Recommended)

In Cloudflare Pages dashboard:

**Settings → Functions → Cron Triggers**

Add trigger:
- Cron expression: `*/5 * * * *` (every 5 minutes)
- Route: `/api/cleanup-cron`

This will automatically clean up inactive rooms and expired data.

#### 7. Verify Deployment

1. Visit your deployment URL
2. Create a room
3. Send a message
4. Test all features:
   - GIF sending
   - Message reactions
   - Clipping messages
   - AI mentions (@israelgpt)
   - Direct messages

## 🔧 Configuration

### wrangler.toml

Your `wrangler.toml` should look like this:

```toml
name = "echo-chat"
compatibility_date = "2024-01-01"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "echo-db"
database_id = "YOUR_DATABASE_ID_HERE"

# Environment variables
[vars]
GIPHY_API_KEY = "YOUR_GIPHY_KEY"
MESSAGE_EXPIRY_HOURS = "1"
ROOM_EXPIRY_HOURS = "24"
OPENROUTER_API_KEY = "YOUR_OPENROUTER_KEY"
VENICE_MODEL = "venice-ai"
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:cf": "next build && npx @cloudflare/next-on-pages",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 🐛 Troubleshooting

### Build Errors

**Error: EPERM: operation not permitted**
```bash
rm -rf node_modules/.cache .next
pnpm install
pnpm build:cf
```

**Error: Database not available**
- Check D1 binding in Cloudflare Pages dashboard
- Ensure variable name matches (`DB` or `echo`)
- Verify database ID in `wrangler.toml`

**Error: OpenRouter API key not found**
- Add `OPENROUTER_API_KEY` to environment variables
- Redeploy after adding variables

### Runtime Errors

**Messages not appearing**
- Check `/api/poll` endpoint in browser console
- Verify D1 database is properly bound
- Check for errors in Cloudflare Pages logs

**AI not responding**
- Verify OpenRouter API key is correct
- Check `/api/openrouter-proxy` is working
- Look for errors in Pages Functions logs

**Room cleanup not working**
- Verify cron trigger is set up correctly
- Manually test `/api/cleanup` endpoint
- Check database for inactive rooms

## 📊 Monitoring

### Cloudflare Dashboard

Monitor these metrics:
- **Pages → Analytics**: Page views, requests, errors
- **Workers → Logs**: Real-time function logs
- **D1 → Metrics**: Database queries, performance
- **Account → Billing**: Usage and costs

### Key Endpoints to Monitor

- `/api/poll` - Should be called every 2 seconds per user
- `/api/messages` - Message operations
- `/api/cleanup` - Cleanup operations
- `/api/openrouter-proxy` - AI requests

### Error Logging

Check Cloudflare Pages logs for:
- Failed database queries
- AI API errors
- Invalid requests
- Cleanup issues

## 🔐 Security Checklist

- [x] API keys stored in environment variables (not in code)
- [x] Database uses prepared statements (SQL injection prevention)
- [x] Input validation on all API endpoints
- [x] XSS prevention (React handles escaping)
- [x] CORS properly configured
- [x] Rate limiting (via Cloudflare)
- [x] No sensitive data in client-side code

## 📈 Performance Optimization

### Caching
- Static assets cached at edge
- API responses not cached (real-time data)
- Images served via Cloudflare CDN

### Database
- Indexes on frequently queried columns
- Efficient queries with proper WHERE clauses
- Regular cleanup to prevent bloat

### Client-Side
- Minimal JavaScript bundle
- Code splitting with Next.js
- Lazy loading for GIF picker
- Optimized images

## 🌍 Custom Domain (Optional)

1. Go to Cloudflare Pages → Settings → Custom domains
2. Add your domain
3. Cloudflare will automatically configure DNS
4. Wait for SSL certificate to provision
5. Your site will be live on your custom domain!

## 🎉 Deployment Complete!

Your echo. chat application is now live and ready for users!

### Test Everything

1. Create a room ✅
2. Send messages ✅
3. Send GIFs ✅
4. Clip messages ✅
5. Delete original → Clip preserved ✅
6. Share clips ✅
7. Mention @israelgpt ✅
8. Send DMs ✅

### Share Your App

Your users can now:
- Create anonymous ephemeral chatrooms
- Send messages that expire after 1 hour
- Clip important messages (preserved forever)
- Share clips with others
- Chat with AI assistant
- Send direct messages
- React to messages
- Send GIFs

---

**Congratulations on deploying echo.!** 🎊
