import type { NextConfig } from 'next'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  images: {
    // AVIF first: the app screenshots are flat UI, which is the case AVIF wins
    // biggest on. Next falls back to WebP for any browser that does not take
    // it, so this costs nothing but a slower first encode per size.
    formats: ['image/avif', 'image/webp'],
    // Screenshots are replaced by uploading a new file, which gets a fresh
    // timestamped Supabase path — so a cached variant is effectively immutable.
    // A week keeps the optimizer from re-encoding the same 49 screens on every
    // deploy while still clearing anything that was replaced in place.
    minimumCacheTTL: 604800,
    // Images uploaded through the admin Media Library live in Supabase storage.
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
