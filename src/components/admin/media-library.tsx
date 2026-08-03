'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { AdminCard } from '@/components/admin/fields'
import { Button, EmptyState } from '@/components/ui'
import { deleteMedia, listMedia, uploadMedia, type MediaItem } from '@/lib/admin/media'

function prettySize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Everything the owner has ever uploaded, newest first. Two jobs: upload images
 * without going through a form that needs one, and copy a public link to paste
 * somewhere else. Deleting removes the file for good — anywhere it is already
 * used will show a broken image, which the copy below says out loud.
 */
export function MediaLibrary() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const load = useCallback(async () => {
    setItems(await listMedia())
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    let added = 0
    for (const file of Array.from(files)) {
      const result = await uploadMedia(file)
      if (result.ok) added += 1
      else toast.error(`${file.name}: ${result.message}`)
    }
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ''

    if (added > 0) {
      toast.success(added === 1 ? 'Image uploaded.' : `${added} images uploaded.`)
      await load()
    }
  }

  async function copy(item: MediaItem) {
    try {
      await navigator.clipboard.writeText(item.url)
      setCopied(item.id)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      toast.error('Could not copy. Long-press the link to copy it by hand.')
    }
  }

  async function remove(item: MediaItem) {
    if (
      !window.confirm(
        `Delete ${item.filename}? If this image is used anywhere on the site, that spot will go blank.`,
      )
    )
      return

    setBusy(item.id)
    const message = await deleteMedia(item)
    setBusy(null)

    if (message) {
      toast.error(message)
      return
    }
    toast.success('Deleted.')
    await load()
  }

  return (
    <div className="space-y-4">
      <AdminCard title="Your images">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every image you upload anywhere in this dashboard ends up here. PNG,
          JPG, WebP, GIF, SVG or AVIF, up to 10 MB each. Deleting is permanent,
          so check an image is not in use first.
        </p>
        <div className="mt-3">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
          <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? 'Uploading…' : 'Upload images'}
          </Button>
        </div>
      </AdminCard>

      {items === null ? (
        <div className="grid place-items-center rounded-2xl border border-border bg-card py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing uploaded yet"
          description="Use the button above, or upload straight from any image box in the dashboard."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="grid aspect-square place-items-center bg-muted/50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.filename}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-semibold" title={item.filename}>
                  {item.filename}
                </p>
                <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                  {prettySize(item.size_bytes)}
                  {item.size_bytes ? ' · ' : ''}
                  {new Date(item.created_at).toLocaleDateString('en-GB', {
                    dateStyle: 'medium',
                  })}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copy(item)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied === item.id ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied === item.id ? 'Copied' : 'Copy link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    disabled={busy === item.id}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-secondary"
                    aria-label={`Delete ${item.filename}`}
                  >
                    {busy === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
