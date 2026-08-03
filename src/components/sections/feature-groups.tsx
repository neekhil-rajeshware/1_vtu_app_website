import { DynamicIcon } from '@/components/dynamic-icon'
import { Container, EmptyState, Section, SectionHeading } from '@/components/ui'
import { groupFeatures, type Feature, type HomeSection } from '@/lib/content'

/**
 * Every feature, grouped the same way the app's home screen groups them.
 * Used on the home page and on /features.
 */
export function FeatureGroups({
  section,
  features,
  showHeading = true,
  detailed = false,
}: {
  section?: HomeSection
  features: Feature[]
  showHeading?: boolean
  detailed?: boolean
}) {
  const groups = groupFeatures(features)

  return (
    <Section>
      <Container>
        {showHeading ? (
          <SectionHeading
            eyebrow="Everything included"
            title={section?.heading || 'Everything inside OneVTU'}
            subtitle={section?.subheading ?? undefined}
          />
        ) : null}

        {groups.length === 0 ? (
          <EmptyState
            className="mt-10"
            title="No features listed yet"
            description="Features are added from the admin dashboard."
          />
        ) : null}

        <div className={showHeading ? 'mt-12 space-y-14' : 'space-y-14'}>
          {groups.map((group) => (
            <div key={group.name}>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold tracking-tight">{group.name}</h3>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {group.items.length}
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((feature) => (
                  <article
                    key={feature.id}
                    id={`feature-${feature.id}`}
                    className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/35"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary dark:text-accent-foreground">
                        <DynamicIcon name={feature.icon} className="h-[1.15rem] w-[1.15rem]" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-[0.95rem] font-bold leading-snug">
                          {feature.title}
                        </h4>
                        {feature.short_description ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {feature.short_description}
                          </p>
                        ) : null}
                        {detailed && feature.long_description ? (
                          <p className="mt-2.5 border-t border-border pt-2.5 text-sm leading-relaxed text-muted-foreground">
                            {feature.long_description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
