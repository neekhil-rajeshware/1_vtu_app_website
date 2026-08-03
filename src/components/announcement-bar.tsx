'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import type { AnnouncementSettings } from '@/lib/settings'

const TONES = {
  brand: 'bg-primary text-primary-foreground',
  warning: 'bg-secondary text-secondary-foreground',
  neutral: 'bg-muted text-foreground',
} as const

/**
 * Thin strip above the header, edited from Admin -> Announcement Bar.
 * Dismissing it is remembered per message, so changing the text shows it again.
 */
export function AnnouncementBar({ settings }: { settings: AnnouncementSettings }) {
  const [hidden, setHidden] = useState(true)
  const storageKey = `onevtu-announcement:${settings.text}`

  useEffect(() => {
    if (!settings.enabled || !settings.text) return
    try {
      setHidden(window.localStorage.getItem(storageKey) === 'dismissed')
    } catch {
      setHidden(false)
    }
  }, [settings.enabled, settings.text, storageKey])

  if (!settings.enabled || !settings.text || hidden) return null

  const dismiss = () => {
    setHidden(true)
    try {
      window.localStorage.setItem(storageKey, 'dismissed')
    } catch {
      /* private browsing — just hide for this visit */
    }
  }

  const tone = TONES[settings.tone] ?? TONES.brand

  return (
    <div className={tone}>
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <Megaphone className="hidden h-4 w-4 shrink-0 opacity-90 sm:block" />
        <p className="min-w-0 flex-1 text-pretty font-medium">
          {settings.text}
          {settings.link_url && settings.link_label ? (
            <>
              {' '}
              <Link
                href={settings.link_url}
                className="font-semibold underline underline-offset-2"
              >
                {settings.link_label}
              </Link>
            </>
          ) : null}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 opacity-80 transition-opacity hover:opacity-100"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
