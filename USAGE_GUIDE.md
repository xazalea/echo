# echo. Usage Guide

## Quick Start

### For Users

#### Creating a Room
1. Visit the echo. homepage
2. Click "Create Room"
3. Enter your desired username
4. Click "Create Room"
5. Share the generated 6-character room code with others

#### Joining a Room
1. Visit the echo. homepage
2. Click "Join Room"
3. Enter the 6-character room code
4. Enter your desired username
5. Click "Join Room"

### Using the Chat

#### Sending Messages
- Type your message in the input box at the bottom
- Press Enter to send (Shift + Enter for new line)
- Your messages appear on the right side

#### Rich Media
- **Images**: Click the image icon to upload
- **GIFs**: Click the smile icon to browse GIFs
- **Stickers**: Click the sticker icon (coming soon)

#### Clipping Messages
1. Hover over any message from another user
2. Click the "Clip" button
3. Message is saved to your Clips library
4. Access clips via the Bookmark icon in the header

#### Direct Messages
1. Hover over any username in a message
2. A hover card will appear
3. Click "Send Direct Message"
4. Type your private message
5. Message is sent privately to that user only

#### Editing Messages
1. Hover over your own message
2. Click "Edit"
3. Modify the text
4. Press Enter to save or Escape to cancel
5. Edited messages show an "(edited)" label

#### Notifications
- Enable notifications when prompted
- Receive alerts for new messages even when tab is closed
- Works on all devices including ChromeOS

### Room Features

#### Active Users
- Click the Users icon in the header to see who's in the room
- Green dot indicates online status
- "typing..." indicator shows when users are composing

#### Room Timer
- All rooms expire after 1 hour
- Timer visible at the top of the chat
- Messages automatically deleted when room expires

#### Clips Library
- Click the Bookmark icon in the header
- View all your saved messages
- Copy clips to clipboard
- Remove clips you no longer need
- Clips persist even after room expires

## Privacy & Security

### Anonymous by Design
- No sign-up or login required
- No persistent user accounts
- No tracking or analytics on users
- Session-based anonymous IDs

### Data Lifecycle
- Messages stored in memory only
- All data deleted after 1 hour
- Clips stored locally in your browser only
- No server-side message persistence

### What We Don't Collect
- Email addresses
- Phone numbers
- IP addresses (beyond temporary session)
- Location data
- Device fingerprints

### What You Should Know
- Room codes are not secret-proof - anyone with the code can join
- Messages are transmitted in real-time but not end-to-end encrypted (yet)
- Clips are stored in your browser's localStorage
- Clearing browser data will delete your clips

## Tips & Tricks

### Creating Good Room Codes
When creating custom room codes (feature coming):
- Use memorable combinations
- Mix letters and numbers
- Avoid sensitive information
- Share codes securely (not publicly)

### Managing Notifications
- Grant permission for best experience
- Notifications work even with tab closed
- Mute specific rooms (feature coming)
- Customize notification sounds (feature coming)

### Clipping Strategy
- Clip important information immediately
- Organize clips with tags (feature coming)
- Export clips before browser cache clear
- Use clips for meeting notes or key decisions

### Efficient Messaging
- Use Shift + Enter for multiline messages
- Edit typos instead of sending corrections
- Use GIFs to express emotions quickly
- Hover usernames for quick DMs

## Keyboard Shortcuts

### Chat
- `Enter` - Send message
- `Shift + Enter` - New line
- `Escape` - Cancel edit
- `Ctrl/Cmd + V` - Paste image

### Navigation
- `Ctrl/Cmd + K` - Focus message input (coming soon)
- `Escape` - Close overlays

## Troubleshooting

### "Can't connect to room"
- Check your internet connection
- Verify the room code is correct (6 characters)
- Try refreshing the page
- Room may have expired (after 1 hour)

### "Messages not sending"
- Check connection indicator
- Refresh the page
- Try leaving and rejoining the room

### "Notifications not working"
- Grant notification permission when prompted
- Check browser notification settings
- Ensure ChromeOS/OS notifications are enabled
- Try re-enabling in browser settings

### "White screen on load"
- Clear browser cache
- Disable browser extensions
- Try incognito/private mode
- Update your browser

### "Images won't upload"
- Check file size (max 5MB recommended)
- Ensure file is an image format (jpg, png, gif)
- Try a different image
- Check your connection

## Best Practices

### For Group Chats
1. Set a clear username (not anonymous123)
2. Introduce yourself when joining
3. Stay on topic
4. Use DMs for side conversations
5. Clip important decisions

### For One-on-One
1. Use direct messages within the room
2. Share the room code securely
3. Keep sensitive info to a minimum
4. Remember the 1-hour expiry

### For Collaboration
1. Create a new room for each session
2. Clip action items
3. Use images to share mockups/docs
4. Export clips at end of session

### For Privacy
1. Don't share personally identifiable information
2. Use pseudonymous usernames
3. Avoid sharing room codes publicly
4. Let rooms expire naturally

## Advanced Features

### AI Assistant (IsraelGPT)
Coming soon: Ask questions and get instant help

**Example queries:**
- "Summarize this conversation"
- "What were the action items?"
- "Translate this message"
- "Explain this term"

### Planned Features
- Custom room expiry times
- Room passwords
- End-to-end encryption
- Voice messages
- File sharing (non-image)
- Message threads
- Reactions

## Support

### Getting Help
- Check this guide first
- Review the README.md
- Check GitHub Issues
- Contact support@echo.your-domain.com

### Reporting Bugs
1. Describe the issue clearly
2. Include steps to reproduce
3. Note your browser and OS
4. Share error messages if any
5. Submit via GitHub Issues

### Feature Requests
1. Check existing requests first
2. Describe the use case
3. Explain the benefit
4. Submit via GitHub Discussions

## FAQ

**Q: Are my messages encrypted?**
A: Messages are transmitted over secure WebSocket (WSS) but not end-to-end encrypted yet. E2E encryption is planned.

**Q: Can I recover deleted messages?**
A: No. Messages are permanently deleted when rooms expire. Save important messages by clipping them.

**Q: How many people can join a room?**
A: Currently no hard limit, but optimal experience with 2-20 users.

**Q: Can I create a permanent room?**
A: Not currently. All rooms expire after 1 hour by design for privacy.

**Q: Do I need to create an account?**
A: No. echo. is completely anonymous with no account required.

**Q: Can room creators remove users?**
A: Not currently. All users are equal in a room.

**Q: Can I change my username after joining?**
A: Not currently. You'd need to leave and rejoin with a new username.

**Q: Are there message limits?**
A: Soft limit of 2000 characters per message for optimal performance.

**Q: Can I access my clips from another device?**
A: No. Clips are stored locally in your browser only.

**Q: What happens to my clips when a room expires?**
A: Your clips remain saved even after the room expires, until you remove them or clear browser data.

---

Need more help? Visit our [GitHub repository](https://github.com/yourusername/echo) or contact support.
