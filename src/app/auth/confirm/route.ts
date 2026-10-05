import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Where the password-reset email lands. Supabase sends a one-time token here;
 * we exchange it for a session and then send the person on to set a new
 * password — a student to /reset-password, a web admin to their account page.
 * Nothing here can create an account — the token has to match a user that
 * already exists.
 *
 * The link arrives in one of two shapes, depending on the email template in
 * Supabase, so both are handled:
 *
 * - `?token_hash=…&type=…` — the template from Supabase's SSR guide, which
 *   comes straight here. Needs no PKCE verifier, so this is the shape that
 *   works for a link requested from the mobile app.
 * - `?code=…` — the stock template, which routes through Supabase's own
 *   `/auth/v1/verify` first and then sends the browser here. Only redeemable
 *   in the browser that started the flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  // Same-site destinations only — an absolute URL here would bounce the
  // freshly-issued session off to another origin.
  const sameSite =
    next && next.startsWith('/') && !next.startsWith('//') ? next : null
  // Students land on /reset-password; anything admin-shaped keeps its old
  // target, and anything unrecognised falls back to the admin default.
  const destination =
    sameSite &&
    (sameSite === '/reset-password' || sameSite.startsWith('/admin'))
      ? sameSite
      : '/admin/account?recovery=1'

  // A dead link should explain itself where the person was headed. A student
  // left on the admin sign-in page reads it as "this was not meant for me".
  const forStudent = destination === '/reset-password'
  const expiredTo = forStudent
    ? '/reset-password'
    : '/admin/login?error=link-expired'
  const invalidTo = forStudent
    ? '/reset-password'
    : '/admin/login?error=link-invalid'

  // An expired or already-used link comes back as an error, not a token.
  if (searchParams.get('error') || searchParams.get('error_code')) {
    redirect(expiredTo)
  }

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      redirect(expiredTo)
    }
    redirect(destination)
  }

  if (!token_hash || !type) {
    redirect(invalidTo)
  }

  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error) {
    redirect(expiredTo)
  }

  redirect(destination)
}
