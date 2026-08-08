'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Row } from '@/components/admin/collection-editor'

/**
 * Sends one announcement to phones, through the `send-push` Edge Function.
 *
 * The function is called rather than FCM directly because the FCM service
 * account must not live in this repo — this codebase has no server-side secret
 * at all, only the publishable key and RLS, and the send is authorized by the
 * admin's own session exactly like every other write here.
 *
 * The audience is deliberately not passed. It is read server-side from the row
 * itself, so what lands on a phone always matches what the app's Circulars
 * screen shows for that announcement.
 */
export function PushSendButton({
  row,
  reload,
}: {
  row: Row
  reload: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  const sentAt = row.push_sent_at ? String(row.push_sent_at) : ''
  const pushEnabled = row.push_enabled !== false
  const title = String(row.title ?? 'this announcement')

  async function send() {
    // A push cannot be recalled once FCM accepts it, so both the audience and
    // the fact that it is going out are confirmed before anything is sent.
    const supabase = createClient()

    setBusy(true)
    const preview = await supabase.functions.invoke('send-push', {
      body: { id: row.id, dryRun: true },
    })
    setBusy(false)

    if (preview.error || preview.data?.ok === false) {
      toast.error(`Could not check: ${await describeError(preview)}`)
      return
    }

    if (preview.data?.secretConfigured === false) {
      toast.error(
        'Sending is not set up yet: the FCM_SERVICE_ACCOUNT secret is missing ' +
          'in Supabase. Add it under Edge Functions → Secrets, using the JSON ' +
          'from Firebase Console → Project settings → Service accounts.',
        { duration: 12000 },
      )
      return
    }

    const audience = describeAudience(row)
    const again = sentAt
      ? '\n\nThis was already sent once. Sending again will notify everyone a second time.'
      : ''
    if (
      !window.confirm(
        `Send “${title}” to ${audience}?\n\nThis goes to phones straight away and cannot be undone.${again}`,
      )
    ) {
      return
    }

    setBusy(true)
    const result = await supabase.functions.invoke('send-push', {
      body: { id: row.id },
    })
    setBusy(false)

    if (result.error || result.data?.ok === false) {
      toast.error(`Not sent: ${await describeError(result)}`, {
        duration: 12000,
      })
      await reload()
      return
    }

    toast.success(`Sent to ${audience}.`)
    await reload()
  }

  if (!pushEnabled) return null

  return (
    <button
      type="button"
      onClick={send}
      disabled={busy}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
      aria-label={sentAt ? 'Send again' : 'Send to phones'}
      title={
        sentAt
          ? `Already sent ${new Date(sentAt).toLocaleString()} — click to send again`
          : 'Send to phones'
      }
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className={`h-4 w-4 ${sentAt ? 'opacity-40' : ''}`} />
      )}
    </button>
  )
}

/** Plain-English audience, for the confirmation prompt. */
function describeAudience(row: Row): string {
  const parts: string[] = []
  if (row.branch_code) parts.push(String(row.branch_code))
  if (row.scheme_code) parts.push(`${row.scheme_code} scheme`)
  if (row.semester) parts.push(`semester ${row.semester}`)
  return parts.length === 0 ? 'every student' : parts.join(', ') + ' students'
}

/**
 * Digs the function's own error message out of a failed `invoke`.
 *
 * Necessary because supabase-js throws away the response body on any non-2xx:
 * it hands back `{ data: null, error: FunctionsHttpError }`, and that error's
 * message is the useless constant "Edge Function returned a non-2xx status
 * code". The actual reason — missing secret, not an admin, row not found — is
 * in the body, reachable only through `error.context`, which is the raw
 * `Response`. Without this the dashboard reports every distinct failure as the
 * same sentence.
 */
async function describeError(result: {
  data?: { error?: unknown } | null
  error?: { message?: string; context?: unknown } | null
}): Promise<string> {
  if (result.data?.error) return String(result.data.error)

  const context = result.error?.context
  if (context instanceof Response) {
    try {
      // Cloned so a caller that reads the body later still can.
      const body = await context.clone().json()
      if (body?.error) return String(body.error)
    } catch {
      // Not JSON, or already consumed — fall through to the generic message.
    }
  }

  return result.error?.message ?? 'unknown error'
}
