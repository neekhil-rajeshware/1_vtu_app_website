'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { FieldShell, adminInputClass } from '@/components/admin/fields'
import { Button } from '@/components/ui'
import { listMedia, uploadMedia, type MediaItem } from '@/lib/admin/media'

/**
 * One image field: upload a new file, pick something already uploaded, or
 * paste a link. Stores a plain URL string, which is all the public site needs.
 */
export function ImageInput({
  label,
  help,
  value,
  onChange,
}: {
  label: string
  help?: string
  value: string
  onChange: (value: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [picking, setPicking] = useState(false)

  async function handleFile(file?: File | null) {
    if (!file) return
    setBusy(true)
    const result = await uploadMedia(file)
    setBusy(false)

    if (!result.ok) {
      toast.error(result.message)
      return
    }
    onChange(result.item.url)
    toast.success('Image uploaded.')
  }

  return (
    <FieldShell label={label} help={help}>
      <div className="rounded-xl border border-border bg-background p-3">
        {value ? (
          <div className="mb-3 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-20 w-20 shrink-0 rounded-lg border border-border bg-muted object-cover"
            />
            <p className="min-w-0 flex-1 break-all text-xs text-muted-foreground">
              {value}
            </p>
            <button
              type="button"
              onClick={() => onChange('')}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-secondary"
              aria-label="Remove image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {busy ? 'Uploading…' : 'Upload'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPicking(true)}
          >
            <ImagePlus className="h-4 w-4" />
            Choose existing
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${adminInputClass} mt-3`}
          placeholder="…or paste an image link"
        />
      </div>

      {picking ? (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(item) => {
            onChange(item.url)
            setPicking(false)
          }}
        />
      ) : null}
    </FieldShell>
  )
}

/** Grid of everything already uploaded, so the same image is never uploaded twice. */
export function MediaPicker({
  onPick,
  onClose,
}: {
  onPick: (item: MediaItem) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null)

  useEffect(() => {
    listMedia().then(setItems)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose an image"
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-bold">Your images</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-40 flex-1 overflow-y-auto p-5">
          {items === null ? (
            <div className="grid place-items-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nothing uploaded yet. Close this and use Upload.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item)}
                  className="group overflow-hidden rounded-xl border border-border text-left transition-colors hover:border-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full bg-muted object-cover"
                  />
                  <span className="block truncate px-2 py-1.5 text-[0.7rem] text-muted-foreground">
                    {item.filename}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

