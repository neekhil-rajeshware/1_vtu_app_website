'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Factor } from '@supabase/supabase-js'
import {
  CircleCheck,
  KeyRound,
  Loader2,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminCard, TextInput } from '@/components/admin/fields'
import { EnrollAuthenticator, readMfaState } from '@/components/admin/mfa'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

/**
 * Password and two-step verification. There is deliberately no "add another
 * admin" here: a second admin has to be created in Supabase on purpose, so the
 * dashboard can never be handed out by accident.
 */
export function AccountForm({
  email,
  siteName,
}: {
  email: string
  siteName: string
}) {
  const params = useSearchParams()
  const fromReset = params.get('recovery') === '1'

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const [factors, setFactors] = useState<Factor[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState('')

  const loadFactors = useCallback(async () => {
    const { verified } = await readMfaState()
    setFactors(verified)
  }, [])

  useEffect(() => {
    void loadFactors()
  }, [loadFactors])

  async function save() {
    if (password.length < 10) {
      toast.error('Use at least 10 characters. Longer is better than complicated.')
      return
    }
    if (password !== confirm) {
      toast.error('The two passwords do not match.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setPassword('')
    setConfirm('')
    setDone(true)
    toast.success('Password changed. Use the new one next time you sign in.')
  }

  async function removeFactor(factor: Factor) {
    const last = (factors ?? []).length <= 1
    const warning = last
      ? 'Remove your only authenticator app? You will have to set up a new one the next time you sign in.'
      : `Remove “${factor.friendly_name ?? 'this device'}”?`
    if (!window.confirm(warning)) return

    setRemoving(factor.id)
    const supabase = createClient()
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    setRemoving('')

    if (error) {
      toast.error(error.message)
      return
    }

    await loadFactors()
    toast.success('Removed.')
  }

  return (
    <div className="space-y-4">
      {fromReset ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-bold text-primary">
            You are signed in from the reset email
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Set a new password below now — that email link only works once.
          </p>
        </div>
      ) : null}

      <AdminCard
        title="Signed in as"
        description="This is the email you use to sign in. To change it, do it in Supabase — it is tied to your login."
      >
        <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm font-semibold">
          {email}
        </p>
      </AdminCard>

      <AdminCard
        title="Two-step verification"
        description="Signing in needs your password and a six-digit code from an authenticator app on your phone. A stolen password on its own is not enough to get in."
      >
        {factors === null ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-3">
            {factors.length > 0 ? (
              <ul className="space-y-2">
                {factors.map((factor) => (
                  <li
                    key={factor.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Smartphone className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {factor.friendly_name ?? 'Authenticator'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Added {formatDate(factor.created_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removing === factor.id}
                      onClick={() => removeFactor(factor)}
                      aria-label={`Remove ${factor.friendly_name ?? 'this device'}`}
                    >
                      {removing === factor.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-secondary/30 bg-secondary/5 px-3.5 py-3 text-sm leading-relaxed">
                No authenticator app is set up. You will be asked to add one the
                next time you sign in.
              </p>
            )}

            {adding ? (
              <div className="rounded-xl border border-border p-4">
                <EnrollAuthenticator
                  issuer={siteName}
                  confirmLabel="Add this device"
                  onCancel={() => setAdding(false)}
                  onEnrolled={async () => {
                    setAdding(false)
                    await loadFactors()
                    toast.success('Device added.')
                  }}
                />
              </div>
            ) : (
              <Button variant="outline" onClick={() => setAdding(true)}>
                <Smartphone className="h-4 w-4" />
                {factors.length > 0 ? 'Add a backup device' : 'Set it up now'}
              </Button>
            )}

            {factors.length === 1 && !adding ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Only one device is set up. If you lose that phone you cannot sign
                in — adding a second one, on a different phone or in a password
                manager, is the easiest insurance.
              </p>
            ) : null}
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="Change your password"
        description="Ten characters or more. A short sentence you will remember beats a jumble you have to write down."
      >
        <div className="space-y-3">
          <TextInput
            label="New password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 10 characters"
          />
          <TextInput
            label="Type it again"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Same password"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={saving || !password || !confirm}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Change password
            </Button>
            {done ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <CircleCheck className="h-4 w-4" />
                Changed
              </span>
            ) : null}
          </div>
        </div>
      </AdminCard>

      <AdminCard title="If you ever get locked out">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Forgotten your password? On the sign-in page, use “Forgot your
          password?”. The email goes to the address above and brings you straight
          back to this page. Nobody else can sign in to this dashboard — there is
          no public sign-up anywhere on the site.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Lost the phone with your authenticator app? No email can fix that, by
          design. Open your Supabase project, run{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            delete from auth.mfa_factors where user_id = &apos;…&apos;
          </code>{' '}
          in the SQL editor for your own user, and the next sign-in will walk you
          through setting up a new device.
        </p>
      </AdminCard>
    </div>
  )
}
