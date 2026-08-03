import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DynamicIcon } from '@/components/dynamic-icon'
import { buttonClass, Container, Section, SectionHeading } from '@/components/ui'
import type { Feature, HomeSection } from '@/lib/content'

/** The six "hero" features, shown as large cards. */
export function Highlights({
  section,
  features,
}: {
  section?: HomeSection
  features: Feature[]
}) {
  if (features.length === 0) return null

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Highlights"
          title={section?.heading || 'Built for how you actually study'}
          subtitle={section?.subheading ?? undefined}
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className="absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(90deg, var(--primary), var(--secondary))',
                }}
                aria-hidden="true"
              />
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-foreground">
                <DynamicIcon name={feature.icon} className="h-[1.35rem] w-[1.35rem]" />
              </span>
              <h3 className="mt-4 text-base font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.long_description || feature.short_description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/features" className={buttonClass('outline', 'md')}>
            See all features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </Section>
  )
}
