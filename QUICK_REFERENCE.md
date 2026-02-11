# Echo Chat - Quick Reference Card

## 🎯 AI Prompt Location

**File:** `/app/api/messages/route.ts`

**System Prompt (Line 103-105):**
```typescript
content: 'You are Echo AI, a helpful and friendly assistant...'
```

**Change this to customize AI personality!**

---

## 🔧 Quick Customization

### Change AI Personality
Edit line 103-105 in `/app/api/messages/route.ts`:

```typescript
// Current (Friendly)
'You are Echo AI, a helpful and friendly assistant...'

// Casual
'You are Echo AI, a chill and fun assistant. Be super casual...'

// Professional
'You are Echo AI, a professional assistant. Maintain formal tone...'

// Creative
'You are Echo AI, a creative and imaginative assistant. Be poetic...'
```

### Change AI Model
Edit line 14 in `/app/api/messages/route.ts`:

```typescript
const VENICE_MODEL = 'openai/gpt-4o'  // Current

// Options:
// 'anthropic/claude-3-opus'
// 'google/gemini-pro'
// 'meta-llama/llama-3-70b'
```

### Change AI Mention Triggers
Edit line 80 in `/app/api/messages/route.ts`:

```typescript
const mentionPatterns = /@ai|@assistant|@bot|@echo/gi

// Custom:
const mentionPatterns = /@gpt|@helper/gi
```

### Change AI Display Name
Edit line 126 in `/app/api/messages/route.ts`:

```typescript
'Echo AI',  // Change this!
```

---

## 📦 Deploy Commands

```bash
# Build
pnpm build:cf

# Deploy to Cloudflare
pnpm cf:deploy

# Run locally
pnpm dev
```

---

## 🎨 UI Customization

### Colors
**File:** `/app/globals.css` (lines 15-41)

```css
--background: 0 0% 5%;
--foreground: 0 0% 96%;
--muted: 0 0% 16%;
--accent: 0 0% 20%;
```

### Spacing
**Message bubbles:** `/components/message-bubble.tsx`
**Chat input:** `/components/chat-input.tsx`
**Chat interface:** `/components/chat-interface.tsx`

---

## 🔑 API Keys

**OpenRouter API Key (Line 13):**
```typescript
const OPENROUTER_API_KEY = 'sk-or-v1-...'
```

**Giphy API Key:**
In Cloudflare Pages environment variables:
```
GIPHY_API_KEY=6zzmXysXbC6FVLIrBCIeQUTEjtl9DNN5
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/app/api/messages/route.ts` | AI integration & messages |
| `/app/api/dm/route.ts` | Direct messages |
| `/app/api/clips/route.ts` | Clips/bookmarks |
| `/hooks/use-polling.ts` | Real-time updates |
| `/components/chat-interface.tsx` | Main chat UI |
| `/app/globals.css` | Colors & styling |

---

## 🧪 Testing

1. **Test AI:** Send `@ai hello` in any chat
2. **Test DMs:** Click username → Send Message
3. **Test Clips:** Click bookmark icon on message
4. **Test GIFs:** Click film icon in input

---

## 📖 Full Documentation

- **AI Config:** `AI_CONFIGURATION.md`
- **All Changes:** `IMPROVEMENTS_SUMMARY.md`
- **Deployment:** `CLOUDFLARE_PAGES_SETUP.md`

---

**Quick Start:** Just edit line 103-105 in `/app/api/messages/route.ts` to change AI personality!
