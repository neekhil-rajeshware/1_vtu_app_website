import { getSetting } from '@/lib/settings'

/**
 * Serves /app-ads.txt from the database, so it can be edited in
 * Admin -> app-ads.txt without a redeploy.
 *
 * AdMob and its partner crawlers require this file at the ROOT of the domain
 * you entered as the developer website in your Play Store listing. If your
 * Play listing says `https://onevtu.com`, the crawler fetches
 * `https://onevtu.com/app-ads.txt` — which is exactly this route.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const adstxt = await getSetting('adstxt')
  const body = (adstxt.content ?? '').trim()

  return new Response(body ? `${body}\n` : '', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Short cache: crawlers get updates quickly after you press Save.
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
