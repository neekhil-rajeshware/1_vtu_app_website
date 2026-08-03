import { ArrowRight, Download } from 'lucide-react'
import { ButtonLink, Container, Section } from '@/components/ui'
import type { HomeSection } from '@/lib/content'
import type { AllSettings } from '@/lib/settings'

/** Closing call to action at the bottom of the home page. */
export function ClosingCta({
  section,
  settings,
}: {
  section?: HomeSection
  settings: AllSettings
}) {
  return (
    <Section>
      <Container>
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12"
          style={{
            background:
              'linear-gradient(130deg, var(--primary) 0%, var(--secondary) 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, #fff 0, transparent 45%), radial-gradient(circle at 80% 70%, #fff 0, transparent 40%)',
            }}
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-xl text-primary-foreground">
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              {section?.heading || 'Ready to fix your semester?'}
            </h2>
            {section?.subheading ? (
              <p className="mt-3 text-pretty text-[0.975rem] leading-relaxed opacity-90">
                {section.subheading}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href={settings.download.play_store_url || undefined}
                variant="outline"
                size="lg"
                className="border-transparent bg-white text-[#0b1220] hover:bg-white/90"
                unavailableTitle="Launching on Google Play soon"
              >
                <Download className="h-[1.15rem] w-[1.15rem]" />
                Download free
              </ButtonLink>
              <ButtonLink
                href="/features"
                variant="ghost"
                size="lg"
                className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
              >
                Explore features
                <ArrowRight className="h-[1.15rem] w-[1.15rem]" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
