'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, KeyRound, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLockup } from '@/components/brand-logo'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

const ERRORS: Record<string, { title: string; body: string }> = {
  'not-admin': {
    title: 'This account is not an admin',
    body: 'You are signed in, but this email is not on the admin list. Sign out and use your admin account.',
  },
  'link-invalid': {
    title: 'That link did not work',
    body: 'The reset link was incomplete. Ask for a new one below.',
  },
  'link-expired': {
    title: 'That link has expired',
    body: 'Reset links only last a short while. Ask for a new one below.',
  },
}

/**
 * The only sign-in surface on the whole site. There is no sign-up link and no
 * visitor account: admins are created by hand in Supabase and listed in
 * `web_admins`. Anyone who signs in without being on that list is told so and
 * signed straight back out.
 */
export function LoginForm({
  siteName,
  logoUrl,
}: {
  siteName: string
  logoUrl?: string | null
}) {
  const router = useRouter()
  const params = useSearchParams()
  const errorCode = params.get('error') || ''
  const banner = ERRORS[errorCode]
  const next = params.get('next') || '/admin'

  const [mode, setMode] = useState<'password' | 'forgot'>('password')
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setBusy(false)
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'That email and password do not match.'
          : error.message,
      )
      return
    }

    // A full refresh so the server-side admin gate runs with the new cookie.
    router.replace(next.startsWith('/admin') ? next : '/admin')
    router.refresh()
  }

  async function handleForgot(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent('/admin/account?recovery=1')}`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })
    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Check your inbox for the reset link.')
    setMode('password')
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center">
        <BrandLockup name={siteName} logoUrl={logoUrl} />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {banner ? (
          <div className="mb-5 rounded-xl border border-secondary/30 bg-secondary/5 p-4">
            <p className="text-sm font-semibold">{banner.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {banner.body}
            </p>
            {errorCode === 'not-admin' ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            ) : null}
          </div>
        ) : null}

        {mode === 'password' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <h1 className="text-lg font-bold">Admin sign in</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage the website content from here.
              </p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            <Button type="submit" size="md" disabled={busy} className="w-full">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>

            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="block w-full text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary dark:hover:text-accent-foreground"
            >
              Forgot your password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <h1 className="text-lg font-bold">Reset your password</h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                We will email you a link. Open it and you can set a new password.
              </p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="username"
              />
            </label>

            <Button type="submit" size="md" disabled={busy} className="w-full">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {busy ? 'Sending…' : 'Send reset link'}
            </Button>

            <button
              type="button"
              onClick={() => setMode('password')}
              className="block w-full text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary dark:hover:text-accent-foreground"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>

      <Link
        href="/"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary dark:hover:text-accent-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to the website
      </Link>
    </div>
  )
}
