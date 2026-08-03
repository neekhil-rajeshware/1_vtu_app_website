import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The site logo. If the admin has uploaded a logo in Site Settings it is used;
 * otherwise we draw the app's monogram in the brand gradient, so the header
 * never looks broken on a fresh install.
 */
export function BrandLogo({
  name,
  logoUrl,
  className = '',
  size = 34,
}: {
  name: string
  logoUrl?: string | null
  className?: string
  size?: number
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={cn('rounded-lg object-contain', className)}
      />
    )
  }

  const initials = name.trim().slice(0, 1).toUpperCase() || 'O'

  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-lg bg-primary font-bold text-primary-foreground',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

/** Logo + wordmark, linking home. Used in the header and footer. */
export function BrandLockup({
  name,
  tagline,
  logoUrl,
  href = '/',
  showTagline = false,
}: {
  name: string
  tagline?: string
  logoUrl?: string | null
  href?: string
  showTagline?: boolean
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5"
      aria-label={`${name} — home`}
    >
      <BrandLogo name={name} logoUrl={logoUrl} />
      <span className="flex flex-col leading-none">
        <span className="text-[1.0625rem] font-bold tracking-tight">{name}</span>
        {showTagline && tagline ? (
          <span className="mt-1 text-[0.7rem] font-medium text-muted-foreground">
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
