import { ArrowRight, Download, ShieldCheck, Sparkles, WifiOff } from 'lucide-react'
import { Badge, ButtonLink, Container } from '@/components/ui'
import { PhoneMockup } from '@/components/phone-mockup'
import type { AllSettings } from '@/lib/settings'
import { appName } from '@/lib/settings'

const TRUST_POINTS = [
  { icon: Download, label: 'Free to download' },
  { icon: WifiOff, label: 'Works offline' },
  { icon: ShieldCheck, label: 'Your data stays on your phone' },
]

export function Hero({ settings }: { settings: AllSettings }) {
  const { hero, download } = settings
  const primaryHref = hero.primary_cta_url || download.play_store_url || ''

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[26rem] w-[46rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 35% 40%, var(--primary), transparent 62%), radial-gradient(circle at 70% 55%, var(--secondary), transparent 60%)',
        }}
        aria-hidden="true"
      />

      <Container className="relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-rise">
          {hero.badge ? (
            <Badge tone="brand">
              <Sparkles className="h-3.5 w-3.5" />
              {hero.badge}
            </Badge>
          ) : null}

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {hero.heading}{' '}
            {hero.highlight ? (
              <span className="text-gradient-brand">{hero.highlight}</span>
            ) : null}
          </h1>

          {hero.subheading ? (
            <p className="mt-5 max-w-xl text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
              {hero.subheading}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink
              href={primaryHref || undefined}
              variant="primary"
              size="lg"
              unavailableTitle="Launching on Google Play soon"
            >
              <Download className="h-[1.15rem] w-[1.15rem]" />
              {hero.primary_cta_label || 'Get it on Google Play'}
            </ButtonLink>
            <ButtonLink
              href={hero.secondary_cta_url || '/features'}
              variant="outline"
              size="lg"
            >
              {hero.secondary_cta_label || 'See all features'}
              <ArrowRight className="h-[1.15rem] w-[1.15rem]" />
            </ButtonLink>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="h-4 w-4 text-success" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise justify-self-center lg:justify-self-end">
          <PhoneMockup imageUrl={hero.image_url} appName={appName(settings)} />
        </div>
      </Container>
    </section>
  )
}
