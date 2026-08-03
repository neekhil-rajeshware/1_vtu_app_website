import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy-session'

/**
 * Runs before every page request: refreshes the admin's Supabase session and
 * redirects signed-out visitors away from /admin.
 *
 * (Next.js 16 renamed the old `middleware` file convention to `proxy`.)
 */
export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Everything except static files, images and app-ads.txt, so the admin
     * session is kept alive while browsing.
     */
    '/((?!_next/static|_next/image|favicon.ico|app-ads\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
}
