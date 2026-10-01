import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Download } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { DynamicIcon } from '@/components/dynamic-icon'
import { JsonLd } from '@/components/json-ld'
import { PostCard } from '@/components/post-card'
import { ClosingCta } from '@/components/sections/closing-cta'
import { FaqSection } from '@/components/sections/faq'
import { ButtonLink, Container, Section } from '@/components/ui'
import {
  getFeatureBySlug,
  getFeatureFaqs,
  getFeaturesWithPages,
  getHomeSections,
  getPublishedPosts,
  postsForFeature,
} from '@/lib/content'
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from '@/lib/seo'
import { appName, getSettings, publicWebsiteUrl } from '@/lib/settings'

type Params = { params: Promise<{ slug: string }> }

/**
 * One feature's own page, at `/features/<slug>`.
 *
 * Most features are only ever listed on `/features`; a feature appears here
 * once it has a slug. That is deliberate — a page that exists for every one of
 * the 33 features would be 33 near-identical pages competing with each other,
 * which is the thin-content pattern Google demotes. The handful that get a slug
 * are the ones students actually search for by name.
 *
 * No `generateStaticParams`: like every other page on this site, these render
 * per request so a dashboard edit is live on the next load rather than the next
 * deploy.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const feature = await getFeatureBySlug(slug)

  if (!feature || !feature.slug) {
    return { title: 'Feature not found', robots: { index: false, follow: true } }
  }

  const settings = await getSettings()

  return pageMetadata({
    // `seo_title` is the search-facing variant, which usually wants the word
    // "VTU" in it where the in-app feature name does not. The brand is appended
    // by `pageMetadata`, so it must not be typed in here as well.
    title: feature.seo_title || feature.title,
    description:
      feature.seo_description ||
      feature.short_description ||
      settings.seo.default_description,
    path: `/features/${feature.slug}`,
  })
}

export default async function FeaturePage({ params }: Params) {
  const { slug } = await params
  const feature = await getFeatureBySlug(slug)

  if (!feature || !feature.slug) notFound()

  const [settings, faqs, allWithPages, sections, posts] = await Promise.all([
    getSettings(),
    getFeatureFaqs(feature.slug),
    getFeaturesWithPages(),
    getHomeSections(),
    getPublishedPosts(),
  ])

  const name = appName(settings)
  const base = publicWebsiteUrl(settings)
  const path = `/features/${feature.slug}`

  /*
   * Other features that have pages, so each one links onward instead of being a
   * dead end. Siblings first: "AI Professor" and "AI Notebook" are the pair a
   * reader actually wants next, where the first three by `sort_order` would put
   * the same three links on all nine pages — a block a crawler reads as
   * boilerplate rather than as a link. Three is enough; this is a trail, not a
   * directory.
   */
  const others = allWithPages.filter((item) => item.slug !== feature.slug)
  const related = [
    ...others.filter((item) => item.group_name === feature.group_name),
    ...others.filter((item) => item.group_name !== feature.group_name),
  ].slice(0, 3)

  // Posts whose tags name this feature — the reverse of the block a post shows.
  // Usually empty for a feature nothing has been written about yet, and an empty
  // list renders nothing rather than a filler link.
  const postsHere = postsForFeature(feature, posts).slice(0, 3)

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: feature.title, path },
  ]

  /*
   * `isPartOf` and `about` point at the site's own WebSite and MobileApplication
   * nodes by `@id` rather than drawing new anonymous ones. Two nodes with no
   * `@id` are two different entities to a crawler, so the old version told it
   * about nine WebSites and nine apps — one per feature page — none of which was
   * the one declared on the home page.
   */
  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: feature.seo_title || feature.title,
    description: feature.seo_description || feature.short_description || undefined,
    url: absoluteUrl(base, path),
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${base}/#website` },
    about: { '@id': `${base}/#app` },
  }

  return (
    <>
      <JsonLd data={webPageJsonLd} />
      <JsonLd data={breadcrumbJsonLd(base, crumbs)} />

      <div className="border-b border-border bg-muted/40">
        <Container className="py-10 sm:py-14">
          <div className="max-w-3xl animate-rise">
            <Breadcrumbs crumbs={crumbs} />

            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-foreground">
                <DynamicIcon name={feature.icon} className="h-5 w-5" />
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                {feature.group_name}
              </p>
            </div>

            <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {feature.title}
            </h1>

            {feature.short_description ? (
              <p className="mt-4 text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
                {feature.short_description}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={settings.download.play_store_url || undefined}
                size="lg"
                unavailableTitle="Launching on Google Play soon"
              >
                <Download className="h-[1.15rem] w-[1.15rem]" />
                Get {name} free
              </ButtonLink>
              <ButtonLink href="/features" variant="outline" size="lg">
                All features
                <ArrowRight className="h-[1.15rem] w-[1.15rem]" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
            <div>
              {feature.page_intro ? (
                /*
                 * Authored in the dashboard as HTML, the same way blog posts
                 * are. Starts at `<h2>` because the page header above already
                 * carries the `<h1>`.
                 */
                <div
                  className="prose-brand"
                  dangerouslySetInnerHTML={{ __html: feature.page_intro }}
                />
              ) : null}

              {feature.long_description ? (
                <p className="mt-6 max-w-[72ch] text-[0.975rem] leading-relaxed text-muted-foreground">
                  {feature.long_description}
                </p>
              ) : null}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {feature.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={feature.image_url}
                  alt={`${feature.title} in ${name}`}
                  className="w-full rounded-2xl border border-border"
                  loading="lazy"
                />
              ) : null}

              {related.length > 0 ? (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Also in the app
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {related.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/features/${item.slug}`}
                          className="group flex items-start gap-2.5 text-sm font-semibold leading-snug transition-colors hover:text-primary dark:hover:text-accent-foreground"
                        >
                          <DynamicIcon
                            name={item.icon}
                            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                          />
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-2xl border border-border bg-muted/50 p-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Every feature is free. Nothing on this page is behind a
                  paywall or a subscription.
                </p>
                <Link
                  href="/download"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-accent-foreground"
                >
                  How to get it
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {postsHere.length > 0 ? (
        <Section className="border-t border-border">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  From the blog
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  How {feature.title} works
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-accent-foreground"
              >
                All posts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {postsHere.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {faqs.length > 0 ? (
        <div className="border-t border-border bg-muted/40">
          <FaqSection
            faqs={faqs}
            showHeading={false}
            heading={`${feature.title}: common questions`}
            emitJsonLd
          />
        </div>
      ) : null}

      <ClosingCta section={sections.cta} settings={settings} />
    </>
  )
}
