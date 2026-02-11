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
    <div className="border-border/50 bg-card rounded-lg overflow-hidden">
      {/* Search */}
      <div className="border-b border-border/50 p-3 bg-card/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="h-9 rounded-lg border-border/50 bg-background/50 pl-9 text-sm focus-visible:border-foreground/50"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-h-[400px] overflow-y-auto bg-background/30">
        {gifs.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 p-3">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.url)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border/50 transition-all hover:border-foreground/50 hover:shadow-md"
              >
                <img
                  src={gif.preview || '/placeholder.svg'}
                  alt={gif.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-background/0 transition-colors group-hover:bg-background/5" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-center space-y-2">
              <Search className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Loading GIFs...' : 'No GIFs found'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 p-2 text-center text-[10px] text-muted-foreground/70 bg-card/50">
        {'Powered by Giphy'}
      </div>
    </div>
  )
}
