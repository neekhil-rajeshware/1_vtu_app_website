import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Where the password-reset email lands. Supabase sends a one-time token here;
 * we exchange it for a session and then send the admin on to set a new
 * password. Nothing here can create an account — the token has to match a user
 * that already exists.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')
  const destination =
    next && next.startsWith('/admin') ? next : '/admin/account?recovery=1'

  if (!token_hash || !type) {
    redirect('/admin/login?error=link-invalid')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error) {
    redirect('/admin/login?error=link-expired')
  }

  redirect(destination)
}
