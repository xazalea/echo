// Service Worker for echo. - Background Notifications
const CACHE_NAME = 'echo-v1'
const NOTIFICATION_TAG = 'echo-notification'

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/icon-192.png',
        '/icon-512.png',
      ])
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  return self.clients.claim()
})

// Push event - handle background notifications
self.addEventListener('push', (event) => {
  let data = {}
  
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (e) {
    console.error('Error parsing push data:', e)
    data = {
      title: 'echo.',
      body: 'You have a new message',
      icon: '/icon-192.png',
    }
  }

  const options = {
    body: data.body || 'You have a new message',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || NOTIFICATION_TAG,
    data: {
      url: data.url || '/',
      roomCode: data.roomCode,
      messageId: data.messageId,
    },
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'echo.', options)
  )
})

// Notification click event - open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, data: notificationData } = event.data
    self.registration.showNotification(title || 'echo.', {
      body,
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: NOTIFICATION_TAG,
      data: notificationData || {},
    })
  }
})

// Background sync for offline support (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      Promise.resolve()
    )
  }
})
