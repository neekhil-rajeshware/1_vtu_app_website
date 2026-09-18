import type { MetadataRoute } from 'next'
import { getFeaturesWithPages, getPublishedPosts } from '@/lib/content'
import { getSettings, publicWebsiteUrl } from '@/lib/settings'

const STATIC_ROUTES: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/features', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/screenshots', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/download', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/setup', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/community-guidelines', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/report', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/privacy-policy', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/delete-account', priority: 0.5, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicWebsiteUrl(await getSettings())
  const now = new Date()

  /*
   * No `lastModified` on the static routes. These pages are rendered per request
   * and their content lives in the database, so there is no build-time date to
   * report — and stamping every URL with `new Date()` claims all fourteen
   * changed on every single crawl. Google discards a `lastmod` it learns to
   * distrust, which would also throw away the honest ones below.
   */
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${base}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // Posts do have a real edit time, so they get one.
  const posts = await getPublishedPosts()
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at ?? post.published_at ?? now),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  /*
   * Per-feature pages, ranked just under `/features` itself. Only the features
   * carrying a slug have a page, and `getFeaturesWithPages` is what decides
   * that — so clearing a slug in the dashboard retires the URL from here too.
   */
  const features = await getFeaturesWithPages()
  const featureEntries: MetadataRoute.Sitemap = features
    .filter((feature) => feature.slug)
    .map((feature) => ({
      url: `${base}/features/${feature.slug}`,
      changeFrequency: 'monthly',
      priority: 0.8,
    }))

  return [...staticEntries, ...featureEntries, ...postEntries]
}
