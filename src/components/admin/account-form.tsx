'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CircleCheck, KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminCard, TextInput } from '@/components/admin/fields'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

/**
 * Password changes only. There is deliberately no "add another admin" here: a
 * second admin has to be created in Supabase on purpose, so the dashboard can
 * never be handed out by accident.
 */
export function AccountForm({ email }: { email: string }) {
  const params = useSearchParams()
  const fromReset = params.get('recovery') === '1'

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

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
          On the sign-in page, use “Forgot your password?”. The email goes to the
          address above and brings you straight back to this page. Nobody else
          can sign in to this dashboard — there is no public sign-up anywhere on
          the site.
        </p>
      </AdminCard>
    </div>
  )
}
