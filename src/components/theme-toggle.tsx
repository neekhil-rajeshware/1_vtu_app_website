'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

/**
 * Light / dark switch. Renders a static placeholder until mounted so the
 * server and client markup match (avoids a hydration warning).
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'
  const base =
    'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

  if (!mounted) {
    return (
      <span
        className={`${base} ${className}`}
        aria-hidden="true"
        suppressHydrationWarning
      >
        <Sun className="h-[1.15rem] w-[1.15rem]" />
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`${base} ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Moon className="h-[1.15rem] w-[1.15rem]" />
      ) : (
        <Sun className="h-[1.15rem] w-[1.15rem]" />
      )}
    </button>
  )
}
