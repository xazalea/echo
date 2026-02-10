# Cloudflare Pages Setup Guide

## ⚠️ IMPORTANT: Required Dashboard Configuration

The `nodejs_compat` compatibility flag and bindings **MUST** be configured in the Cloudflare Pages dashboard. The `wrangler.toml` file is for reference only.

## Step-by-Step Setup

### 1. Set Compatibility Flags (REQUIRED)

1. Go to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages** → **Pages**
3. Click on your project: `echo-98z` or `echo-chat`
4. Go to **Settings** → **Compatibility Flags**
5. Under **Compatibility Flags**, add:
   - `nodejs_compat`
6. **IMPORTANT**: Set this for **BOTH**:
   - Production environment
   - Preview environment
7. Click **Save**

### 2. Configure Bindings

1. In your Pages project, go to **Settings** → **Functions**
2. Scroll down to **Bindings**

#### Add D1 Database Binding:
- Click **Add binding**
- Type: **D1 Database**
- Variable name: `DB`
- Database: Select `echo-db` (Database ID: `0f37239d-cd8b-4366-8c88-b11a89076a6e`)
- Click **Save**

#### Add Workers AI Binding:
- Click **Add binding**
- Type: **Workers AI**
- Variable name: `AI`
- Click **Save**

### 3. Add Environment Variables

1. Go to **Settings** → **Environment variables**
2. Add these variables for **Production** and **Preview**:
   - `GIPHY_API_KEY` = `6zzmXysXbC6FVLIrBCIeQUTEjtl9DNN5`
   - `MESSAGE_EXPIRY_HOURS` = `1`
   - `ROOM_EXPIRY_HOURS` = `24`

### 4. Redeploy

After configuring everything, trigger a new deployment:

```bash
pnpm cf:deploy
```

Or push a new commit to trigger automatic deployment.

## Verify Setup

After configuration, your site should work at:
- Production: https://echo-98z.pages.dev
- Preview: https://391b4c65.echo-98z.pages.dev

## Troubleshooting

### Error: "no nodejs_compat compatibility flag set"
- **Solution**: Go to Settings → Compatibility Flags and add `nodejs_compat` to both Production and Preview environments

### Error: 404 Not Found
- **Solution**: Make sure all bindings (DB, AI) are configured in Settings → Functions → Bindings

### Error: Database not available
- **Solution**: Verify the D1 database binding is set up correctly with variable name `DB`
