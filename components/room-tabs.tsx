'use client'

import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface RoomTab {
  code: string
  unreadCount: number
  isActive: boolean
}

interface RoomTabsProps {
  rooms: RoomTab[]
  onSelectRoom: (code: string) => void
  onCloseRoom: (code: string) => void
  onNewRoom: () => void
}

export function RoomTabs({ rooms, onSelectRoom, onCloseRoom, onNewRoom }: RoomTabsProps) {
  if (rooms.length === 0) return null

  return (
    <div className="border-b border-border/30 bg-card/50 backdrop-blur-md px-4 py-2">
      <div className="flex items-center gap-2 overflow-x-auto">
        {rooms.map((room) => (
          <div
            key={room.code}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              room.isActive
                ? 'bg-muted/60 text-foreground'
                : 'bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
            onClick={() => onSelectRoom(room.code)}
          >
            <span className="font-medium">{room.code}</span>
            {room.unreadCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
                {room.unreadCount > 9 ? '9+' : room.unreadCount}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseRoom(room.code)
              }}
              className="ml-1 h-4 w-4 rounded flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button
          onClick={onNewRoom}
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Room
        </Button>
      </div>
    </div>
  )
}
