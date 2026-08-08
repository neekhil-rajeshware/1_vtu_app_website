'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { Factor } from '@supabase/supabase-js'
import { Check, Copy, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

/**
 * Two-step verification, shared by the sign-in page and the account page.
 *
 * The second factor is an authenticator app (TOTP): the dashboard shows a QR
 * code once, the app turns the secret behind it into a fresh six-digit code
 * every thirty seconds, and Supabase checks that code. Nothing is emailed and
 * nothing is texted, so there is no message to intercept and no phone number to
 * lose.
 *
 * Supabase calls the result an "assurance level". A password alone is `aal1`;
 * a password plus a code from the app is `aal2`. That level is stamped into the
 * login token, which is what lets the database itself — not just this code —
 * insist on the second step. See `is_web_admin()`.
 */

const CODE_LENGTH = 6

/** What Supabase knows about this session's second factor, right now. */
export type MfaState = {
  /** `aal2` once the code has been entered for this session. */
  currentLevel: string | null
  /** Authenticator apps that finished setup. Unverified leftovers are ignored. */
  verified: Factor[]
}

export async function readMfaState(): Promise<MfaState> {
  const supabase = createClient()
  const [levels, factors] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ])

  return {
    currentLevel: levels.data?.currentLevel ?? null,
    verified: factors.data?.totp ?? [],
  }
}

/**
 * Supabase's wording is aimed at developers. These are the only three failures
 * an admin can actually cause, so they get a plain sentence instead.
 */
function friendlyError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('invalid totp') || lower.includes('invalid code')) {
    return 'That code was not right. Codes change every 30 seconds — try the one showing now.'
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many tries. Wait a minute and enter a fresh code.'
  }
  return message
}

/**
 * The six-digit box. One wide input rather than six little ones, so a code
 * pasted from a password manager lands in one piece.
 */
export function CodeField({
  value,
  onChange,
  label = 'Six-digit code',
  autoFocus = false,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  autoFocus?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required
        autoFocus={autoFocus}
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))
        }
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.4em] outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
      />
    </div>
  )
}

/** The secret in text form, for when the QR code cannot be scanned. */
function SecretRow({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Cannot scan it? Type this into the app instead:
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-2.5 py-1.5 font-mono text-xs">
          {secret}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(secret)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}

/**
 * Setting up a new authenticator app: show the QR code, then make the admin
 * prove the app is working before the factor counts. Verifying here also
 * promotes the current session to `aal2`, so there is no second code to enter
 * straight afterwards.
 */
export function EnrollAuthenticator({
  issuer,
  onEnrolled,
  onCancel,
  confirmLabel = 'Turn on two-step verification',
}: {
  issuer: string
  onEnrolled: () => void | Promise<void>
  onCancel?: () => void
  confirmLabel?: string
}) {
  const [qr, setQr] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [preparing, setPreparing] = useState(true)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState('')
  const started = useRef(false)

  useEffect(() => {
    // Strict Mode runs effects twice in development, and two enrolments would
    // race for the same friendly name. Only the first one is real.
    if (started.current) return
    started.current = true

    void (async () => {
      const supabase = createClient()

      // Abandoning setup halfway leaves an unverified factor behind, and
      // Supabase refuses a second one with the same name. Clear those first.
      const { data: existing } = await supabase.auth.mfa.listFactors()
      const stale = (existing?.all ?? []).filter((f) => f.status === 'unverified')
      await Promise.all(
        stale.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })),
      )

      const taken = new Set(
        (existing?.all ?? [])
          .filter((f) => f.status === 'verified')
          .map((f) => f.friendly_name),
      )
      let friendlyName = 'Authenticator'
      for (let n = 2; taken.has(friendlyName); n += 1) {
        friendlyName = `Authenticator ${n}`
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName,
        // What the authenticator app lists the entry under.
        issuer,
      })

      setPreparing(false)
      if (error) {
        setFailed(friendlyError(error.message))
        return
      }

      setFactorId(data.id)
      setQr(data.totp.qr_code)
      setSecret(data.totp.secret)
    })()
  }, [issuer])

  async function confirm(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)

    const supabase = createClient()
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    })
    setBusy(false)

    if (error) {
      setCode('')
      toast.error(friendlyError(error.message))
      return
    }

    await onEnrolled()
  }

  if (preparing) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparing your QR code…
      </div>
    )
  }

  if (failed) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{failed}</p>
        {onCancel ? (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Back
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={confirm} className="space-y-4">
      <ol className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
        <li>
          <span className="font-semibold text-foreground">1.</span> Install an
          authenticator app on your phone — Google Authenticator, Microsoft
          Authenticator and Authy all work.
        </li>
        <li>
          <span className="font-semibold text-foreground">2.</span> Open it, add
          an account, and scan this code.
        </li>
        <li>
          <span className="font-semibold text-foreground">3.</span> Type the
          six digits it shows below.
        </li>
      </ol>

      <div className="flex justify-center rounded-2xl border border-border bg-white p-3">
        {/* A data: URL from Supabase — next/image would only add a round trip. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt="QR code for your authenticator app"
          className="h-44 w-44"
        />
      </div>

      <SecretRow secret={secret} />

      <CodeField value={code} onChange={setCode} autoFocus />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy || code.length < CODE_LENGTH}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {busy ? 'Checking…' : confirmLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}

/**
 * The sign-in challenge: the password is already accepted, this is the code
 * that turns the session into a full one.
 */
export function VerifyAuthenticator({
  factorId,
  onVerified,
  onCancel,
}: {
  factorId: string
  onVerified: () => void | Promise<void>
  onCancel?: () => void
}) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)

    const supabase = createClient()
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    })
    setBusy(false)

    if (error) {
      setCode('')
      toast.error(friendlyError(error.message))
      return
    }

    await onVerified()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Enter your code</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Open your authenticator app and type the six digits it shows for this
          site.
        </p>
      </div>

      <CodeField value={code} onChange={setCode} autoFocus />

      <Button
        type="submit"
        size="md"
        disabled={busy || code.length < CODE_LENGTH}
        className="w-full"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {busy ? 'Checking…' : 'Sign in'}
      </Button>

      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="block w-full text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary dark:hover:text-accent-foreground"
        >
          Use a different account
        </button>
      ) : null}
    </form>
  )
}
