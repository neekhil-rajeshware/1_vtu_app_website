import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for use inside Client Components ("use client").
 * Uses the publishable key, so everything it can do is limited by the
 * Row Level Security policies on the database.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
