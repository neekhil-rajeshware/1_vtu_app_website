'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ExternalLink, LogOut, Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { ADMIN_ITEMS, ADMIN_NAV } from '@/lib/admin/nav'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Frame around every admin page: a menu on the left, a bar on top. Kept as one
 * client component so the menu can highlight the current page and close itself
 * on navigation.
 */
export function AdminShell({
  siteName,
  logoUrl,
  email,
  children,
}: {
  siteName: string
  logoUrl?: string | null
  email: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const current = ADMIN_ITEMS.find((item) =>
    item.href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(item.href),
  )

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out.')
    router.replace('/admin/login')
    router.refresh()
  }

  const nav = (
    <nav className="space-y-6">
      {ADMIN_NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-soft text-primary dark:bg-primary/15 dark:text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <item.icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2.5">
            <BrandLogo name={siteName} logoUrl={logoUrl} size={28} />
            <span className="text-sm font-bold">
              {siteName}
              <span className="ml-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
                Admin
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              View site
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[100rem] gap-6 px-4 py-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20">
            {nav}
            <p className="mt-6 truncate px-3 text-xs text-muted-foreground">
              Signed in as {email}
            </p>
          </div>
        </aside>

        {menuOpen ? (
          <div className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-y-auto border-t border-border bg-background p-4 lg:hidden">
            {nav}
            <p className="mt-6 truncate px-3 text-xs text-muted-foreground">
              Signed in as {email}
            </p>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          {current ? (
            <div className="mb-5">
              <h1 className="text-xl font-bold tracking-tight">{current.label}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{current.hint}</p>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  )
}
