import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Page width wrapper — keeps every section aligned. */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-55'

const BUTTON_VARIANTS = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:brightness-95',
  secondary:
    'bg-secondary text-secondary-foreground shadow-sm hover:brightness-110 active:brightness-95',
  outline: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'bg-destructive text-destructive-foreground hover:brightness-110',
} as const

const BUTTON_SIZES = {
  sm: 'h-9 px-3.5',
  md: 'h-11 px-5',
  lg: 'h-12 px-6 text-[0.95rem]',
} as const

export type ButtonVariant = keyof typeof BUTTON_VARIANTS
export type ButtonSize = keyof typeof BUTTON_SIZES

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
) {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: {
  variant?: ButtonVariant
  size?: ButtonSize
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  )
}

/**
 * A button that is really a link. Falls back to a disabled-looking span when no
 * href is configured yet — the Play Store URL is empty until the app is live,
 * and a dead <a> would be worse than a clearly unavailable button.
 */
export function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  external,
  unavailableTitle = 'Coming soon',
}: {
  href?: string | null
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  external?: boolean
  unavailableTitle?: string
}) {
  if (!href) {
    return (
      <span
        className={buttonClass(variant, size, cn('cursor-not-allowed opacity-55', className))}
        title={unavailableTitle}
        aria-disabled="true"
      >
        {children}
      </span>
    )
  }

  const isExternal = external ?? /^https?:\/\//.test(href)

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass(variant, size, className)}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  )
}

/** Small rounded label, e.g. "Built for VTU students". */
export function Badge({
  children,
  tone = 'brand',
  className = '',
}: {
  children: ReactNode
  tone?: 'brand' | 'accent' | 'neutral' | 'success' | 'warning'
  className?: string
}) {
  const tones = {
    brand: 'bg-primary-soft text-primary dark:text-accent-foreground',
    accent: 'bg-secondary-soft text-secondary',
    neutral: 'bg-muted text-muted-foreground',
    success: 'bg-muted text-success',
    warning: 'bg-muted text-warning',
  } as const

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Standard card surface. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Centred heading block used at the top of every public section. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div
      className={cn(
        'animate-rise',
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl',
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-pretty text-[0.975rem] leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

/** Vertical rhythm wrapper for a public page section. */
export function Section({
  children,
  className = '',
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('py-14 sm:py-20', className)}>
      {children}
    </section>
  )
}

/** Shown where content would be, when the admin has not added any yet. */
export function EmptyState({
  title,
  description,
  className = '',
}: {
  title: string
  description?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center',
        className,
      )}
    >
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}

/** Page title block for the inner pages (Features, About, Download, …). */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="border-b border-border bg-muted/40">
      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl animate-rise">
          {eyebrow ? (
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
      </Container>
    </div>
  )
}
