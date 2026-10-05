'use client'

import { useEffect, useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

/**
 * Where a student's password-reset link finally lands, once `/auth/confirm` has
 * exchanged the one-time token for a session. All this has to do is set the new
 * password — there is no email field and no token here, so it can never create
 * an account or touch anyone else's.
 */
export function ResetPasswordForm() {
  const [checking, setChecking] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(Boolean(data.session)))
      .catch(() => setSignedIn(false))
      .finally(() => setChecking(false))
  }, [])

  async function save(event: React.FormEvent) {
    event.preventDefault()

    if (password.length < 10) {
      setError('Use at least 10 characters. Longer is better than complicated.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setBusy(true)
    setError('')

    const { error: updateError } = await createClient().auth.updateUser({
      password,
    })

    setBusy(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking your reset link…
      </div>
    )
  }

  if (!signedIn) {
    return (
      <div className="space-y-3">
        <p className="font-semibold">This link has expired, or it was already used.</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Open the app, tap &ldquo;Forgot password?&rdquo; on the sign-in screen,
          and we will email you a fresh link. Reset links only work once.
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-3">
        <p className="font-semibold">Your password has been changed.</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Open the app and sign in with your new password.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Choose a new password for your account.
      </p>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">New password</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Confirm password</span>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" size="md" disabled={busy} className="w-full">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        {busy ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  )
}
