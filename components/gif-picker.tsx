'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface GifPickerProps {
  onSelect: (gifUrl: string) => void
}

export function GifPicker({ onSelect }: GifPickerProps) {
  const [search, setSearch] = useState('')

  // Mock GIF data - in production, integrate with Giphy/Tenor API
  const mockGifs = [
    'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
    'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',
    'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif',
    'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
  ]

  return (
    <div className="border-border bg-card">
      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="h-9 border-border bg-background pl-9 text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {mockGifs.map((gifUrl, index) => (
          <button
            key={index}
            onClick={() => onSelect(gifUrl)}
            className="group relative aspect-square overflow-hidden rounded border border-border transition-all hover:border-foreground"
          >
            <img
              src={gifUrl || "/placeholder.svg"}
              alt={`GIF ${index + 1}`}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-background/0 transition-colors group-hover:bg-background/10" />
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2 text-center text-xs text-muted-foreground">
        {'Powered by Giphy'}
      </div>
    </div>
  )
}
