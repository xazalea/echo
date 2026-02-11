# AI Configuration Guide

## 🤖 AI Assistant Settings

Echo uses **OpenRouter** with the **Venice AI (GPT-4o)** model to power the AI assistant.

### 🔒 Built-in Cloudflare Edge Proxy

Your app includes an **unblockable proxy** that runs on Cloudflare's edge network:
- Runs on same domain as your app
- Automatically deployed with your app
- Makes OpenRouter virtually impossible to block
- See `CLOUDFLARE_PROXY.md` for details

### Location of AI Configuration

**File:** `/app/api/messages/route.ts`

**Lines:** 13-14 and 87-136

---

## 🔧 How to Customize the AI

### 1. Change the AI Model

To use a different model from OpenRouter, modify line 14:

```typescript
const VENICE_MODEL = 'openai/gpt-4o'  // Current model
```

**Available OpenRouter Models:**
- `openai/gpt-4o` - GPT-4 Optimized (current)
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `anthropic/claude-3-opus` - Claude 3 Opus
- `anthropic/claude-3-sonnet` - Claude 3 Sonnet
- `google/gemini-pro` - Gemini Pro
- `meta-llama/llama-3-70b` - Llama 3 70B
- And many more at: https://openrouter.ai/models

### 2. Change the AI Personality & System Prompt

**Location:** Lines 103-105 in `/app/api/messages/route.ts`

```typescript
{
  role: 'system',
  content: 'You are Echo AI, a helpful and friendly assistant in an anonymous ephemeral chat platform called echo. Be concise, engaging, and helpful. Keep responses conversational and under 200 characters when possible. Match the tone of the conversation and be creative when appropriate.',
}
```

**Example Custom Prompts:**

**For a more casual AI:**
```typescript
content: 'You are Echo AI, a chill and fun assistant. Be super casual, use internet slang, and keep it short. Drop emojis when it feels right. Keep responses under 200 characters.',
```

**For a professional AI:**
```typescript
content: 'You are Echo AI, a professional assistant in a business communication platform. Provide clear, concise, and professional responses. Maintain a formal tone and keep responses under 200 characters.',
```

**For a creative AI:**
```typescript
content: 'You are Echo AI, a creative and imaginative assistant. Be poetic, use metaphors, and think outside the box. Keep responses engaging and under 200 characters.',
```

**For a technical AI:**
```typescript
content: 'You are Echo AI, a technical assistant specializing in programming and technology. Provide accurate, detailed technical information. Use code examples when relevant. Keep responses under 300 characters.',
```

### 3. Change How Users Mention the AI

**Location:** Line 80 in `/app/api/messages/route.ts`

```typescript
const mentionPatterns = /@ai|@assistant|@bot|@echo/gi
```

**Current mentions that trigger the AI:**
- `@ai`
- `@assistant`
- `@bot`
- `@echo`

**To customize:**
```typescript
// Example: Make it respond to @gpt or @helper
const mentionPatterns = /@gpt|@helper|@ai/gi

// Example: Make it respond to a custom name
const mentionPatterns = /@jarvis|@friday/gi
```

### 4. Adjust Response Length

**Location:** Line 117 in `/app/api/messages/route.ts`

```typescript
max_tokens: 300,  // Maximum length of AI response
```

- Increase for longer responses (e.g., `500`)
- Decrease for shorter responses (e.g., `150`)

### 5. Adjust AI Creativity (Temperature)

**Location:** Line 118 in `/app/api/messages/route.ts`

```typescript
temperature: 0.7,  // Controls randomness (0.0 - 1.0)
```

- `0.0` - Very focused and deterministic
- `0.5` - Balanced
- `0.7` - Creative (current)
- `1.0` - Very creative and random

### 6. Change the AI's Display Name

**Location:** Line 126 in `/app/api/messages/route.ts`

```typescript
const aiMessage = await createMessage(
  db,
  room.id,
  'echo-ai',        // User ID
  'Echo AI',        // Display name (change this!)
  responseText,
  'text'
)
```

**Example:**
```typescript
'Echo AI',        // Current
'Assistant',      // Simple
'GPT-4',          // Model name
'Helper Bot',     // Friendly
'Oracle',         // Creative
```

---

## 🔐 API Key Management

**Current API Key Location:** Line 13 in `/app/api/messages/route.ts`

```typescript
const OPENROUTER_API_KEY = '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'
```

### ⚠️ Security Best Practice

For production, move the API key to environment variables:

1. Add to `.env.local`:
```bash
OPENROUTER_API_KEY=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
```

2. Update the code:
```typescript
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
```

3. Add to Cloudflare Pages environment variables in the dashboard

---

## 📝 Complete AI Configuration Section

Here's the complete section you can modify (lines 80-134):

```typescript
// Check if message mentions the AI assistant
const mentionPatterns = /@ai|@assistant|@bot|@echo/gi
const hasAIMention = mentionPatterns.test(content)

let message = await createMessage(db, room.id, userId, username, content, type)

// If AI is mentioned, generate a response using OpenRouter (Venice AI)
if (hasAIMention) {
  try {
    const cleanedContent = content.replace(mentionPatterns, '').trim()
    
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://echo.chat',
        'X-Title': 'Echo Chat',
      },
      body: JSON.stringify({
        model: VENICE_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are Echo AI, a helpful and friendly assistant in an anonymous ephemeral chat platform called echo. Be concise, engaging, and helpful. Keep responses conversational and under 200 characters when possible. Match the tone of the conversation and be creative when appropriate.',
          },
          {
            role: 'user',
            content: cleanedContent,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!aiResponse.ok) {
      throw new Error(`OpenRouter API error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    
    const responseText = aiData.choices?.[0]?.message?.content || 'I am here to help!'

    // Create AI response message
    const aiMessage = await createMessage(
      db,
      room.id,
      'echo-ai',
      'Echo AI',
      responseText,
      'text'
    )

    return NextResponse.json({
      success: true,
      message,
      aiResponse: aiMessage,
    })
  } catch (aiError) {
    console.error('[v0] AI response error:', aiError)
    // Continue without AI response
  }
}
```

---

## 🎯 Quick Customization Examples

### Example 1: Sarcastic AI
```typescript
content: 'You are Echo AI, a witty and slightly sarcastic assistant. Use dry humor and clever comebacks. Keep it fun but not mean. Responses under 200 characters.',
```

### Example 2: Motivational Coach
```typescript
content: 'You are Echo AI, an enthusiastic motivational coach. Be positive, encouraging, and energetic. Use motivational language and empower users. Keep responses under 200 characters.',
```

### Example 3: Zen Master
```typescript
content: 'You are Echo AI, a wise and calm zen master. Provide thoughtful, philosophical responses. Use metaphors from nature. Keep responses under 200 characters.',
```

---

## 🔄 Testing Your Changes

After modifying the AI configuration:

1. Save the file
2. Rebuild the project: `pnpm build:cf`
3. Deploy: `pnpm cf:deploy`
4. Test by mentioning the AI in a chat: `@ai hello`

---

## 📚 Additional Resources

- **OpenRouter Documentation:** https://openrouter.ai/docs
- **Available Models:** https://openrouter.ai/models
- **Pricing:** https://openrouter.ai/docs#pricing
- **API Reference:** https://openrouter.ai/docs#api-reference

---

## 💡 Pro Tips

1. **Test locally first** before deploying to production
2. **Monitor API usage** on your OpenRouter dashboard
3. **Adjust max_tokens** based on your needs (lower = cheaper)
4. **Use temperature wisely** - lower for factual, higher for creative
5. **Keep the system prompt concise** for better performance
6. **Consider rate limiting** for production use

---

**Last Updated:** February 2026
**Version:** 1.0
