'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { adminInputClass } from '@/components/admin/fields'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

type Section = {
  id: string
  section_key: string
  name: string
  heading: string | null
  subheading: string | null
  is_visible: boolean
  sort_order: number
}

/**
 * Show, hide, reorder and retitle the blocks on the home page. The blocks
 * themselves are built into the site; this controls whether each one appears
 * and what its heading says.
 */
export function HomeSectionsEditor() {
  const router = useRouter()
  const [sections, setSections] = useState<Section[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('web_home_sections')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      toast.error(`Could not load sections: ${error.message}`)
      setSections([])
      return
    }
    setSections((data ?? []) as Section[])
  }

  useEffect(() => {
    load()
  }, [])

  function patch(id: string, changes: Partial<Section>) {
    setSections((prev) =>
      prev ? prev.map((row) => (row.id === id ? { ...row, ...changes } : row)) : prev,
    )
  }

  async function saveRow(row: Section) {
    setBusy(row.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('web_home_sections')
      .update({
        heading: row.heading || null,
        subheading: row.subheading || null,
        is_visible: row.is_visible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    setBusy(null)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Saved.')
    router.refresh()
  }

  async function toggleVisible(row: Section) {
    setBusy(row.id)
    const supabase = createClient()
    const next = !row.is_visible
    const { error } = await supabase
      .from('web_home_sections')
      .update({ is_visible: next })
      .eq('id', row.id)
    setBusy(null)

    if (error) {
      toast.error(error.message)
      return
    }
    patch(row.id, { is_visible: next })
    toast.success(next ? 'Section is now shown.' : 'Section is now hidden.')
    router.refresh()
  }

  async function move(index: number, direction: -1 | 1) {
    if (!sections) return
    const current = sections[index]
    const target = sections[index + direction]
    if (!current || !target) return

    setBusy(current.id)
    const supabase = createClient()
    const first = await supabase
      .from('web_home_sections')
      .update({ sort_order: target.sort_order })
      .eq('id', current.id)
    const second = await supabase
      .from('web_home_sections')
      .update({ sort_order: current.sort_order })
      .eq('id', target.id)
    setBusy(null)

    if (first.error || second.error) {
      toast.error((first.error ?? second.error)!.message)
      return
    }
    await load()
    router.refresh()
  }

  if (sections === null) {
    return (
      <div className="grid place-items-center rounded-2xl border border-border bg-card py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {sections.map((row, index) => (
        <li key={row.id} className="rounded-2xl border border-border bg-card">
          <div
            className={`flex items-center gap-3 p-3 ${row.is_visible ? '' : 'opacity-60'}`}
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0 || busy === row.id}
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === sections.length - 1 || busy === row.id}
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{row.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.heading || 'No custom heading'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleVisible(row)}
              disabled={busy === row.id}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label={row.is_visible ? 'Hide this section' : 'Show this section'}
              title={row.is_visible ? 'Shown — click to hide' : 'Hidden — click to show'}
            >
              {row.is_visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(open === row.id ? null : row.id)}
            >
              {open === row.id ? 'Close' : 'Edit text'}
            </Button>
          </div>

          {open === row.id ? (
            <div className="space-y-3 border-t border-border p-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Heading</span>
                <input
                  type="text"
                  value={row.heading ?? ''}
                  onChange={(e) => patch(row.id, { heading: e.target.value })}
                  className={adminInputClass}
                  placeholder="Leave empty to use the built-in heading"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Subheading</span>
                <textarea
                  rows={2}
                  value={row.subheading ?? ''}
                  onChange={(e) => patch(row.id, { subheading: e.target.value })}
                  className={`${adminInputClass} resize-y`}
                  placeholder="One line under the heading"
                />
              </label>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => saveRow(row)} disabled={busy === row.id}>
                  {busy === row.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save section
                </Button>
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
