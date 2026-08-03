import Link from 'next/link'
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Flag,
  Inbox as InboxIcon,
} from 'lucide-react'
import { AdminCard } from '@/components/admin/fields'
import { ADMIN_NAV } from '@/lib/admin/nav'
import { getSettings } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

type Check = {
  done: boolean
  label: string
  detail: string
  href: string
  /** Only the ones Google or the law cares about are marked required. */
  required?: boolean
}

async function count(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  match?: Record<string, unknown>,
) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  if (match) query = query.match(match)
  const { count: total } = await query
  return total ?? 0
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [
    settings,
    features,
    screenshots,
    stats,
    faqs,
    published,
    drafts,
    newMessages,
    newReports,
    legal,
    links,
  ] = await Promise.all([
    getSettings(),
    count(supabase, 'web_features'),
    count(supabase, 'web_screenshots'),
    count(supabase, 'web_stats'),
    count(supabase, 'web_faqs'),
    count(supabase, 'web_posts', { status: 'published' }),
    count(supabase, 'web_posts', { status: 'draft' }),
    count(supabase, 'web_messages', { status: 'new' }),
    count(supabase, 'web_reports', { status: 'new' }),
    supabase.from('web_legal_pages').select('slug, content'),
    supabase.from('app_links').select('key, url, is_active'),
  ])

  // Blanks left in the legal text that the owner has to fill in by hand.
  const autoFilled = ['[APP_NAME]', '[SUPPORT_EMAIL]', '[WEBSITE]', '[DEVELOPER_NAME]']
  const blanks = new Set<string>()
  for (const page of (legal.data ?? []) as { slug: string; content: string }[]) {
    for (const token of page.content.match(/\[[A-Z][A-Z_ ]{2,}\]/g) ?? []) {
      if (!autoFilled.includes(token)) blanks.add(token)
    }
  }

  const linkFor = (key: string) => {
    const row = ((links.data ?? []) as { key: string; url: string; is_active: boolean }[]).find(
      (item) => item.key === key,
    )
    return row && row.is_active && row.url.trim() ? row.url.trim() : ''
  }

  const checks: Check[] = [
    {
      done: Boolean(settings.contact.support_email),
      label: 'Add your support email',
      detail:
        'Used on the contact page, in the footer, and inside your legal pages. Google needs a way to reach you.',
      href: '/admin/settings',
      required: true,
    },
    {
      done: Boolean(settings.download.play_store_url),
      label: 'Paste your Play Store link',
      detail: 'Every Download button on the site points here.',
      href: '/admin/settings',
      required: true,
    },
    {
      done: Boolean(linkFor('delete_account')),
      label: 'Set the “delete my account” link inside the app',
      detail:
        'Google checks this. Without it, the Delete account button in the app goes nowhere.',
      href: '/admin/app-links',
      required: true,
    },
    {
      done: Boolean(linkFor('privacy_policy')),
      label: 'Point the app at your privacy policy',
      detail: 'Shown next to the tick box people accept when they sign in.',
      href: '/admin/app-links',
      required: true,
    },
    {
      done: blanks.size === 0,
      label: 'Fill in the blanks in your legal pages',
      detail:
        blanks.size === 0
          ? 'Nothing left in brackets.'
          : `Still to replace: ${Array.from(blanks).join(', ')}`,
      href: '/admin/legal',
      required: true,
    },
    {
      done: Boolean(settings.adstxt.content.trim()),
      label: 'Add your app-ads.txt line',
      detail:
        'AdMob reads it from your domain. Until it is there, your ad earnings can be limited.',
      href: '/admin/ads-txt',
      required: true,
    },
    {
      done: screenshots > 0,
      label: 'Upload some screenshots',
      detail: 'The home page and the screenshots page both look empty without them.',
      href: '/admin/screenshots',
    },
    {
      done: features > 0,
      label: 'Check your feature list',
      detail: 'Already filled in for you — read it through and fix anything that has changed.',
      href: '/admin/features',
    },
    {
      done: Boolean(settings.site.logo_url),
      label: 'Upload your app icon as the logo',
      detail: 'Appears in the header, the footer, and when someone shares a link.',
      href: '/admin/settings',
    },
    {
      done: Boolean(settings.seo.og_image_url),
      label: 'Add a sharing image',
      detail: 'The picture that shows up when your link is pasted into WhatsApp.',
      href: '/admin/settings',
    },
  ]

  const outstanding = checks.filter((check) => !check.done)
  const requiredLeft = outstanding.filter((check) => check.required).length

  return (
    <div className="space-y-4">
      {newMessages > 0 || newReports > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {newMessages > 0 ? (
            <Link
              href="/admin/messages"
              className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary/60"
            >
              <InboxIcon className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {newMessages} new message{newMessages === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sent through the contact form.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ) : null}
          {newReports > 0 ? (
            <Link
              href="/admin/reports"
              className="flex items-center gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4 transition-colors hover:border-secondary/60"
            >
              <Flag className="h-5 w-5 shrink-0 text-secondary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {newReports} report{newReports === 1 ? '' : 's'} waiting
                </p>
                <p className="text-xs text-muted-foreground">
                  Aim to answer these within 48 hours.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <AdminCard
        title={
          outstanding.length === 0
            ? 'Everything is set up'
            : `${outstanding.length} thing${outstanding.length === 1 ? '' : 's'} left to do`
        }
        description={
          outstanding.length === 0
            ? 'Nothing is waiting on you. Come back here whenever you want to check.'
            : requiredLeft > 0
              ? `${requiredLeft} of these are needed before you publish on the Play Store.`
              : 'None of these are urgent — they just make the site look finished.'
        }
      >
        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.label}>
              <Link
                href={check.href}
                className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60"
              >
                {check.done ? (
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <CircleAlert
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      check.required ? 'text-secondary' : 'text-muted-foreground'
                    }`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      check.done ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {check.label}
                    {check.required && !check.done ? (
                      <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-secondary">
                        Needed
                      </span>
                    ) : null}
                  </p>
                  {!check.done ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {check.detail}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </AdminCard>

      <AdminCard title="What is on the site right now">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Features', value: features },
            { label: 'Screenshots', value: screenshots },
            { label: 'Numbers', value: stats },
            { label: 'FAQs', value: faqs },
            { label: 'Posts live', value: published },
            { label: 'Drafts', value: drafts },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-muted/30 px-3 py-2.5"
            >
              <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-xl font-black">{item.value}</dd>
            </div>
          ))}
        </dl>
        <a
          href={siteUrl()}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Open the live site
        </a>
      </AdminCard>

      <AdminCard
        title="Everything you can change"
        description="Nothing here needs code. If you are unsure, open it and read the note at the top of the page."
      >
        <div className="space-y-4">
          {ADMIN_NAV.filter((group) => group.title !== 'Overview').map((group) => (
            <div key={group.title}>
              <p className="text-[0.7rem] font-bold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
              <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 transition-colors hover:border-primary/40"
                    >
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="block text-xs leading-relaxed text-muted-foreground">
                          {item.hint}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  )
}
