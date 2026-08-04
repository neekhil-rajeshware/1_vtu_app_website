import type { MetadataRoute } from 'next'
import { getSettings, publicWebsiteUrl } from '@/lib/settings'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = publicWebsiteUrl(await getSettings())

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The dashboard is private and has nothing useful for search engines.
        disallow: ['/admin', '/admin/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
