'use client'

import { useEffect } from 'react'
import { registerServiceWorker, requestNotificationPermission } from '@/lib/service-worker-registration'

export function ServiceWorkerInit() {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker()
    
    // Request notification permission
    requestNotificationPermission()
  }, [])

  return null
}
