'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  AdminCard,
  SelectInput,
  TextArea,
  TextInput,
  ToggleRow,
} from '@/components/admin/fields'
import { ImageInput } from '@/components/admin/image-input'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

export type SettingField = {
  name: string
  label: string
  type: 'text' | 'email' | 'url' | 'textarea' | 'code' | 'select' | 'toggle' | 'image'
  help?: string
  placeholder?: string
  rows?: number
  maxLength?: number
  options?: { value: string; label: string }[]
  /** Put two short fields side by side on wide screens. */
  half?: boolean
}

export type SettingsGroup = {
  title: string
  description?: string
  fields: SettingField[]
}

type Values = Record<string, unknown>

/**
 * Edits one row of `web_settings`. Every public page reads these rows per
 * request, so a save shows up on the site immediately — no rebuild, no deploy.
 *
 * A save merges over whatever is stored at that moment instead of replacing the
 * row outright. Two pages edit parts of the same `site` row (Basics here, App
 * name on its own page), and without the merge a tab that had been open since
 * before the other was saved would quietly put the old value back.
 */
export function SettingsForm({
  settingsKey,
  initial,
  groups,
}: {
  settingsKey: string
  initial: Values
  groups: SettingsGroup[]
}) {
  const router = useRouter()
  const [values, setValues] = useState<Values>(initial)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  /** Only the fields this form actually shows may be written. */
  const owned = groups.flatMap((group) => group.fields.map((field) => field.name))

  const set = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setDirty(true)
  }

  const text = (name: string) => {
    const raw = values[name]
    return typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()

    const { data: current } = await supabase
      .from('web_settings')
      .select('value')
      .eq('key', settingsKey)
      .maybeSingle()

    const stored =
      current?.value && typeof current.value === 'object'
        ? (current.value as Values)
        : {}

    const merged: Values = { ...stored }
    for (const name of owned) merged[name] = values[name]

    const { error } = await supabase
      .from('web_settings')
      .upsert(
        { key: settingsKey, value: merged, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )
    setSaving(false)

    if (error) {
      toast.error(`Could not save: ${error.message}`)
      return
    }

    setValues(merged)
    setDirty(false)
    toast.success('Saved. The website is updated.')
    router.refresh()
  }

  function renderField(field: SettingField) {
    switch (field.type) {
      case 'toggle':
        return (
          <ToggleRow
            key={field.name}
            label={field.label}
            help={field.help}
            checked={values[field.name] === true}
            onChange={(checked) => set(field.name, checked)}
          />
        )
      case 'select':
        return (
          <SelectInput
            key={field.name}
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
            key={field.name}
            label={field.label}
            help={field.help}
            value={text(field.name)}
            onChange={(value) => set(field.name, value)}
          />
        )
      case 'textarea':
      case 'code':
        return (
          <TextArea
            key={field.name}
            label={field.label}
            help={field.help}
            placeholder={field.placeholder}
            rows={field.rows ?? (field.type === 'code' ? 12 : 4)}
            maxLength={field.maxLength}
            mono={field.type === 'code'}
            value={text(field.name)}
            onChange={(value) => set(field.name, value)}
          />
        )
      default:
        return (
          <TextInput
            key={field.name}
            label={field.label}
            help={field.help}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            type={field.type}
            value={text(field.name)}
            onChange={(value) => set(field.name, value)}
          />
        )
    }
  }

  return (
    <div className="space-y-5 pb-24">
      {groups.map((group) => (
        <AdminCard
          key={group.title}
          title={group.title}
          description={group.description}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div
                key={field.name}
                className={field.half ? 'sm:col-span-1' : 'sm:col-span-2'}
              >
                {renderField(field)}
              </div>
            ))}
          </div>
        </AdminCard>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[100rem] items-center justify-end gap-3">
          <p className="mr-auto text-xs text-muted-foreground">
            {dirty ? 'You have unsaved changes.' : 'Everything is saved.'}
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
