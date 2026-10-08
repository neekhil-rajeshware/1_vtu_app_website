import type { Metadata } from 'next'
import { AccountAndData } from '@/components/sections/account-and-data'
import { AutonomousApp } from '@/components/sections/autonomous-app'
import { BlogTeaser } from '@/components/sections/blog-teaser'
import { ClosingCta } from '@/components/sections/closing-cta'
import { FaqSection } from '@/components/sections/faq'
import { FeatureGroups } from '@/components/sections/feature-groups'
import { Hero } from '@/components/sections/hero'
import { Highlights } from '@/components/sections/highlights'
import { HowItWorks } from '@/components/sections/how-it-works'
import { PaperHubs } from '@/components/sections/paper-hubs'
import { ScreenshotShowcase } from '@/components/sections/screenshot-showcase'
import { StatsStrip } from '@/components/sections/stats-strip'
import { Testimonials } from '@/components/sections/testimonials'
import { WhyUs } from '@/components/sections/why-us'
import { JsonLd } from '@/components/json-ld'
import {
  getFaqs,
  getFeatures,
  getHighlightFeatures,
  getHomeSections,
  getPublishedPosts,
  getScreenshots,
  getStats,
  getTestimonials,
  getVersions,
} from '@/lib/content'
import { getCoverage } from '@/lib/coverage'
import { mobileApplicationJsonLd, pageMetadata } from '@/lib/seo'
import { appName, getSettings } from '@/lib/settings'

/**
 * No `title`, deliberately: the root layout's `title.default` is the site
 * title, and passing one here would run it through the `%s — App` template and
 * produce "One VTU — One VTU".
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return pageMetadata({
    description:
      settings.seo.default_description || settings.site.short_description,
    path: '/',
  })
}

export default async function HomePage() {
  const [
    settings,
    sections,
    stats,
    highlights,
    features,
    screenshots,
    testimonials,
    faqs,
    posts,
    versions,
    coverage,
  ] = await Promise.all([
    getSettings(),
    getHomeSections(),
    getStats(),
    getHighlightFeatures(),
    getFeatures(),
    getScreenshots(),
    getTestimonials(),
    getFaqs(),
    getPublishedPosts(3),
    getVersions(),
    /*
     * `getStats()` above already reads this, and `getCoverage` is wrapped in
     * React's `cache()`, so the second call is the same request's result and
     * not a second round trip. Calling it directly is how the paper band gets
     * live counts instead of typed ones.
     */
    getCoverage(),
  ])

  // Sections can be hidden individually from Admin -> Home Page.
  const visible = (key: string) => sections[key]?.is_visible !== false

  const name = appName(settings)

  // `getVersions` orders by sort_order ascending, which the admin page defines
  // as newest first, so the head of the list is the current release.
  const latestVersion = versions[0]?.version

  // Built in `lib/seo` because the download page emits the same entity.
  const appJsonLd = mobileApplicationJsonLd(settings, latestVersion)

  return (
    <>
      {visible('hero') ? <Hero settings={settings} /> : null}
      {visible('stats') ? <StatsStrip stats={stats} /> : null}
      {/*
        Kept high on the page on purpose: this is where both a student and
        Google's OAuth reviewer find out what the app is and what it does with
        a Google account, without having to scroll for it.
      */}
      {visible('account') ? (
        <AccountAndData section={sections.account} settings={settings} />
      ) : null}
      {visible('highlights') ? (
        <Highlights section={sections.highlights} features={highlights} />
      ) : null}
      {/*
        Above the fold-ish on purpose. "VTU question papers" and "GATE previous
        year papers" are the phrases people actually arrive on, and before this
        band existed the only path to either hub was two clicks deep through
        /coverage.
      */}
      {visible('papers') ? (
        <PaperHubs
          section={sections.papers}
          gateDocuments={coverage?.snapshot.gate.documents ?? null}
          vtuDocuments={coverage?.snapshot.pyq.documents ?? null}
        />
      ) : null}
      {visible('screenshots') ? (
        <ScreenshotShowcase section={sections.screenshots} screenshots={screenshots} />
      ) : null}
      {visible('how') ? <HowItWorks section={sections.how} /> : null}
      {visible('why') ? <WhyUs section={sections.why} appName={name} /> : null}
      {visible('features') ? (
        <FeatureGroups
          section={sections.features}
          features={features}
          appName={name}
        />
      ) : null}
      {visible('testimonials') ? (
        <Testimonials section={sections.testimonials} testimonials={testimonials} />
      ) : null}
      {visible('blog') ? <BlogTeaser section={sections.blog} posts={posts} /> : null}
      {visible('faq') ? (
        <FaqSection section={sections.faq} faqs={faqs} grouped emitJsonLd />
      ) : null}
      {/*
        Last before the closing CTA: this is the one band on the page that is
        not about the app the page is selling, so it reads as an aside rather
        than interrupting the pitch. Position is the JSX below, not the row's
        `sort_order` — that column only orders the list in Admin → Home page,
        which is why it is kept in step with this order by hand.
      */}
      {visible('autonomous') ? (
        <AutonomousApp section={sections.autonomous} settings={settings} />
      ) : null}
      {visible('cta') ? (
        <ClosingCta section={sections.cta} settings={settings} />
      ) : null}

      <JsonLd data={appJsonLd} />
    </>
  )
}
