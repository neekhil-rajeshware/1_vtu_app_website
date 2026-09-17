import type { Metadata } from 'next'
import Link from 'next/link'
import { FaqSection } from '@/components/sections/faq'
import { FeatureGroups } from '@/components/sections/feature-groups'
import { ClosingCta } from '@/components/sections/closing-cta'
import { DynamicIcon } from '@/components/dynamic-icon'
import { Container, PageHeader, Section } from '@/components/ui'
import { getFaqs, getFeatures, getHighlightFeatures } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { appName, getSettings } from '@/lib/settings'

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

  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Everything the app can do"
        subtitle="Grouped exactly the way the app groups them, so you can find the same thing in both places. Nothing here is behind a paywall."
      />

      {highlights.length > 0 ? (
        <Section className="border-b border-border bg-muted/40 !py-10">
          <Container>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Most used
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
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
