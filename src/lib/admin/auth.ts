import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AdminUser = {
  id: string
  email: string
}

/**
 * Server-side gate for every /admin page. Three checks, on purpose:
 *
 * 1. Is anyone signed in at all?
 * 2. Is that person listed in `web_admins`?
 * 3. Did they finish the second step — a code from their authenticator app?
 *
 * The `web_admins` lookup runs through that table's own policy, which only lets
 * a signed-in user see their own row. It deliberately does *not* require the
 * second step, so an admin who has typed their password but not their code is
 * still recognised as an admin and can be sent to finish signing in, rather
 * than being told they are not one.
 *
 * Everything else is the other way round: `is_web_admin()` — the function every
 * admin table's policy calls — refuses a session that has not been through the
 * authenticator app. Even if this function were bypassed entirely, such a
 * session could not read or write a single row. This is the convenience layer;
 * the database is the real lock.
 *
 * A wrong assurance level is not an attack, though. It is usually a tab left
 * open overnight or a browser closed halfway through signing in, so both
 * failures redirect back to the sign-in page to continue there.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: adminRow } = await supabase
    .from('web_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) {
    redirect('/admin/login?error=not-admin')
  }

  // `enroll()` creates a factor straight away and only marks it verified once
  // the first code checks out, so half-finished setups must not count.
  const hasAuthenticator = (user.factors ?? []).some(
    (factor) => factor.status === 'verified',
  )

  if (!hasAuthenticator) {
    redirect('/admin/login?error=mfa-setup')
  }

  // Read from `getClaims()` rather than the session cookie: it verifies the
  // token's signature, so the level cannot simply be edited in the browser.
  const { data: claims } = await supabase.auth.getClaims()

  if (claims?.claims.aal !== 'aal2') {
    redirect('/admin/login?error=mfa-required')
  }

  return { id: user.id, email: user.email ?? '' }
}
