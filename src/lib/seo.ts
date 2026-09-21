import type { Metadata } from 'next'
import { appName, getSettings, publicWebsiteUrl, type AllSettings } from '@/lib/settings'

/**
 * Metadata and structured data for the public pages, in one place.
 *
 * This exists because of how Next merges metadata down the tree: a child that
 * sets only `title` still inherits the root layout's entire `openGraph` object,
 * because `openGraph` is replaced wholesale rather than merged field by field.
 * So every page on this site used to advertise the *home page's* title,
 * description and url when its link was pasted into WhatsApp, X or Slack —
 * `/features`, `/download` and `/about` were all showing the same card. Routing
 * every page through `pageMetadata` is what keeps the card honest.
 */

/**
 * Metadata for one public page. `path` is both the canonical and the og:url, and
 * must start with `/` (`'/'` for the home page).
 *
 * Passing no `title` means "use the site default", which is what the home page
 * wants: the root layout's `%s — App` template would otherwise turn it into
 * "One VTU — One VTU".
 */
export async function pageMetadata({
  title,
  description,
  path,
  type = 'website',
}: {
  title?: string
  description: string
  path: string
  type?: 'website' | 'article'
}): Promise<Metadata> {
  const settings = await getSettings()
  const { seo, site } = settings
  const base = publicWebsiteUrl(settings)
  const name = appName(settings)

  // Falls back to the drawn card at /og so a shared link is never a bare
  // rectangle, even before a sharing image is uploaded.
  const shareImage = seo.og_image_url || `${base}/og`
  const url = absoluteUrl(base, path)

  // `openGraph.title` and `twitter.title` do NOT get the root layout's `%s`
  // template applied — only `title` does — so the branded string is built here
  // by hand. Without this a shared /features link is headed just "Features".
  // `||` rather than `??` throughout: an unset setting comes back as `''`, which
  // is a perfectly good string as far as `??` is concerned.
  const socialTitle = title
    ? `${title} — ${name}`
    : seo.default_title || [name, site.tagline].filter(Boolean).join(' — ')

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: name,
      url,
      title: socialTitle,
      description,
      images: [{ url: shareImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [shareImage],
    },
  }
}

/** Joins a site base and a page path into one absolute URL. */
export function absoluteUrl(base: string, path: string) {
  if (path === '/' || path === '') return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

type Crumb = { name: string; path: string }

/**
 * A breadcrumb trail, always starting from the home page.
 *
 * Only worth emitting where the page is genuinely nested or where the trail
 * tells a searcher something the URL does not — Google renders the trail in the
 * result snippet, so a two-item "Home > Features" on a top-level page adds
 * nothing and is deliberately not emitted for top-level pages.
 */
export function breadcrumbJsonLd(base: string, crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(base, crumb.path),
    })),
  }
}

/**
 * Who publishes the app. Emitted site-wide from the root layout so every page
 * carries it.
 *
 * Deliberately thin: it names the organisation, points at the logo, and lists
 * the profiles the footer already links to, and nothing else. A
 * `PostalAddress` or `telephone` here would have to come from the `developer`
 * settings row, which ships empty by design — and an `Organization` with blank
 * fields is worse than one without them.
 */
export function organizationJsonLd(settings: AllSettings, base: string) {
  const { site, social } = settings

  /*
   * `sameAs` is how a search engine ties the YouTube, Instagram and other
   * accounts the footer already links to this domain as ONE entity, instead of
   * deciding for itself whether they are related. Every value here is already
   * on the page, so this claims nothing new — it just says it in a form a
   * crawler can read.
   */
  const sameAs = Object.values(social).filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: appName(settings),
    url: base,
    ...(site.logo_url ? { logo: site.logo_url } : {}),
    ...(site.short_description ? { description: site.short_description } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

/**
 * The app itself, as a schema entity.
 *
 * Lives here rather than inline on the home page because the download page
 * needs the identical block — it is the install page, and a crawler that lands
 * there should find the same app entity it would find on the home page. Two
 * hand-written copies of one entity is how the version number comes to disagree
 * with itself.
 *
 * Every optional field is spread conditionally: an `installUrl` of `''` is a
 * broken link in a rich result, which is worse than an absent one.
 */
export function mobileApplicationJsonLd(
  settings: AllSettings,
  latestVersion?: string | null,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: appName(settings),
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
}

/**
 * The site itself, so Google can tie the domain to the app name rather than
 * guessing it from the title tag.
 *
 * No `potentialAction`/`SearchAction`: this site has no search page, and
 * declaring a search endpoint that does not exist is a structured-data error,
 * not a bonus.
 */
export function websiteJsonLd(settings: AllSettings, base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: appName(settings),
    url: base,
    inLanguage: 'en-IN',
  }
}
