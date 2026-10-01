import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy-session'

/**
 * Runs before every request to /admin: refreshes the admin's Supabase session
 * and redirects signed-out visitors to the login page.
 *
 * (Next.js 16 renamed the old `middleware` file convention to `proxy`.)
 */
export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

/*
 * `/admin` and everything under it — and nothing else.
 *
 * This used to match every path except static files, which meant each public
 * pageview, and each hit from a crawler, paid a network round-trip to Supabase
 * Auth from `supabase.auth.getUser()` before the page began rendering. Two costs,
 * and neither bought anything:
 *
 * - **Latency on the critical path.** The round-trip sits in front of the first
 *   byte of every response, including `/robots.txt`, `/sitemap.xml` and
 *   `/llms.txt`, which the proxy returned unchanged anyway.
 * - **No caching.** When a session cookie is present, `updateSession` writes a
 *   refreshed cookie onto the response, and a response carrying `Set-Cookie` is
 *   not stored by a shared CDN cache. So a signed-in admin browsing the public
 *   site made those pages uncacheable for everyone behind the same edge.
 *
 * Only `/admin` is authenticated. `auth/confirm` sets its own cookies through
 * `next/headers` rather than relying on this file, and a session is refreshed on
 * the way into `/admin`, which is the only place that needs one.
 */
export const config = {
  matcher: ['/admin/:path*'],
}
