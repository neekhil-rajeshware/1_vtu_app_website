'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminInputClass } from '@/components/admin/fields'
import { Button, EmptyState } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export type InboxRow = Record<string, unknown> & { id: string; status: string }

export type InboxField = { label: string; name: string; email?: boolean }

/**
 * Shared reader for the two things the public can send us: contact messages and
 * content reports. Nothing here is public — only an admin session can read
 * these tables at all.
 */
export function Inbox({
  table,
  statuses,
  fields,
  titleField,
  metaField,
  bodyField,
  hasAdminNote = false,
  emptyTitle,
  emptyDescription,
}: {
  table: string
  statuses: { value: string; label: string }[]
  fields: InboxField[]
  titleField: string
  metaField?: string
  bodyField: string
  hasAdminNote?: boolean
  emptyTitle: string
  emptyDescription: string
}) {
  const router = useRouter()
  const [rows, setRows] = useState<InboxRow[] | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(`Could not load: ${error.message}`)
      setRows([])
      return
    }
    setRows((data ?? []) as InboxRow[])
  }, [table])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(row: InboxRow, status: string) {
    setBusy(row.id)
    const supabase = createClient()
    const patch: Record<string, unknown> = { status }
    if (hasAdminNote) {
      patch.admin_note = notes[row.id] ?? (row.admin_note as string | null) ?? null
      patch.updated_at = new Date().toISOString()
    }

    const { error } = await supabase.from(table).update(patch).eq('id', row.id)
    setBusy(null)

    if (error) {
      toast.error(error.message)
      return
    }
    await load()
    router.refresh()
  }

  async function saveNote(row: InboxRow) {
    setBusy(row.id)
    const supabase = createClient()
    const { error } = await supabase
      .from(table)
      .update({
        admin_note: notes[row.id] ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    setBusy(null)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Note saved.')
    await load()
  }

  async function remove(row: InboxRow) {
    if (!window.confirm('Delete this permanently?')) return

    setBusy(row.id)
    const supabase = createClient()
    const { error } = await supabase.from(table).delete().eq('id', row.id)
    setBusy(null)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Deleted.')
    await load()
    router.refresh()
  }

  const visible =
    rows === null ? null : filter === 'all' ? rows : rows.filter((row) => row.status === filter)

  const counts = (value: string) =>
    rows ? rows.filter((row) => row.status === value).length : 0

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {[{ value: 'all', label: 'Everything' }, ...statuses].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              'shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
              filter === option.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
            {option.value === 'all' ? null : (
              <span className="ml-1.5 opacity-70">{counts(option.value)}</span>
            )}
          </button>
        ))}
      </div>

      {visible === null ? (
        <div className="grid place-items-center rounded-2xl border border-border bg-card py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => {
            const created = row.created_at
              ? new Date(String(row.created_at)).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : ''

            return (
              <li
                key={row.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {String(row[titleField] ?? '(no subject)')}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {metaField ? `${String(row[metaField] ?? '')} · ` : ''}
                      {created}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold',
                      row.status === 'new'
                        ? 'bg-secondary/10 text-secondary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {statuses.find((option) => option.value === row.status)?.label ??
                      row.status}
                  </span>
                </div>

                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {fields.map((field) => {
                    const value = row[field.name]
                    if (!value) return null
                    return (
                      <div key={field.name} className="min-w-0">
                        <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                          {field.label}
                        </dt>
                        <dd className="truncate text-sm">
                          {field.email ? (
                            <a
                              href={`mailto:${String(value)}`}
                              className="text-primary hover:underline dark:text-accent-foreground"
                            >
                              {String(value)}
                            </a>
                          ) : (
                            String(value)
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>

                <p className="mt-3 whitespace-pre-line rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">
                  {String(row[bodyField] ?? '')}
                </p>

                {hasAdminNote ? (
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      What you decided
                    </label>
                    <textarea
                      rows={2}
                      value={notes[row.id] ?? (row.admin_note as string | null) ?? ''}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      className={`${adminInputClass} resize-y`}
                      placeholder="For your own records — for example: listing removed, seller warned."
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveNote(row)}
                        disabled={busy === row.id}
                      >
                        Save note
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {row.email || row.reporter_email ? (
                    <a
                      href={`mailto:${String(row.email ?? row.reporter_email)}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Mail className="h-4 w-4" />
                      Reply
                    </a>
                  ) : null}

                  <select
                    value={row.status}
                    onChange={(e) => setStatus(row, e.target.value)}
                    disabled={busy === row.id}
                    className="h-9 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                    aria-label="Change status"
                  >
                    {statuses.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => remove(row)}
                    disabled={busy === row.id}
                    className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-secondary"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
