# ☁️ Cloudflare Edge Proxy - Quick Start

## ✅ What Changed

**Before:** OpenRouter API could be blocked ❌  
**After:** Proxy runs on Cloudflare Edge (unblockable) ✅

---

## 🚀 How It Works

Your app now uses a **built-in proxy** that runs on Cloudflare's edge network:

```
Your App → /api/openrouter-proxy → OpenRouter
          ↓ (Same domain)
          ↓ (Cloudflare Edge)
          ✅ Unblockable!
```

---

## 📦 Deployment

### It's Already Included!

Just deploy normally:

```bash
pnpm cf:deploy
```

The proxy is **automatically deployed** with your app. No extra setup needed!

---

## 🧪 Testing

### Test AI in Chat:
```
Send: @ai hello
```

The AI will respond through the Cloudflare Edge proxy automatically.

---

## 🎯 Benefits

✅ **Unblockable** - Runs on same domain as your app  
✅ **Zero Config** - Works out of the box  
✅ **Free** - Included in Cloudflare Pages  
✅ **Fast** - Runs on 200+ edge datacenters globally  
✅ **Secure** - API key stays server-side  
✅ **No Extra Deployment** - Included automatically  

---

## 📁 What Was Added

1. **`/app/api/openrouter-proxy/route.ts`** - Edge proxy endpoint
2. **`/app/api/messages/route.ts`** - Updated to use proxy by default

---

## 🔧 Configuration

### Default (Recommended)
The proxy is **enabled by default**. No configuration needed!

### Disable Proxy (Not Recommended)
If you want direct API instead, add to `.env.local`:
```bash
USE_CLOUDFLARE_PROXY=false
```

---

## ❓ FAQ

**Q: Do I need to deploy anything extra?**  
A: No! It's included when you run `pnpm cf:deploy`

**Q: Will this work if OpenRouter is blocked?**  
A: Yes! The proxy runs on your Cloudflare Pages domain, making it virtually impossible to block.

**Q: Does this cost extra?**  
A: No! It's included free with Cloudflare Pages.

**Q: How fast is it?**  
A: Very fast! Runs on Cloudflare's edge network (200+ locations globally).

---

## 🎉 That's It!

Just deploy and the proxy works automatically:

```bash
pnpm cf:deploy
```

Test by sending `@ai hello` in any chat room! 🚀

---

**Full documentation:** See `CLOUDFLARE_PROXY.md`
