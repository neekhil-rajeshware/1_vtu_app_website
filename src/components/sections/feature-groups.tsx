import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { DynamicIcon } from '@/components/dynamic-icon'
import { Container, EmptyState, Section, SectionHeading } from '@/components/ui'
import { groupFeatures, type Feature, type HomeSection } from '@/lib/content'
import { slugify } from '@/lib/utils'

/**
 * Every feature, grouped the same way the app's home screen groups them.
 * Used on the home page and on /features.
 */
export function FeatureGroups({
  section,
  features,
  appName,
  showHeading = true,
  detailed = false,
}: {
  section?: HomeSection
  features: Feature[]
  appName: string
  showHeading?: boolean
  detailed?: boolean
}) {
  const groups = groupFeatures(features)

  /**
   * Heading levels depend on whether this instance renders its own section
   * heading. `SectionHeading` draws an `<h2>`, so group names sit at `<h3>`
   * underneath it — but on `/features` there is no section heading, and a fixed
   * `<h3>` there left the page jumping straight from `<h1>` to `<h3>`.
   */
  const GroupHeading = showHeading ? 'h3' : 'h2'
  const ItemHeading = showHeading ? 'h4' : 'h3'

  return (
    <Section>
      <Container>
        {showHeading ? (
          <SectionHeading
            eyebrow="Everything included"
            title={section?.heading || `Everything inside ${appName}`}
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
            /*
              `scroll-mt-28` clears the sticky site header (h-16) plus the
              category nav on /features. Without it every jump link on that
              page lands with its heading hidden behind both.
            */
            <div
              key={group.name}
              id={`group-${slugify(group.name)}`}
              className="scroll-mt-28"
            >
              <div className="flex items-center gap-3">
                <GroupHeading className="text-lg font-bold tracking-tight">
                  {group.name}
                </GroupHeading>
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
                    className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/35"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary dark:text-accent-foreground">
                        <DynamicIcon name={feature.icon} className="h-[1.15rem] w-[1.15rem]" />
                      </span>
                      <div className="min-w-0">
                        <ItemHeading className="text-[0.95rem] font-bold leading-snug">
                          {/* A feature with its own page links to it. The
                              anchor stays on the ones that do not, so the
                              "Most used" pills above still land somewhere. */}
                          {/*
                            A feature with its own page links to it. The
                            anchor stays on the ones that do not, so the
                            "Most used" pills above still land somewhere.

                            Only 8 of the 39 features have a landing page, so
                            the linked ones need to *say* they are linked —
                            otherwise a card that goes somewhere and a card
                            that is a dead end look identical. The chevron and
                            the hover underline are that signal, and they
                            appear exactly when a destination exists.
                          */}
                          {feature.slug ? (
                            <Link
                              href={`/features/${feature.slug}`}
                              className="group/link inline-flex items-center gap-1 transition-colors hover:text-primary dark:hover:text-accent-foreground"
                            >
                              <span className="underline decoration-transparent decoration-2 underline-offset-2 transition-colors group-hover/link:decoration-current">
                                {feature.title}
                              </span>
                              <ChevronRight
                                className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/link:translate-x-0.5"
                                aria-hidden="true"
                              />
                            </Link>
                          ) : (
                            feature.title
                          )}
                        </ItemHeading>
                        {feature.short_description ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {feature.short_description}
                          </p>
                        ) : null}
                        {/*
                          There used to be a "More about <title>" link here as
                          well. It pointed at exactly the same URL as the
                          heading above, and since only features with a landing
                          page got one, it appeared on 8 cards out of 39 —
                          which read as a broken card rather than a link. The
                          heading carries the link on its own now.
                        */}
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
