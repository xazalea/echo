# 🚀 OpenRouter Proxy - Quick Start

## ✅ What Was Set Up

I've created an Express proxy server that:
- **Secures your API key** on the server (not exposed to clients)
- **Bypasses blocking** if OpenRouter is blocked in your region
- **Handles CORS** automatically
- **Adds authentication** headers automatically

---

## 📁 Files Created

1. **`proxy-server/server.js`** - The proxy server
2. **`PROXY_SETUP.md`** - Complete documentation
3. **`package.json`** - Updated with proxy script and dependencies

---

## 🎯 How to Use

### Option 1: Without Proxy (Default - Simpler)

Just deploy normally:
```bash
pnpm cf:deploy
```

The app will connect directly to OpenRouter.

### Option 2: With Proxy (If OpenRouter is Blocked)

#### Step 1: Start the proxy server
```bash
pnpm proxy
```

This starts the proxy on port 3001.

#### Step 2: Enable proxy in your app

Create `.env.local`:
```bash
USE_OPENROUTER_PROXY=true
OPENROUTER_PROXY_URL=http://localhost:3001
```

#### Step 3: Deploy
```bash
pnpm cf:deploy
```

---

## 🧪 Test the Proxy

### 1. Start proxy:
```bash
pnpm proxy
```

You should see:
```
OpenRouter Proxy Server running on port 3001
Health check: http://localhost:3001/health
```

### 2. Test health:
```bash
curl http://localhost:3001/health
```

### 3. Test in chat:
Send `@ai hello` in any chat room

---

## 🌐 Production Deployment

For production, deploy the proxy to a separate service:

### Recommended Services:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **Fly.io**: https://fly.io

### Steps:

1. **Deploy proxy server** to your chosen service
2. **Get the proxy URL** (e.g., `https://your-proxy.railway.app`)
3. **Add to Cloudflare Pages** environment variables:
   - `USE_OPENROUTER_PROXY` = `true`
   - `OPENROUTER_PROXY_URL` = `https://your-proxy.railway.app`

---

## 🔧 Configuration

### Current Setup (Direct API - No Proxy)

```typescript
// app/api/messages/route.ts
USE_PROXY = false  // Default
```

### Enable Proxy

Create `.env.local`:
```bash
USE_OPENROUTER_PROXY=true
OPENROUTER_PROXY_URL=http://localhost:3001
```

---

## 📊 How It Works

### Without Proxy:
```
Your App → OpenRouter API (Direct)
```

### With Proxy:
```
Your App → Proxy Server → OpenRouter API
          (adds API key)
```

The proxy:
1. Receives your request
2. Adds `Authorization: Bearer YOUR_API_KEY`
3. Forwards to OpenRouter
4. Returns response
5. Handles CORS

---

## 🎨 Benefits

✅ **Security**: API key stays on server
✅ **Bypass Blocking**: Works even if OpenRouter is blocked
✅ **CORS**: Automatic CORS handling
✅ **Logging**: Centralized request logging
✅ **Control**: Easy to add rate limiting, monitoring, etc.

---

## 🚨 Important Notes

1. **Default is Direct API** - No proxy needed unless OpenRouter is blocked
2. **Proxy is optional** - Only use if you need it
3. **Local development** - Proxy runs on port 3001
4. **Production** - Deploy proxy to separate service

---

## 📝 Commands

```bash
# Install dependencies (already done)
pnpm install

# Start proxy server
pnpm proxy

# Deploy app (with or without proxy)
pnpm cf:deploy

# Run app locally
pnpm dev
```

---

## 🐛 Troubleshooting

### Proxy won't start
```bash
# Change port if 3001 is in use
PROXY_PORT=3002 pnpm proxy
```

### Still getting blocked
1. Make sure proxy is running: `pnpm proxy`
2. Check `.env.local` has `USE_OPENROUTER_PROXY=true`
3. Verify proxy URL is correct

### CORS errors
- Ensure proxy is running
- Check browser console for actual error
- Verify `USE_OPENROUTER_PROXY=true`

---

## 📚 Full Documentation

See **`PROXY_SETUP.md`** for complete details on:
- Production deployment
- Security best practices
- Rate limiting
- Monitoring
- Advanced configuration

---

## ✨ Summary

**For most users**: Just deploy normally (`pnpm cf:deploy`) - no proxy needed!

**If OpenRouter is blocked**: 
1. Run `pnpm proxy`
2. Add `.env.local` with proxy settings
3. Deploy

That's it! 🎉
