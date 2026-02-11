# Database Migration - Clips Enhancement

## Required Changes

The clips table needs to be updated to support the new features:
- Message type preservation (text, gif, image)
- Clip sharing functionality
- Share count tracking

## Migration SQL

Run these commands in your Cloudflare D1 database:

```bash
# Option 1: Using wrangler CLI
wrangler d1 execute echo --command="ALTER TABLE clips ADD COLUMN message_type TEXT DEFAULT 'text';"
wrangler d1 execute echo --command="ALTER TABLE clips ADD COLUMN shared_code TEXT;"
wrangler d1 execute echo --command="ALTER TABLE clips ADD COLUMN share_count INTEGER DEFAULT 0;"

# Option 2: Using SQL file
# Create a file named migration-clips.sql with the content below, then run:
# wrangler d1 execute echo --file=./migration-clips.sql
```

## Migration SQL File (migration-clips.sql)

```sql
-- Add message_type column to preserve message format
ALTER TABLE clips ADD COLUMN message_type TEXT DEFAULT 'text';

-- Add shared_code for sharing clips
ALTER TABLE clips ADD COLUMN shared_code TEXT;

-- Add share_count to track how many times a clip has been shared
ALTER TABLE clips ADD COLUMN share_count INTEGER DEFAULT 0;

-- Create index for faster sharing lookups
CREATE INDEX IF NOT EXISTS idx_clips_shared_code ON clips(shared_code);

-- Verify the changes
SELECT sql FROM sqlite_master WHERE type='table' AND name='clips';
```

## Verification

After running the migration, verify the changes:

```bash
wrangler d1 execute echo --command="PRAGMA table_info(clips);"
```

You should see the new columns:
- `message_type` (TEXT, default 'text')
- `shared_code` (TEXT)
- `share_count` (INTEGER, default 0)

## Rollback (if needed)

If you need to rollback the changes:

```sql
-- Note: SQLite doesn't support DROP COLUMN in all cases
-- You may need to recreate the table without these columns
-- This is destructive and will lose clip data

-- Backup first!
CREATE TABLE clips_backup AS SELECT * FROM clips;

-- Recreate without new columns
DROP TABLE clips;
CREATE TABLE clips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  message_content TEXT NOT NULL,
  original_username TEXT NOT NULL,
  clipped_at INTEGER NOT NULL,
  room_code TEXT NOT NULL
);

-- Restore data (without new columns)
INSERT INTO clips (id, user_id, message_id, message_content, original_username, clipped_at, room_code)
SELECT id, user_id, message_id, message_content, original_username, clipped_at, room_code
FROM clips_backup;

-- Clean up
DROP TABLE clips_backup;
```

## Testing

After migration, test these features:
1. Clip a text message → Should save with type 'text'
2. Clip a GIF → Should save with type 'gif' and preserve URL
3. Share a clip → Should copy shareable link
4. Delete and re-clip a message → Original clip should remain unchanged

## Production Deployment

1. **Backup your database first!**
2. Run the migration during low traffic
3. Monitor for errors after deployment
4. Verify all clip functionality works
5. Check that existing clips still work

## Notes

- Existing clips will have `message_type = 'text'` by default
- `shared_code` is NULL until a clip is shared
- `share_count` starts at 0 for all clips
- The migration is backward compatible (won't break existing functionality)
