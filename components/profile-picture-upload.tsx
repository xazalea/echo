'use client'

import { useState, useRef } from 'react'
import { Upload, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProfilePictureUploadProps {
  currentPicture?: string
  onUpload: (dataUrl: string) => void
  onClose: () => void
}

export function ProfilePictureUpload({ currentPicture, onUpload, onClose }: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPicture || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string
            setPreview(dataUrl)
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  const handleUpload = async () => {
    if (!preview) return

    setUploading(true)
    try {
      onUpload(preview)
      onClose()
    } catch (error) {
      console.error('[echo] Error uploading profile picture:', error)
      alert('Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border/30 bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Profile Picture</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div
          className="mb-4 flex items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-muted/20 p-8"
          onPaste={handlePaste}
          tabIndex={0}
        >
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="h-32 w-32 rounded-full object-cover border-2 border-border/30"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <User className="h-16 w-16" />
              <p className="text-sm">No picture selected</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <p className="mb-4 text-xs text-muted-foreground text-center">
          Click to upload or paste an image (max 2MB)
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!preview || uploading}
            className="flex-1"
          >
            {uploading ? 'Uploading...' : 'Save'}
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
