#!/usr/bin/env node

/**
 * echo. Local Notification Server
 * 
 * Lightweight Node.js server that runs locally to deliver notifications
 * when the chat tab is closed. This enables cross-device notification delivery.
 * 
 * Usage:
 *   node notification-server/server.js
 * 
 * Or install globally:
 *   npm install -g
 *   echo-notify
 */

const http = require('http');
const https = require('https');

const PORT = process.env.ECHO_NOTIFY_PORT || 3001;
const POLL_INTERVAL = 3000; // 3 seconds

class NotificationServer {
  constructor() {
    this.subscriptions = new Map(); // roomCode -> { userId, username, lastCheck }
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://localhost:${PORT}`);

      if (url.pathname === '/subscribe' && req.method === 'POST') {
        this.handleSubscribe(req, res);
      } else if (url.pathname === '/unsubscribe' && req.method === 'POST') {
        this.handleUnsubscribe(req, res);
      } else if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', subscriptions: this.subscriptions.size }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    this.server.listen(PORT, () => {
      console.log(`🔔 echo. notification server running on http://localhost:${PORT}`);
      console.log(`📱 Subscriptions: ${this.subscriptions.size}`);
    });

    // Start polling loop
    this.startPolling();
  }

  async handleSubscribe(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomCode, userId, username, apiUrl } = JSON.parse(body);
        
        if (!roomCode || !userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields' }));
          return;
        }

        const key = `${roomCode}:${userId}`;
        this.subscriptions.set(key, {
          roomCode,
          userId,
          username: username || 'Anonymous',
          apiUrl: apiUrl || 'http://localhost:3000',
          lastCheck: Date.now(),
          lastMessageId: null,
        });

        console.log(`✅ Subscribed: ${username} to room ${roomCode}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }

  handleUnsubscribe(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomCode, userId } = JSON.parse(body);
        const key = `${roomCode}:${userId}`;
        
        if (this.subscriptions.has(key)) {
          this.subscriptions.delete(key);
          console.log(`❌ Unsubscribed: ${userId} from room ${roomCode}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }

  startPolling() {
    setInterval(async () => {
      for (const [key, sub] of this.subscriptions.entries()) {
        try {
          const params = new URLSearchParams({
            roomCode: sub.roomCode,
            userId: sub.userId,
          });

          if (sub.lastMessageId) {
            params.append('lastMessageId', sub.lastMessageId);
          }

          const url = `${sub.apiUrl}/api/poll?${params}`;
          const response = await this.fetch(url);
          const data = JSON.parse(response);

          if (data.success && data.messages.length > 0) {
            // New messages received
            for (const message of data.messages) {
              if (message.user_id !== sub.userId) {
                this.showNotification(sub, message);
              }
            }

            // Update last message ID
            sub.lastMessageId = data.messages[data.messages.length - 1].id;
          }

          sub.lastCheck = Date.now();
        } catch (error) {
          console.error(`❌ Error polling for ${key}:`, error.message);
        }
      }
    }, POLL_INTERVAL);
  }

  showNotification(sub, message) {
    const title = `${message.username} in ${sub.roomCode}`;
    const body = message.type === 'text' ? message.content : `Sent a ${message.type}`;

    console.log(`🔔 Notification: ${title}`);
    console.log(`   ${body}`);

    // Here you could integrate with native notification systems:
    // - macOS: osascript
    // - Windows: node-notifier
    // - Linux: notify-send
    // For now, we just log to console
  }

  fetch(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      protocol.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }
}

// Start server
const server = new NotificationServer();
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down notification server...');
  if (server.server) {
    server.server.close(() => {
      process.exit(0);
    });
  }
});
