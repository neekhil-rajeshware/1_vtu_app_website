'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

export const adminInputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

/** A white panel with an optional title — the building block of every page. */
export function AdminCard({
  title,
  description,
  children,
  className = '',
  action,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-sm',
        className,
      )}
    >
      {title ? (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  )
}

/** Label + help text wrapper shared by every input below. */
export function FieldShell({
  label,
  help,
  htmlFor,
  children,
  className = '',
}: {
  label: string
  help?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('block', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {help ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{help}</p>
      ) : null}
    </div>
  )
}

export function TextInput({
  label,
  help,
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
  className,
}: {
  label: string
  help?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  type?: 'text' | 'email' | 'url' | 'number' | 'date' | 'password'
  className?: string
}) {
  const id = useId()
  return (
    <FieldShell label={label} help={help} htmlFor={id} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={adminInputClass}
        placeholder={placeholder}
      />
    </FieldShell>
  )
}

export function TextArea({
  label,
  help,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  mono = false,
  className,
}: {
  label: string
  help?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  mono?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <FieldShell label={label} help={help} htmlFor={id} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={cn(adminInputClass, 'resize-y', mono && 'font-mono text-xs')}
        placeholder={placeholder}
      />
    </FieldShell>
  )
}

export function SelectInput({
  label,
  help,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  help?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  const id = useId()
  return (
    <FieldShell label={label} help={help} htmlFor={id} className={className}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={adminInputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

/** A plain-English on/off row, easier to read than a bare checkbox. */
export function ToggleRow({
  label,
  help,
  checked,
  onChange,
}: {
  label: string
  help?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background px-3.5 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {help ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{help}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[1.4rem]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}


