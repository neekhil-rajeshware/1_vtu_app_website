import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AdminUser = {
  id: string
  email: string
}

/**
 * Server-side gate for every /admin page. Two checks, on purpose:
 *
 * 1. Is anyone signed in at all?
 * 2. Is that person listed in `web_admins`?
 *
 * The second check runs through the `web_admins` table, whose own policy only
 * lets a signed-in user see their own row. Even if this function were bypassed,
 * every admin table has an RLS policy calling `is_web_admin()`, so a non-admin
 * session cannot read or write anything. This is the convenience layer; the
 * database is the real lock.
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

  return { id: user.id, email: user.email ?? '' }
}
