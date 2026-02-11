'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RoomTab } from '@/components/room-tabs'

export function useRoomManager() {
  const [rooms, setRooms] = useState<RoomTab[]>([])
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null)

  // Load rooms from localStorage on mount
  useEffect(() => {
    const storedRooms = localStorage.getItem('echo_rooms')
    if (storedRooms) {
      try {
        const parsed = JSON.parse(storedRooms)
        setRooms(parsed)
        
        // Set first room as active if none is active
        if (parsed.length > 0 && !parsed.some((r: RoomTab) => r.isActive)) {
          setActiveRoomCode(parsed[0].code)
        } else {
          const active = parsed.find((r: RoomTab) => r.isActive)
          if (active) {
            setActiveRoomCode(active.code)
          }
        }
      } catch (error) {
        console.error('[echo] Error loading rooms:', error)
      }
    }
  }, [])

  // Save rooms to localStorage whenever they change
  useEffect(() => {
    if (rooms.length > 0) {
      localStorage.setItem('echo_rooms', JSON.stringify(rooms))
    } else {
      localStorage.removeItem('echo_rooms')
    }
  }, [rooms])

  const addRoom = useCallback((code: string) => {
    setRooms((prev) => {
      // Check if room already exists
      if (prev.some((r) => r.code === code)) {
        // Just make it active
        return prev.map((r) => ({
          ...r,
          isActive: r.code === code,
        }))
      }

      // Add new room and make it active
      return [
        ...prev.map((r) => ({ ...r, isActive: false })),
        { code, unreadCount: 0, isActive: true },
      ]
    })
    setActiveRoomCode(code)
  }, [])

  const removeRoom = useCallback((code: string) => {
    setRooms((prev) => {
      const filtered = prev.filter((r) => r.code !== code)
      
      // If we removed the active room, activate the first remaining room
      if (activeRoomCode === code && filtered.length > 0) {
        setActiveRoomCode(filtered[0].code)
        return filtered.map((r, i) => ({
          ...r,
          isActive: i === 0,
        }))
      }
      
      return filtered
    })
    
    if (activeRoomCode === code) {
      setActiveRoomCode(null)
    }
  }, [activeRoomCode])

  const selectRoom = useCallback((code: string) => {
    setRooms((prev) =>
      prev.map((r) => ({
        ...r,
        isActive: r.code === code,
        unreadCount: r.code === code ? 0 : r.unreadCount, // Clear unread count when selected
      }))
    )
    setActiveRoomCode(code)
  }, [])

  const incrementUnreadCount = useCallback((code: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.code === code && !r.isActive
          ? { ...r, unreadCount: r.unreadCount + 1 }
          : r
      )
    )
  }, [])

  const clearUnreadCount = useCallback((code: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.code === code ? { ...r, unreadCount: 0 } : r))
    )
  }, [])

  return {
    rooms,
    activeRoomCode,
    addRoom,
    removeRoom,
    selectRoom,
    incrementUnreadCount,
    clearUnreadCount,
  }
}
