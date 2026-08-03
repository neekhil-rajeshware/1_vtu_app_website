'use client'

import { useState } from 'react'
import { SettingsForm, type SettingsGroup } from '@/components/admin/settings-form'
import { cn } from '@/lib/utils'

export type SettingsTab = {
  key: string
  label: string
  initial: Record<string, unknown>
  groups: SettingsGroup[]
}

/**
 * Several settings rows on one page without several save buttons fighting for
 * the same corner: one tab is open at a time, and each tab saves its own row.
 */
export function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? '')
  const current = tabs.find((tab) => tab.key === active) ?? tabs[0]

  if (!current) return null

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              'shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
              tab.key === current.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Remounting on tab change keeps each form's unsaved state separate. */}
      <SettingsForm
        key={current.key}
        settingsKey={current.key}
        initial={current.initial}
        groups={current.groups}
      />
    </div>
  )
}
