import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Where the password-reset email lands. Supabase sends a one-time token here;
 * we exchange it for a session and then send the admin on to set a new
 * password. Nothing here can create an account — the token has to match a user
 * that already exists.
 *
 * The link arrives in one of two shapes, depending on the email template in
 * Supabase, so both are handled:
 *
 * - `?code=…` — the stock template, which routes through Supabase's own
 *   `/auth/v1/verify` first and then sends the browser here.
 * - `?token_hash=…&type=…` — the template from Supabase's SSR guide, which
 *   comes straight here.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const destination =
    next && next.startsWith('/admin') ? next : '/admin/account?recovery=1'

  // An expired or already-used link comes back as an error, not a token.
  if (searchParams.get('error') || searchParams.get('error_code')) {
    redirect('/admin/login?error=link-expired')
  }

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      redirect('/admin/login?error=link-expired')
    }
    redirect(destination)
  }

  if (!token_hash || !type) {
    redirect('/admin/login?error=link-invalid')
  }

  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error) {
    redirect('/admin/login?error=link-expired')
  }

  redirect(destination)
}
