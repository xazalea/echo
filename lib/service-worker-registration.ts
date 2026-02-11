/**
 * Service Worker Registration for Background Notifications
 * 
 * This handles registration of the service worker that enables
 * background notifications even when the tab is closed.
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[echo] Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    })

    console.log('[echo] Service worker registered:', registration)

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[echo] New service worker available')
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('[echo] Service worker registration failed:', error)
    return null
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[echo] Notifications not supported')
    return false
  }

  // Check if already granted - permission persists automatically
  if (Notification.permission === 'granted') {
    return true
  }

  // Don't ask if user already denied
  if (Notification.permission === 'denied') {
    return false
  }

  // Only ask once per session to avoid annoying the user
  const hasAskedThisSession = sessionStorage.getItem('echo_notification_asked')
  if (hasAskedThisSession) {
    return false
  }

  // Request permission (browser will remember this choice)
  sessionStorage.setItem('echo_notification_asked', 'true')
  const permission = await Notification.requestPermission()
  
  return permission === 'granted'
}

export async function sendNotificationToServiceWorker(
  title: string,
  body: string,
  data?: { url?: string; roomCode?: string; messageId?: string }
): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const registration = await navigator.serviceWorker.ready

  if (registration.active) {
    registration.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      icon: '/icon-192.png',
      data: data || {},
    })
  }
}
