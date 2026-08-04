import Link from 'next/link'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import { AdminCard } from '@/components/admin/fields'
import { getSettings, unresolvedPlaceholders } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/utils'
import type { LegalPage } from '@/lib/content'

export const metadata = { title: 'Legal pages' }

/** The order people expect to see them in, plus a plain-English reason each exists. */
const WHY: Record<string, string> = {
  'privacy-policy':
    'Required by Google Play. The exact link you paste into the Play Console.',
  terms: 'The rules people agree to by using the app.',
  'community-guidelines':
    'What is and is not allowed in the marketplace. Backs up your moderation decisions.',
  'delete-account':
    'Required by Google Play. Explains how someone deletes their account and data.',
}

const ORDER = ['privacy-policy', 'terms', 'community-guidelines', 'delete-account']

export default async function AdminLegalPage() {
  const supabase = await createClient()
  const [{ data }, settings] = await Promise.all([
    supabase.from('web_legal_pages').select('*'),
    getSettings(),
  ])

  const pages = ((data ?? []) as LegalPage[]).sort(
    (a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug),
  )

  const base = siteUrl().replace(/^https?:\/\//, '')

  return (
    <div className="space-y-4">
      <AdminCard title="About these four pages">
        <p className="text-sm leading-relaxed text-muted-foreground">
          These are already written for you. Open one only when something real
          changes — a new email address, a new feature that collects different
          information, a new rule you want to enforce. If you edit the Privacy
          Policy in a way that changes what you collect, change the date at the
          top too.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your name, address, contact details and governing law are not written
          into these pages — they come from{' '}
          <Link
            href="/admin/developer"
            className="font-semibold text-primary hover:underline"
          >
            Developer details
          </Link>{' '}
          and are filled in every time a page is opened. Change them there once
          and all four pages follow.
        </p>
      </AdminCard>

      <ul className="space-y-3">
        {pages.map((page) => {
          const blanks = unresolvedPlaceholders(page.content, settings)

          return (
            <li key={page.slug}>
              <Link
                href={`/admin/legal/${page.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{page.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {WHY[page.slug] ?? `/${page.slug}`}
                  </p>
                  <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
                    Updated{' '}
                    {new Date(page.updated_at).toLocaleDateString('en-GB', {
                      dateStyle: 'medium',
                    })}{' '}
                    · {base}/{page.slug}
                  </p>
                  {blanks.length > 0 ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-secondary/10 px-2 py-1 text-[0.7rem] font-semibold text-secondary">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      {blanks.length} blank{blanks.length === 1 ? '' : 's'} left to fill in
                    </p>
                  ) : null}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
