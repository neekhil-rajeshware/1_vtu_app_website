'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Eye, EyeOff, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { AdminCard } from '@/components/admin/fields'
import { Button } from '@/components/ui'
import type { Screenshot } from '@/lib/content'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Ticks and un-ticks the screenshots that ship with the site. The choice is one
 * row of `web_settings` (`screens.hidden`), so saving shows on the website at
 * the next page load — no deploy, no code.
 */
export function ScreenVisibility({
  shots,
  hidden: initialHidden,
  overridden,
}: {
  shots: Screenshot[]
  hidden: string[]
  overridden: boolean
}) {
  const router = useRouter()
  const [hidden, setHidden] = useState<string[]>(initialHidden)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const off = useMemo(() => new Set(hidden), [hidden])
  const showing = shots.length - off.size

  /** Keeps the gallery's own order inside each category heading. */
  const groups = useMemo(() => {
    const map = new Map<string, Screenshot[]>()
    for (const shot of shots) {
      const list = map.get(shot.category) ?? []
      list.push(shot)
      map.set(shot.category, list)
    }
    return Array.from(map, ([title, items]) => ({ title, items }))
  }, [shots])

  function apply(next: string[]) {
    setHidden(next)
    setDirty(true)
  }

  const toggle = (id: string) =>
    apply(off.has(id) ? hidden.filter((item) => item !== id) : [...hidden, id])

  const showThese = (ids: string[]) =>
    apply(hidden.filter((item) => !ids.includes(item)))

  const hideThese = (ids: string[]) =>
    apply(Array.from(new Set([...hidden, ...ids])))

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('web_settings').upsert(
      {
        key: 'screens',
        value: { hidden },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )
    setSaving(false)

    if (error) {
      toast.error(`Could not save: ${error.message}`)
      return
    }

    setDirty(false)
    toast.success(
      showing === 0
        ? 'Saved. No screenshots are showing on the website.'
        : `Saved. ${showing} screenshot${showing === 1 ? '' : 's'} showing.`,
    )
    router.refresh()
  }

  const allIds = shots.map((shot) => shot.id)

  return (
    <div>
      <AdminCard
        title="Choose which screenshots the website shows"
        description={`Click a screen to switch it on or off. ${showing} of ${shots.length} are showing.`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => showThese(allIds)}>
              <Eye className="h-3.5 w-3.5" />
              Show all
            </Button>
            <Button variant="outline" size="sm" onClick={() => hideThese(allIds)}>
              <EyeOff className="h-3.5 w-3.5" />
              Hide all
            </Button>
          </div>
        }
      >
        {overridden ? (
          <p className="mb-4 rounded-xl border border-secondary/30 bg-secondary/5 p-3 text-sm leading-relaxed">
            <strong className="font-semibold">These are not in use right now.</strong>{' '}
            You have added your own screenshots below, and yours replace this whole
            set. Delete all of your own to come back to these.
          </p>
        ) : null}

        <div className="space-y-6">
          {groups.map((group) => {
            const ids = group.items.map((shot) => shot.id)
            const on = ids.filter((id) => !off.has(id)).length
            return (
              <div key={group.title}>
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[0.7rem] font-bold uppercase tracking-wide text-muted-foreground">
                    {group.title} — {on} of {ids.length} showing
                  </p>
                  <div className="flex gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => showThese(ids)}
                      className="text-primary hover:underline"
                    >
                      Show all
                    </button>
                    <button
                      type="button"
                      onClick={() => hideThese(ids)}
                      className="text-muted-foreground hover:underline"
                    >
                      Hide all
                    </button>
                  </div>
                </div>

                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                  {group.items.map((shot) => {
                    const visible = !off.has(shot.id)
                    return (
                      <li key={shot.id}>
                        <button
                          type="button"
                          onClick={() => toggle(shot.id)}
                          aria-pressed={visible}
                          title={shot.caption ?? shot.title}
                          className={cn(
                            'group w-full overflow-hidden rounded-xl border-2 bg-card p-1 text-left transition-colors',
                            visible
                              ? 'border-primary'
                              : 'border-border hover:border-muted-foreground/40',
                          )}
                        >
                          <span className="relative block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={shot.image_url}
                              alt={shot.title}
                              loading="lazy"
                              className={cn(
                                'aspect-[9/19.5] w-full rounded-lg object-cover transition-opacity',
                                visible ? 'opacity-100' : 'opacity-40 grayscale',
                              )}
                            />
                            <span
                              className={cn(
                                'absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border',
                                visible
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border bg-background text-transparent',
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </span>
                          </span>
                          <span className="mt-1.5 block px-0.5 pb-0.5 text-[0.7rem] font-semibold leading-tight">
                            {shot.title}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </AdminCard>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[100rem] items-center justify-end gap-3">
          <p className="mr-auto text-xs text-muted-foreground">
            {dirty
              ? 'You have unsaved changes.'
              : `Everything is saved. ${showing} showing on the website.`}
          </p>
          <Button size="md" onClick={save} disabled={saving || !dirty}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
