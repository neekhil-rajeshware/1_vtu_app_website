'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Screenshot } from '@/lib/content'

/**
 * Filterable screenshot grid with a simple lightbox. Arrow keys move between
 * images and Escape closes, so it works without a mouse.
 */
export function ScreenshotGallery({ screenshots }: { screenshots: Screenshot[] }) {
  const [category, setCategory] = useState('All')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const categories = useMemo(() => {
    const unique = Array.from(new Set(screenshots.map((s) => s.category)))
    return ['All', ...unique]
  }, [screenshots])

  const visible = useMemo(
    () =>
      category === 'All'
        ? screenshots
        : screenshots.filter((s) => s.category === category),
    [category, screenshots],
  )

  useEffect(() => {
    if (openIndex === null) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenIndex(null)
      if (event.key === 'ArrowRight')
        setOpenIndex((i) => (i === null ? i : (i + 1) % visible.length))
      if (event.key === 'ArrowLeft')
        setOpenIndex((i) =>
          i === null ? i : (i - 1 + visible.length) % visible.length,
        )
    }

    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [openIndex, visible.length])

  const active = openIndex === null ? null : visible[openIndex]

  return (
    <div>
      {categories.length > 2 ? (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setCategory(name)
                setOpenIndex(null)
              }}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                category === name
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={category === name}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((shot, index) => (
          <figure key={shot.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="block w-full overflow-hidden rounded-[1.4rem] border border-border bg-card p-1.5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
              aria-label={`Open ${shot.title} full size`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.image_url}
                alt={shot.title}
                loading="lazy"
                className="aspect-[9/19.5] w-full rounded-[1.1rem] object-cover"
              />
            </button>
            <figcaption className="mt-2.5 px-1">
              <p className="text-sm font-semibold">{shot.title}</p>
              {shot.caption ? (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {shot.caption}
                </p>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {visible.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setOpenIndex((i) =>
                    i === null ? i : (i - 1 + visible.length) % visible.length,
                  )
                }}
                className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                aria-label="Previous screenshot"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setOpenIndex((i) => (i === null ? i : (i + 1) % visible.length))
                }}
                className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                aria-label="Next screenshot"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <figure onClick={(event) => event.stopPropagation()} className="max-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.image_url}
              alt={active.title}
              className="mx-auto max-h-[78vh] rounded-2xl object-contain shadow-2xl"
            />
            <figcaption className="mt-3 text-center text-sm text-white/85">
              <span className="font-semibold text-white">{active.title}</span>
              {active.caption ? <span> — {active.caption}</span> : null}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  )
}
