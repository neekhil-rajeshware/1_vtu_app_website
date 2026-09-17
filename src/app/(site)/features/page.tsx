import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { FaqSection } from '@/components/sections/faq'
import { FeatureGroups } from '@/components/sections/feature-groups'
import { ClosingCta } from '@/components/sections/closing-cta'
import { DynamicIcon } from '@/components/dynamic-icon'
import { Container, PageHeader, Section } from '@/components/ui'
import {
  getFaqs,
  getFeatures,
  getHighlightFeatures,
  groupFeatures,
} from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { appName, getSettings } from '@/lib/settings'
import { slugify } from '@/lib/utils'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Features',
    description:
      'Every VTU study tool in one app: syllabus and scheme, previous year question papers, AI Professor, quizzes, attendance tracker, CGPA calculator, formulas and unit converters.',
    path: '/features',
  })
}

export default async function FeaturesPage() {
  const [settings, features, highlights, faqs] = await Promise.all([
    getSettings(),
    getFeatures(),
    getHighlightFeatures(),
    getFaqs(),
  ])

  const featureFaqs = faqs.filter((faq) => faq.category === 'Features')
  const groups = groupFeatures(features)

  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Everything the app can do"
        subtitle="Grouped exactly the way the app groups them, so you can find the same thing in both places. Nothing here is behind a paywall."
      />

      {/*
        The page is 39 cards in four groups — long enough that the group
        headings scroll away and the only way to reach "More" was to drag
        through everything above it. This bar keeps the categories reachable.
        It sits under the site header, which is `sticky top-0 ... h-16`, so
        `top-16` is the offset that parks it directly beneath.
      */}
      {groups.length > 0 ? (
        <nav
          aria-label="Jump to a feature category"
          className="sticky top-16 z-40 border-b border-border bg-background/85 backdrop-blur-md"
        >
          <Container>
            <ul className="flex flex-wrap items-center gap-x-1 py-1.5">
              {groups.map((group) => (
                <li key={group.name}>
                  <a
                    href={`#group-${slugify(group.name)}`}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {group.name}
                    <span className="text-xs tabular-nums opacity-60">
                      {group.items.length}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      ) : null}

      {highlights.length > 0 ? (
        <Section className="border-b border-border bg-muted/40 !py-10">
          <Container>
            {/*
              This used to reuse the eyebrow style — `text-xs uppercase` — but
              it is the section's only heading, not a label above a larger one,
              so it read as metadata and the jump from the h1 was abrupt. It
              now matches the group headings FeatureGroups draws below it.
            */}
            <h2 className="text-lg font-bold tracking-tight">Most used</h2>
            {/*
              `gap-x-2 gap-y-3`: a wrapped row of pills needs more air between
              rows than between neighbours, because the eye reads rows as a
              unit. Equal gaps made the second row look stuck to the first.
            */}
            <div className="mt-4 flex flex-wrap gap-x-2 gap-y-3">
              {highlights.map((feature) => (
                <Link
                  key={feature.id}
                  href={
                    feature.slug
                      ? `/features/${feature.slug}`
                      : `#feature-${feature.id}`
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary dark:hover:text-accent-foreground"
                >
                  <DynamicIcon name={feature.icon} className="h-4 w-4" />
                  {feature.title}
                  {/*
                    A pill is the conventional shape for a filter, and these
                    are links, not filters. The chevron is the cheapest way to
                    say "this navigates" without changing the shape.
                  */}
                  <ChevronRight
                    className="h-3.5 w-3.5 opacity-50"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <FeatureGroups
        features={features}
        appName={appName(settings)}
        showHeading={false}
        detailed
      />

      {featureFaqs.length > 0 ? (
        <div className="border-t border-border bg-muted/40">
          <FaqSection faqs={featureFaqs} showHeading={false} />
        </div>
      ) : null}

      <ClosingCta settings={settings} />
    </>
  )
}
