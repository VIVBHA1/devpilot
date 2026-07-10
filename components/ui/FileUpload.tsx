'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, Check, X } from 'lucide-react'
import type { UploadKind } from '@/lib/storage'

interface FileUploadProps {
  kind: UploadKind
  accept?: string
  label?: string
  // Returns the storage path (private) and/or public url once uploaded.
  onUploaded: (result: { path: string; url: string | null; fileName: string; fileType: string }) => void
  compact?: boolean
}

export function FileUpload({ kind, accept, label = 'Upload file', onUploaded, compact }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('kind', kind)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Upload failed')
      }
      const data = await res.json()
      setDone(file.name)
      onUploaded({ path: data.path, url: data.url, fileName: file.name, fileType: file.type })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`flex items-center gap-2 rounded-lg border border-dashed transition-colors disabled:opacity-60 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm w-full justify-center'
        } ${done ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 text-gray-600 hover:border-[#2563EB] hover:text-[#2563EB]'}`}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Uploading…' : done ? done : label}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}
