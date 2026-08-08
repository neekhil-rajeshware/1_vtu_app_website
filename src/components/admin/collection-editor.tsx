'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  SelectInput,
  TextArea,
  TextInput,
  ToggleRow,
  adminInputClass,
  FieldShell,
} from '@/components/admin/fields'
import { ImageInput } from '@/components/admin/image-input'
import { Button, EmptyState } from '@/components/ui'
import { DynamicIcon, ICON_NAMES } from '@/components/dynamic-icon'
import { createClient } from '@/lib/supabase/client'

export type CollectionField = {
  name: string
  label: string
  type:
    | 'text'
    | 'email'
    | 'url'
    | 'textarea'
    | 'select'
    | 'toggle'
    | 'image'
    | 'number'
    | 'date'
    | 'icon'
    | 'tags'
  help?: string
  placeholder?: string
  rows?: number
  maxLength?: number
  options?: { value: string; label: string }[]
  half?: boolean
  required?: boolean
}

export type Row = Record<string, unknown> & { id: string }

/**
 * One editor that drives every list on the site — features, screenshots, FAQ,
 * reviews, numbers, versions. Give it a table name and a list of fields and it
 * handles add, edit, delete, show/hide and ordering, all through RLS with the
 * admin's own session. No page needs its own CRUD code.
 */
export function CollectionEditor({
  table,
  fields,
  titleField,
  subtitleField,
  imageField,
  iconField,
  hasActive = true,
  hasSortOrder = true,
  orderBy,
  singular,
  addLabel,
  emptyTitle,
  emptyDescription,
  defaults = {},
  rowAction,
}: {
  table: string
  fields: CollectionField[]
  titleField: string
  subtitleField?: string
  imageField?: string
  iconField?: string
  hasActive?: boolean
  hasSortOrder?: boolean
  orderBy?: { column: string; ascending?: boolean }
  singular: string
  addLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  defaults?: Record<string, unknown>
  /**
   * An extra control shown on each row, before edit and delete. Added for the
   * push page, whose rows need a "Send" that is not add/edit/delete — the
   * alternative was a second copy of all the CRUD below. `reload` re-reads the
   * list so the action can show its own result.
   */
  rowAction?: (row: Row, reload: () => Promise<void>) => React.ReactNode
}) {
  const router = useRouter()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const order = orderBy ?? {
    column: hasSortOrder ? 'sort_order' : 'created_at',
    ascending: hasSortOrder,
  }

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(order.column, { ascending: order.ascending ?? true })

    if (error) {
      toast.error(`Could not load: ${error.message}`)
      setRows([])
      return
    }
    setRows((data ?? []) as Row[])
  }, [table, order.column, order.ascending])

  useEffect(() => {
    load()
  }, [load])

  async function toggleActive(row: Row) {
    setBusyId(row.id)
    const supabase = createClient()
    const { error } = await supabase
      .from(table)
      .update({ is_active: !(row.is_active === true) })
      .eq('id', row.id)
    setBusyId(null)

    if (error) {
      toast.error(error.message)
      return
    }
    await load()
    router.refresh()
  }

  /** Swaps sort_order with the neighbour, which is enough for hand-sorted lists. */
  async function move(index: number, direction: -1 | 1) {
    if (!rows) return
    const target = rows[index + direction]
    const current = rows[index]
    if (!target || !current) return

    setBusyId(current.id)
    const supabase = createClient()
    const currentOrder = Number(current.sort_order ?? index)
    const targetOrder = Number(target.sort_order ?? index + direction)

    // Equal values would leave the order unchanged, so force them apart.
    const [a, b] =
      currentOrder === targetOrder
        ? direction === -1
          ? [targetOrder + 1, targetOrder]
          : [targetOrder - 1, targetOrder]
        : [targetOrder, currentOrder]

    const first = await supabase.from(table).update({ sort_order: a }).eq('id', current.id)
    const second = await supabase.from(table).update({ sort_order: b }).eq('id', target.id)
    setBusyId(null)

    if (first.error || second.error) {
      toast.error((first.error ?? second.error)!.message)
      return
    }
    await load()
    router.refresh()
  }

  async function remove(row: Row) {
    const name = String(row[titleField] ?? singular)
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return

    setBusyId(row.id)
    const supabase = createClient()
    const { error } = await supabase.from(table).delete().eq('id', row.id)
    setBusyId(null)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Deleted.')
    await load()
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" />
          {addLabel ?? `Add ${singular}`}
        </Button>
      </div>

      {rows === null ? (
        <div className="grid place-items-center rounded-2xl border border-border bg-card py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? `No ${singular} yet`}
          description={
            emptyDescription ?? `Use the button above to add your first ${singular}.`
          }
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((row, index) => {
            const hidden = hasActive && row.is_active !== true
            const image = imageField ? String(row[imageField] ?? '') : ''
            const icon = iconField ? String(row[iconField] ?? '') : ''

            return (
              <li
                key={row.id}
                className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-3 ${hidden ? 'opacity-60' : ''}`}
              >
                {hasSortOrder ? (
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || busyId === row.id}
                      className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === rows.length - 1 || busyId === row.id}
                      className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                {image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg border border-border bg-muted object-cover"
                  />
                ) : icon ? (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary dark:bg-primary/15 dark:text-accent-foreground">
                    <DynamicIcon name={icon} className="h-5 w-5" />
                  </span>
                ) : null}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {String(row[titleField] ?? '(untitled)')}
                  </p>
                  {subtitleField ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {String(row[subtitleField] ?? '')}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {rowAction ? rowAction(row, load) : null}
                  {hasActive ? (
                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      disabled={busyId === row.id}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={hidden ? 'Show on the website' : 'Hide from the website'}
                      title={hidden ? 'Hidden — click to show' : 'Visible — click to hide'}
                    >
                      {hidden ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    disabled={busyId === row.id}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-secondary"
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

      {editing ? (
        <RecordDialog
          table={table}
          fields={fields}
          defaults={defaults}
          row={editing === 'new' ? null : editing}
          nextSortOrder={hasSortOrder ? (rows?.length ?? 0) : undefined}
          singular={singular}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await load()
            router.refresh()
          }}
        />
      ) : null}
    </div>
  )
}

/** The add/edit panel. Same fields whether the record is new or existing. */
function RecordDialog({
  table,
  fields,
  row,
  defaults,
  nextSortOrder,
  singular,
  onClose,
  onSaved,
}: {
  table: string
  fields: CollectionField[]
  row: Row | null
  defaults: Record<string, unknown>
  nextSortOrder?: number
  singular: string
  onClose: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const base: Record<string, unknown> = { ...defaults }
    for (const field of fields) {
      const existing = row ? row[field.name] : undefined
      base[field.name] =
        existing !== undefined && existing !== null
          ? existing
          : (defaults[field.name] ??
            (field.type === 'toggle' ? true : field.type === 'tags' ? [] : ''))
    }
    return base
  })
  const [saving, setSaving] = useState(false)

  const set = (name: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [name]: value }))

  const text = (name: string) => {
    const raw = values[name]
    return typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function save() {
    for (const field of fields) {
      if (field.required && !text(field.name).trim()) {
        toast.error(`${field.label} is required.`)
        return
      }
    }

    const payload: Record<string, unknown> = {}
    for (const field of fields) {
      const raw = values[field.name]
      if (field.type === 'number') {
        const num = Number(raw)
        payload[field.name] = Number.isFinite(num) ? num : 0
      } else if (field.type === 'toggle') {
        payload[field.name] = raw === true
      } else if (field.type === 'tags') {
        payload[field.name] = Array.isArray(raw) ? raw : []
      } else if (field.type === 'date') {
        payload[field.name] = text(field.name) || null
      } else {
        const value = text(field.name)
        // Optional text columns are nullable; empty strings would show as blanks.
        payload[field.name] = value === '' && !field.required ? null : value
      }
    }

    // Columns the form does not show but the table needs.
    for (const [key, value] of Object.entries(defaults)) {
      if (!(key in payload)) payload[key] = value
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = row
      ? await supabase.from(table).update(payload).eq('id', row.id)
      : await supabase
          .from(table)
          .insert(
            nextSortOrder !== undefined && !('sort_order' in payload)
              ? { ...payload, sort_order: nextSortOrder }
              : payload,
          )
    setSaving(false)

    if (error) {
      toast.error(`Could not save: ${error.message}`)
      return
    }

    toast.success(row ? 'Saved.' : 'Added.')
    onSaved()
  }

  function renderField(field: CollectionField) {
    switch (field.type) {
      case 'toggle':
        return (
          <ToggleRow
            label={field.label}
            help={field.help}
            checked={values[field.name] === true}
            onChange={(checked) => set(field.name, checked)}
          />
        )
      case 'select':
        return (
          <SelectInput
            label={field.label}
            help={field.help}
            value={text(field.name)}
            onChange={(value) => set(field.name, value)}
            options={field.options ?? []}
          />
        )
      case 'image':
        return (
          <ImageInput
            label={field.label}
            help={field.help}
            value={text(field.name)}
            onChange={(value) => set(field.name, value)}
          />
        )
      case 'textarea':
        return (
          <TextArea
            label={field.label}
            help={field.help}
            placeholder={field.placeholder}
            rows={field.rows ?? 4}
            maxLength={field.maxLength}
            value={text(field.name)}
            onChange={(value) => set(field.name, value)}
          />
        )
      case 'icon':
        return (
          <FieldShell label={field.label} help={field.help}>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-primary/15 dark:text-accent-foreground">
                <DynamicIcon name={text(field.name)} className="h-5 w-5" />
              </span>
              <select
                value={text(field.name)}
                onChange={(e) => set(field.name, e.target.value)}
                className={adminInputClass}
              >
                {ICON_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </FieldShell>
        )
      case 'tags':
        return (
          <TextInput
            label={field.label}
            help={field.help ?? 'Separate with commas.'}
            placeholder={field.placeholder}
            value={(Array.isArray(values[field.name])
              ? (values[field.name] as string[])
              : []
            ).join(', ')}
            onChange={(value) =>
              set(
                field.name,
                value
                  .split(',')
                  .map((part) => part.trim())
                  .filter(Boolean),
              )
            }
          />
        )
      default:
        return (
          <TextInput
            label={field.label}
            help={field.help}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            type={field.type === 'number' ? 'number' : field.type}
            value={text(field.name)}
            onChange={(value) => set(field.name, value)}
          />
        )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-bold">
            {row ? `Edit ${singular}` : `Add ${singular}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.name}
              className={field.half ? 'sm:col-span-1' : 'sm:col-span-2'}
            >
              {renderField(field)}
            </div>
          ))}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving…' : row ? 'Save changes' : `Add ${singular}`}
          </Button>
        </footer>
      </div>
    </div>
  )
}


