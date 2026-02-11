# OpenRouter Proxy Setup Guide

## 🔒 Why Use a Proxy?

The OpenRouter proxy server provides several benefits:

1. **Bypass Blocking**: If OpenRouter is blocked in your region, the proxy can help
2. **Security**: API keys are kept on the server, not exposed to the client
3. **Better Control**: Centralized request handling and logging
4. **CORS Handling**: Automatic CORS header management

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install express http-proxy-middleware
```

### 2. Start the Proxy Server

```bash
pnpm proxy
```

The proxy will start on port 3001 (or your configured port).

### 3. Enable Proxy in Your App

Create a `.env.local` file:

```bash
USE_OPENROUTER_PROXY=true
OPENROUTER_PROXY_URL=http://localhost:3001
```

### 4. Deploy Your App

```bash
pnpm cf:deploy
```

---

## 📝 Configuration

### Environment Variables

Create `.env.local` (for local development):

```bash
# Enable proxy
USE_OPENROUTER_PROXY=true

# Proxy server URL
OPENROUTER_PROXY_URL=http://localhost:3001

# Proxy port (for the proxy server itself)
PROXY_PORT=3001
```

### Cloudflare Pages Environment Variables

For production, add these in Cloudflare Pages dashboard:

1. Go to **Settings** → **Environment variables**
2. Add for **Production** and **Preview**:
   - `USE_OPENROUTER_PROXY` = `true`
   - `OPENROUTER_PROXY_URL` = `https://your-proxy-domain.com`

---

## 🖥️ Proxy Server Details

**File**: `proxy-server/server.js`

**Endpoints**:
- **Health Check**: `GET /health`
- **OpenRouter Proxy**: `POST /api/openrouter/chat/completions`

**Features**:
- Automatic authentication header injection
- CORS handling
- Error handling
- Request/response logging

---

## 🌐 Deploying the Proxy Server

### Option 1: Separate Server (Recommended)

Deploy the proxy to a separate service:

**Railway / Render / Heroku:**

```bash
# Create a new repository with just the proxy-server folder
# Deploy to your preferred platform
# Set environment variable: PROXY_PORT=3001
```

**Update your main app's environment variables:**
```bash
USE_OPENROUTER_PROXY=true
OPENROUTER_PROXY_URL=https://your-proxy.railway.app
```

### Option 2: Same Server (Development Only)

For local development, you can run both:

**Terminal 1 - Proxy:**
```bash
pnpm proxy
```

**Terminal 2 - App:**
```bash
pnpm dev
```

---

## 🔧 How It Works

### Without Proxy (Default)

```
Your App → OpenRouter API (Direct)
```

### With Proxy

```
Your App → Proxy Server → OpenRouter API
```

The proxy:
1. Receives your request
2. Adds authentication headers
3. Forwards to OpenRouter
4. Returns the response
5. Handles CORS automatically

---

## 🧪 Testing the Proxy

### 1. Start the proxy:
```bash
pnpm proxy
```

### 2. Test health check:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "OpenRouter Proxy",
  "timestamp": "2026-02-11T..."
}
```

### 3. Test AI endpoint:
Send a message with `@ai hello` in your chat

---

## 🛡️ Security Best Practices

### Production Deployment

1. **Use HTTPS**: Always deploy proxy with SSL/TLS
2. **Rate Limiting**: Add rate limiting middleware
3. **IP Whitelist**: Restrict access to your app's IP
4. **Monitoring**: Set up logging and monitoring
5. **Environment Variables**: Never commit API keys

### Example Rate Limiting (add to server.js):

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/openrouter', limiter);
```

---

## 📊 Monitoring

The proxy logs all requests. Example output:

```
OpenRouter Proxy Server running on port 3001
Health check: http://localhost:3001/health
Proxy endpoint: http://localhost:3001/api/openrouter/chat/completions
```

---

## 🐛 Troubleshooting

### Proxy won't start

**Issue**: Port already in use

**Solution**: Change the port
```bash
PROXY_PORT=3002 pnpm proxy
```

### CORS errors

**Issue**: CORS headers not working

**Solution**: Check that proxy is running and `USE_OPENROUTER_PROXY=true`

### 502 Bad Gateway

**Issue**: Can't reach OpenRouter

**Solution**: 
1. Check internet connection
2. Verify OpenRouter API status
3. Check proxy logs for errors

### Authentication errors

**Issue**: 401 Unauthorized

**Solution**: Verify API key in `proxy-server/server.js`

---

## 🔄 Switching Between Direct and Proxy

### Use Direct API (Default):
```bash
# .env.local
USE_OPENROUTER_PROXY=false
```

### Use Proxy:
```bash
# .env.local
USE_OPENROUTER_PROXY=true
OPENROUTER_PROXY_URL=http://localhost:3001
```

---

## 📦 Production Deployment Checklist

- [ ] Proxy server deployed to separate service
- [ ] HTTPS enabled on proxy
- [ ] Environment variables set in Cloudflare Pages
- [ ] Rate limiting configured
- [ ] Monitoring/logging set up
- [ ] API key secured (not in code)
- [ ] Test proxy health endpoint
- [ ] Test AI responses through proxy
- [ ] Backup direct API method working

---

## 💡 Tips

1. **Development**: Use direct API (no proxy needed)
2. **Production**: Use proxy if OpenRouter is blocked in your region
3. **Monitoring**: Check proxy logs regularly
4. **Fallback**: Keep direct API as fallback option
5. **Testing**: Test both methods during development

---

## 📚 Additional Resources

- **Express.js**: https://expressjs.com/
- **http-proxy-middleware**: https://github.com/chimurai/http-proxy-middleware
- **OpenRouter API**: https://openrouter.ai/docs

---

**Last Updated**: February 2026
