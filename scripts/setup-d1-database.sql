-- Cloudflare D1 Database Schema for echo.
-- Run this with: wrangler d1 execute echo-db --file=./scripts/setup-d1-database.sql

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_by TEXT NOT NULL
);

-- Messages table with 1-hour auto-deletion
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'gif', 'system'
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  edited_at INTEGER,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Users in rooms (session-based, anonymous)
CREATE TABLE IF NOT EXISTS room_users (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  is_online INTEGER DEFAULT 1,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Clips (saved messages) - persists beyond 1 hour
-- Stores a snapshot of the message at time of clipping
-- Preserved even if original message is deleted or edited
CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  message_content TEXT NOT NULL,
  original_username TEXT NOT NULL,
  clipped_at INTEGER NOT NULL,
  room_code TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  shared_code TEXT,
  share_count INTEGER DEFAULT 0
);

-- Typing indicators (ephemeral)
CREATE TABLE IF NOT EXISTS typing_indicators (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

-- Direct messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  from_username TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  to_username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  read_at INTEGER
);

-- Notification settings (stored client-side but can sync)
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id TEXT PRIMARY KEY,
  notify_on_mention INTEGER DEFAULT 1,
  notify_on_dm INTEGER DEFAULT 1,
  notify_on_clip INTEGER DEFAULT 1,
  notify_sound INTEGER DEFAULT 1,
  updated_at INTEGER NOT NULL
);

-- Reactions on messages
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_room_users_room_id ON room_users(room_id);
CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_to_user ON direct_messages(to_user_id);

-- Trigger to delete expired messages (simulated via cron job)
-- Note: D1 doesn't support triggers, so we'll handle this in API
