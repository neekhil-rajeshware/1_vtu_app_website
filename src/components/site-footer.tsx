import Link from 'next/link'
import { Mail } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { SocialIcon, SOCIAL_LABELS, type SocialNetwork } from '@/components/social-icon'
import { Container } from '@/components/ui'
import type { AllSettings } from '@/lib/settings'
import { appName } from '@/lib/settings'

const COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'All features' },
      { href: '/screenshots', label: 'Screenshots' },
      { href: '/download', label: 'Download' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/contact', label: 'Contact' },
      { href: '/community-guidelines', label: 'Community guidelines' },
      { href: '/report', label: 'Report content' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy-policy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of service' },
      { href: '/delete-account', label: 'Delete your account' },
    ],
  },
]

const SOCIAL_ORDER: SocialNetwork[] = [
  'youtube',
  'instagram',
  'whatsapp',
  'telegram',
  'twitter',
  'linkedin',
]

export function SiteFooter({ settings }: { settings: AllSettings }) {
  const { site, footer, social, contact } = settings
  const name = appName(settings)
  const year = new Date().getFullYear()
  const activeSocials = SOCIAL_ORDER.filter((key) => social[key])

  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandLogo name={name} logoUrl={site.logo_url} />
              <span className="text-[1.0625rem] font-bold tracking-tight">
                {name}
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {footer.description || site.tagline}
            </p>

            {contact.support_email ? (
              <a
                href={`mailto:${contact.support_email}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline dark:text-accent-foreground"
              >
                <Mail className="h-4 w-4" />
                {contact.support_email}
              </a>
            ) : null}

            {activeSocials.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {activeSocials.map((key) => (
                  <a
                    key={key}
                    href={social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary dark:hover:text-accent-foreground"
                    aria-label={SOCIAL_LABELS[key]}
                    title={SOCIAL_LABELS[key]}
                  >
                    <SocialIcon network={key} className="h-[1.05rem] w-[1.05rem]" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-bold">{column.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {footer.disclaimer ? (
          <p className="mt-10 rounded-xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            {footer.disclaimer}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {footer.copyright || name}. All rights reserved.
          </p>
          <Link href="/admin" className="transition-colors hover:text-foreground">
            Admin
          </Link>
        </div>
      </Container>
    </footer>
  )
}
