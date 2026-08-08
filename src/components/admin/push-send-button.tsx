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
      toast.error(
        `Could not check: ${preview.data?.error ?? preview.error?.message ?? 'unknown error'}`,
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
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { id: row.id },
    })
    setBusy(false)

    if (error || data?.ok === false) {
      toast.error(`Not sent: ${data?.error ?? error?.message ?? 'unknown error'}`)
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
