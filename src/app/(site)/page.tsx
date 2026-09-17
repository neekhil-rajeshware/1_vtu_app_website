import type { Metadata } from 'next'
import { AccountAndData } from '@/components/sections/account-and-data'
import { BlogTeaser } from '@/components/sections/blog-teaser'
import { ClosingCta } from '@/components/sections/closing-cta'
import { FaqSection } from '@/components/sections/faq'
import { FeatureGroups } from '@/components/sections/feature-groups'
import { Hero } from '@/components/sections/hero'
import { Highlights } from '@/components/sections/highlights'
import { HowItWorks } from '@/components/sections/how-it-works'
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
import { pageMetadata } from '@/lib/seo'
import { appName, getSettings, publicWebsiteUrl } from '@/lib/settings'

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
  ])

  // Sections can be hidden individually from Admin -> Home Page.
  const visible = (key: string) => sections[key]?.is_visible !== false

  const name = appName(settings)

  // `getVersions` orders by sort_order ascending, which the admin page defines
  // as newest first, so the head of the list is the current release.
  const latestVersion = versions[0]?.version

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name,
    description: settings.seo.default_description || settings.site.short_description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Android',
    // `publicWebsiteUrl` (the domain in Site settings) rather than `siteUrl()`
    // (an env var): the owner can change the domain without a deploy, and two
    // different notions of "our own address" on one page is how canonicals
    // drift apart.
    url: publicWebsiteUrl(settings),
    inLanguage: 'en-IN',
    ...(settings.download.size ? { fileSize: settings.download.size } : {}),
    ...(latestVersion ? { softwareVersion: latestVersion } : {}),
    ...(settings.download.play_store_url
      ? { installUrl: settings.download.play_store_url }
      : {}),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
  }

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
      {visible('faq') ? <FaqSection section={sections.faq} faqs={faqs} /> : null}
      {visible('cta') ? (
        <ClosingCta section={sections.cta} settings={settings} />
      ) : null}

      <JsonLd data={appJsonLd} />
    </>
  )
}
