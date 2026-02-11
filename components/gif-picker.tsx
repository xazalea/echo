'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'

interface GIF {
  id: string
  title: string
  url: string
  preview: string
  width: number
  height: number
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void
}

export function GifPicker({ onSelect }: GifPickerProps) {
  const [search, setSearch] = useState('')
  const [gifs, setGifs] = useState<GIF[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Load trending GIFs on mount
  useEffect(() => {
    loadTrendingGifs()
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (search.length === 0) {
      loadTrendingGifs()
      return
    }

    if (search.length < 2) {
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchGifs(search)
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [search])

  const loadTrendingGifs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/giphy?endpoint=trending&limit=20')
      const data = await response.json() as { success: boolean; gifs?: any[] }

      if (data.success && data.gifs) {
        setGifs(data.gifs)
      }
    } catch (error) {
      console.error('[v0] Error loading trending GIFs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchGifs = async (query: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/giphy?q=${encodeURIComponent(query)}&limit=20`)
      const data = await response.json() as { success: boolean; gifs?: any[] }

      if (data.success && data.gifs) {
        setGifs(data.gifs)
      }
    } catch (error) {
      console.error('[v0] Error searching GIFs:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-h-[400px] overflow-y-auto">
        {gifs.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 p-3">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.url)}
                className="group relative aspect-square overflow-hidden rounded border border-border transition-all hover:border-foreground"
              >
                <img
                  src={gif.preview || '/placeholder.svg'}
                  alt={gif.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-background/0 transition-colors group-hover:bg-background/10" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            {isLoading ? 'Loading GIFs...' : 'No GIFs found'}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2 text-center text-xs text-muted-foreground">
        {'Powered by Giphy'}
      </div>
    </div>
  )
}
