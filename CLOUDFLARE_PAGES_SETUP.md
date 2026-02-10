# Cloudflare Pages Setup Guide

## ⚠️ IMPORTANT: Required Dashboard Configuration

The `nodejs_compat` compatibility flag and bindings **MUST** be configured in the Cloudflare Pages dashboard. The `wrangler.toml` file is for reference only.

## Step-by-Step Setup

### 1. Set Compatibility Flags (REQUIRED)

⚠️ **IMPORTANT**: The `@cloudflare/next-on-pages` adapter automatically manages compatibility flags. 

**DO NOT manually add `nodejs_compat` in the dashboard** - this causes conflicts!

If you see an error about conflicting flags:
1. Go to **Settings** → **Compatibility Flags**
2. **Remove** any `nodejs_compat` flags you added manually
3. **Remove** any `nodejs_compat_populate_process_env` or `nodejs_compat_do_not_populate_process_env` flags
4. Let the adapter handle compatibility flags automatically
5. Redeploy: `pnpm cf:deploy`

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
- **Solution**: The adapter should handle this automatically. If you see this error:
  1. Go to Settings → Compatibility Flags
  2. **Remove** any manually added `nodejs_compat` flags
  3. **Remove** any `nodejs_compat_populate_process_env` or `nodejs_compat_do_not_populate_process_env` flags
  4. Redeploy: `pnpm cf:deploy`
  5. The adapter will automatically configure the correct flags

### Error: "Compatibility flags are mutually contradictory: nodejs_compat_populate_process_env vs nodejs_compat_do_not_populate_process_env"
- **Solution**: 
  1. Go to Settings → Compatibility Flags
  2. **Remove ALL** compatibility flags (including `nodejs_compat`)
  3. Let the adapter handle compatibility flags automatically
  4. Redeploy: `pnpm cf:deploy`

### Error: 404 Not Found
- **Solution**: Make sure all bindings (DB, AI) are configured in Settings → Functions → Bindings

### Error: Database not available
- **Solution**: Verify the D1 database binding is set up correctly with variable name `DB`
