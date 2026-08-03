import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/utils'

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()

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
