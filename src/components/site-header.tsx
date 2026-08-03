'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Download, Menu, X } from 'lucide-react'
import { BrandLockup } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { buttonClass } from '@/components/ui'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/screenshots', label: 'Screenshots' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader({
  siteName,
  tagline,
  logoUrl,
  playStoreUrl,
}: {
  siteName: string
  tagline: string
  logoUrl?: string | null
  playStoreUrl?: string | null
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the mobile menu whenever the page changes.
  useEffect(() => setOpen(false), [pathname])

  // Stop the page scrolling behind the open mobile menu.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLockup name={siteName} tagline={tagline} logoUrl={logoUrl} />

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <ThemeToggle />
          <Link
            href="/download"
            className={buttonClass('primary', 'sm', 'hidden sm:inline-flex')}
          >
            <Download className="h-4 w-4" />
            Get the app
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-border bg-background md:hidden"
        >
          <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile">
            <Link
              href="/"
              className={cn(
                'rounded-xl px-3 py-3 text-sm font-medium',
                pathname === '/'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              Home
            </Link>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-xl px-3 py-3 text-sm font-medium',
                  isActive(link.href)
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/download"
              className={buttonClass('primary', 'md', 'mt-2 w-full')}
            >
              <Download className="h-4 w-4" />
              Get the app
            </Link>
            {playStoreUrl ? (
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 pt-2 text-center text-xs text-muted-foreground"
              >
                Open Google Play directly
              </a>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
