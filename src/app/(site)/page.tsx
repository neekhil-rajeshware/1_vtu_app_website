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
import {
  getFaqs,
  getFeatures,
  getHighlightFeatures,
  getHomeSections,
  getPublishedPosts,
  getScreenshots,
  getStats,
  getTestimonials,
} from '@/lib/content'
import { getSettings } from '@/lib/settings'
import { siteUrl } from '@/lib/utils'

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
  ])

  // Sections can be hidden individually from Admin -> Home Page.
  const visible = (key: string) => sections[key]?.is_visible !== false

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: settings.site.name,
    description: settings.seo.default_description || settings.site.short_description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Android',
    url: siteUrl(),
    ...(settings.download.play_store_url
      ? { installUrl: settings.download.play_store_url }
      : {}),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
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
      {visible('why') ? <WhyUs section={sections.why} /> : null}
      {visible('features') ? (
        <FeatureGroups section={sections.features} features={features} />
      ) : null}
      {visible('testimonials') ? (
        <Testimonials section={sections.testimonials} testimonials={testimonials} />
      ) : null}
      {visible('blog') ? <BlogTeaser section={sections.blog} posts={posts} /> : null}
      {visible('faq') ? <FaqSection section={sections.faq} faqs={faqs} /> : null}
      {visible('cta') ? (
        <ClosingCta section={sections.cta} settings={settings} />
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
    </>
  )
}
