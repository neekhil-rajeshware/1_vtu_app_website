'use client'

import { useCallback, useEffect, useState } from 'react'
import { CircleCheck, Link2, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { AdminCard, TextInput, ToggleRow } from '@/components/admin/fields'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

type AppLink = {
  key: string
  url: string
  label: string | null
  is_active: boolean
  updated_at: string
}

/**
 * Edits the `app_links` table — the links the phone app reads at launch. This is
 * the one admin page that changes the app itself: no new release, no waiting for
 * Google review. The app hides any link that is blank or switched off, so an
 * empty row is never a broken button.
 */
const KNOWN: { key: string; name: string; where: string; suggest?: string }[] = [
  {
    key: 'play_store',
    name: 'Play Store listing',
    where:
      'Used at the bottom of everything students share from the app, and for “Rate us”.',
  },
  {
    key: 'setup_video',
    name: 'Setup video',
    where: 'Opens from the side menu, under “How to set up the app”.',
  },
  {
    key: 'support',
    name: 'Support',
    where: 'Side menu → Support. An email link works here too (mailto:you@…).',
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp group',
    where: 'Side menu. Paste the group invite link.',
  },
  {
    key: 'telegram',
    name: 'Telegram channel',
    where: 'Side menu and the Profile screen.',
  },
  {
    key: 'website',
    name: 'Website',
    where: 'Side menu and the Profile screen. This should point at this website.',
    suggest: '/',
  },
  {
    key: 'privacy_policy',
    name: 'Privacy policy',
    where:
      'Side menu, and next to the tick box people accept when they sign in. Must always work.',
    suggest: '/privacy-policy',
  },
  {
    key: 'delete_account',
    name: 'Delete my account',
    where:
      'Profile screen → Delete account. Google checks this one. If it is blank, that button goes nowhere.',
    suggest: '/delete-account',
  },
]

export function AppLinksEditor() {
  const [rows, setRows] = useState<AppLink[] | null>(null)
  const [draft, setDraft] = useState<Record<string, { url: string; is_active: boolean }>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('app_links').select('*')

    if (error) {
      toast.error(`Could not load the app links: ${error.message}`)
      setRows([])
      return
    }

    const list = (data ?? []) as AppLink[]
    setRows(list)
    setDraft(
      Object.fromEntries(
        list.map((row) => [row.key, { url: row.url ?? '', is_active: row.is_active }]),
      ),
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const changed = (rows ?? []).filter((row) => {
    const next = draft[row.key]
    if (!next) return false
    return next.url !== (row.url ?? '') || next.is_active !== row.is_active
  })

  async function save() {
    if (changed.length === 0) return

    // A bad URL here breaks a button inside the app, so check before saving.
    for (const row of changed) {
      const url = draft[row.key].url.trim()
      if (url && !/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
        toast.error(
          `The ${row.key.replace(/_/g, ' ')} link must start with https:// (or mailto: for an email).`,
        )
        return
      }
    }

    setSaving(true)
    const supabase = createClient()
    const stamp = new Date().toISOString()

    const { error } = await supabase.from('app_links').upsert(
      changed.map((row) => ({
        key: row.key,
        url: draft[row.key].url.trim(),
        label: row.label,
        is_active: draft[row.key].is_active,
        updated_at: stamp,
      })),
      { onConflict: 'key' },
    )
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Saved. Phones pick this up the next time the app is opened.')
    await load()
  }

  if (rows === null) {
    return (
      <div className="grid place-items-center rounded-2xl border border-border bg-card py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  // Known keys first, in a sensible order, then anything else that exists in the
  // table so nothing is hidden from the owner.
  const extra = rows.filter((row) => !KNOWN.some((known) => known.key === row.key))
  const ordered = [
    ...KNOWN.filter((known) => rows.some((row) => row.key === known.key)),
    ...extra.map((row) => ({
      key: row.key,
      name: row.label ?? row.key,
      where: 'Added later. Only change this if you know what reads it.',
      suggest: undefined,
    })),
  ]

  return (
    <div className="space-y-4 pb-24">
      <AdminCard title="These links live inside the phone app">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Change one here and it changes in the app itself — no update needed on
          the Play Store. Anything left blank, or switched off, simply does not
          appear in the app, so a half-finished link never shows up as a dead
          button.
        </p>
      </AdminCard>

      {ordered.map((known) => {
        const row = rows.find((item) => item.key === known.key)
        if (!row) return null
        const value = draft[known.key] ?? { url: row.url ?? '', is_active: row.is_active }
        const isDirty =
          value.url !== (row.url ?? '') || value.is_active !== row.is_active

        return (
          <div
            key={known.key}
            className="rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">{known.name}</p>
              <code className="rounded-lg bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground">
                {known.key}
              </code>
              {isDirty ? (
                <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[0.7rem] font-bold text-secondary">
                  Not saved yet
                </span>
              ) : value.url ? (
                <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-primary">
                  <CircleCheck className="h-3.5 w-3.5" />
                  Live
                </span>
              ) : (
                <span className="text-[0.7rem] font-semibold text-muted-foreground">
                  Empty — hidden in the app
                </span>
              )}
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {known.where}
            </p>

            <div className="mt-3 space-y-3">
              <TextInput
                label="Link"
                type="url"
                value={value.url}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    [known.key]: { ...value, url: next },
                  }))
                }
                placeholder="https://…"
              />

              {known.suggest ? (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      [known.key]: {
                        ...value,
                        url: `${window.location.origin}${known.suggest}`,
                      },
                    }))
                  }
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Use this website’s page instead
                </button>
              ) : null}

              <ToggleRow
                label="Show this in the app"
                help="Turn off to hide it without deleting the link."
                checked={value.is_active}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    [known.key]: { ...value, is_active: next },
                  }))
                }
              />
            </div>
          </div>
        )
      })}

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur">
        <p className="text-xs text-muted-foreground">
          {changed.length === 0
            ? 'Nothing changed yet.'
            : `${changed.length} link${changed.length === 1 ? '' : 's'} changed.`}
        </p>
        <Button onClick={save} disabled={saving || changed.length === 0}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>
    </div>
  )
}

