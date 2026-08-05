import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import { AdminCard } from '@/components/admin/fields'
import { SettingsForm } from '@/components/admin/settings-form'
import {
  DEFAULT_APP_NAME,
  appName,
  getRawSettings,
  getSettings,
} from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'App name' }

/**
 * The one field the whole website takes its own name from. Every page either
 * reads it here in code, or writes `[APP_NAME]` in its text and has it filled in
 * when the page is opened — so renaming the app is this single box.
 *
 * The check further down is the other half of that promise: text typed straight
 * into the dashboard can still spell the name out by hand, and that text would
 * not follow a rename. This page finds it and says which page to go and fix.
 */

/** Where the name shows up, described the way the owner would describe it. */
const APPEARS_IN = [
  'The logo and menu at the top of every page, and the footer',
  'The browser tab, and the blue title Google shows in search results',
  'The preview card when someone pastes the site into WhatsApp',
  'The home page — what the app is for, and why an account is needed',
  'The download and screenshots pages',
  'All four legal pages, wherever [APP_NAME] is written',
  'This dashboard, and the admin sign-in page',
]

/** A content table checked for the name typed out by hand. */
type Source = { table: string; fields: string[]; where: string; href: string }

const SOURCES: Source[] = [
  {
    table: 'web_home_sections',
    fields: ['heading', 'subheading'],
    where: 'Home page — section headings',
    href: '/admin/home',
  },
  {
    table: 'web_features',
    fields: ['group_name', 'title', 'short_description', 'long_description'],
    where: 'Features',
    href: '/admin/features',
  },
  {
    table: 'web_faqs',
    fields: ['question', 'answer'],
    where: 'FAQ',
    href: '/admin/faqs',
  },
  {
    table: 'web_testimonials',
    fields: ['quote'],
    where: 'Student reviews',
    href: '/admin/testimonials',
  },
  {
    table: 'web_stats',
    fields: ['label'],
    where: 'Numbers strip',
    href: '/admin/stats',
  },
  {
    table: 'web_versions',
    fields: ['notes'],
    where: 'Version history',
    href: '/admin/versions',
  },
  {
    table: 'web_screenshots',
    fields: ['title', 'caption'],
    where: 'Screenshots',
    href: '/admin/screenshots',
  },
  {
    table: 'web_posts',
    fields: ['title', 'excerpt', 'content', 'meta_title', 'meta_description'],
    where: 'Blog posts',
    href: '/admin/posts',
  },
  {
    table: 'web_legal_pages',
    fields: ['title', 'content'],
    where: 'Legal pages',
    href: '/admin/legal',
  },
]

/** Which settings row belongs to which page in the menu. */
const SETTINGS_PAGES: Record<string, { where: string; href: string }> = {
  site: { where: 'Site settings — basics', href: '/admin/settings' },
  hero: { where: 'Home page — headline', href: '/admin/home' },
  announcement: { where: 'Announcement bar', href: '/admin/announcement' },
  contact: { where: 'Site settings — contact', href: '/admin/settings' },
  download: { where: 'Site settings — download page', href: '/admin/settings' },
  seo: { where: 'Site settings — search and sharing', href: '/admin/settings' },
  footer: { where: 'Site settings — footer', href: '/admin/settings' },
  about: { where: 'Site settings — about page', href: '/admin/settings' },
  developer: { where: 'Developer details', href: '/admin/developer' },
}

/**
 * Matches the name however it was typed: "One VTU", "OneVTU" and "one vtu" all
 * count, because a rename would leave all three behind.
 */
function brandPattern(name: string): RegExp {
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(words.join('\\s*'), 'gi')
}

/** Every string inside a settings row, however deeply nested. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(strings)
  }
  return []
}

type Finding = { where: string; href: string; count: number }

/**
 * Counts the places the name is written out instead of `[APP_NAME]`. One entry
 * per dashboard page, so the owner is told where to go rather than which table
 * to look in. `site.name` is skipped: it is the box itself.
 */
async function findLiterals(name: string): Promise<Finding[]> {
  const pattern = brandPattern(name)
  const hits = (text: string) => text.match(pattern)?.length ?? 0
  const supabase = await createClient()
  const found = new Map<string, Finding>()

  const add = (where: string, href: string, count: number) => {
    if (count === 0) return
    const existing = found.get(where)
    if (existing) existing.count += count
    else found.set(where, { where, href, count })
  }

  const [settings, ...tables] = await Promise.all([
    supabase.from('web_settings').select('key, value'),
    ...SOURCES.map((source) =>
      supabase.from(source.table).select(source.fields.join(',')),
    ),
  ])

  for (const row of settings.data ?? []) {
    const page = SETTINGS_PAGES[row.key as string]
    if (!page) continue

    let value = row.value as unknown
    if (row.key === 'site' && value && typeof value === 'object') {
      const rest = { ...(value as Record<string, unknown>) }
      delete rest.name
      value = rest
    }

    add(
      page.where,
      page.href,
      strings(value).reduce((total, text) => total + hits(text), 0),
    )
  }

  tables.forEach((result, index) => {
    const source = SOURCES[index]
    const rows = (result.data ?? []) as unknown as Record<string, unknown>[]
    let count = 0
    for (const row of rows) {
      for (const field of source.fields) {
        const value = row[field]
        if (typeof value === 'string') count += hits(value)
      }
    }
    add(source.where, source.href, count)
  })

  return [...found.values()].sort((a, b) => b.count - a.count)
}

export default async function AdminAppNamePage() {
  // The form edits the stored value; the preview shows the resolved one, which
  // is what a visitor actually reads.
  const [settings, resolved] = await Promise.all([
    getRawSettings(),
    getSettings(),
  ])
  const name = appName(resolved)
  const literals = await findLiterals(name)
  const total = literals.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-4">
      <AdminCard title="One name, used everywhere">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            What you type below is the name the whole website calls the app. The
            header, the browser tab, the Google search result, the home page and
            all four legal pages read it from here, so changing it here changes
            every one of them{' '}
            <strong className="text-foreground">on the next page load</strong> —
            nothing to edit, nothing to deploy.
          </p>
          <p>
            Writing your own text anywhere else in the dashboard? Type{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">
              [APP_NAME]
            </code>{' '}
            instead of the name and that text follows this box too.
          </p>
          <p>
            Keep it identical to the app name in your Play Console and on your
            Google sign-in consent screen. Google compares the three, and rejects
            the app when they disagree.
          </p>
        </div>
      </AdminCard>

      <AdminCard
        title="What the site is calling itself right now"
        description="This is the exact spelling every page below is using."
      >
        <p className="text-2xl font-bold">{name}</p>
        {settings.site.name.trim() ? null : (
          <p className="mt-1 text-xs text-muted-foreground">
            The box is empty, so the site is falling back to{' '}
            {DEFAULT_APP_NAME}.
          </p>
        )}
        <ul className="mt-4 space-y-1.5">
          {APPEARS_IN.map((place) => (
            <li
              key={place}
              className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
            >
              <span aria-hidden className="text-primary">
                •
              </span>
              {place}
            </li>
          ))}
        </ul>
      </AdminCard>

      {literals.length > 0 ? (
        <AdminCard
          title={`Written out by hand in ${literals.length} place${literals.length === 1 ? '' : 's'}`}
          description={`The name is typed into your own content ${total} time${total === 1 ? '' : 's'}. Those words are not wrong today, but they would stay behind if you rename the app. Replace each one with [APP_NAME] when you next edit the page.`}
        >
          <ul className="space-y-2">
            {literals.map((item) => (
              <li key={item.where}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 transition-colors hover:border-primary"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <TriangleAlert className="h-4 w-4 shrink-0 text-amber-500" />
                    {item.where}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.count} {item.count === 1 ? 'time' : 'times'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : (
        <AdminCard title="Nothing is spelling the name out by hand">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Every page takes the name from this box. Rename the app and the whole
            website follows.
          </p>
        </AdminCard>
      )}

      <SettingsForm
        settingsKey="site"
        initial={settings.site as unknown as Record<string, unknown>}
        groups={[
          {
            title: 'The name',
            description:
              'Written exactly as you want it read — spaces, capitals and all.',
            fields: [
              {
                name: 'name',
                label: 'App name',
                type: 'text',
                half: true,
                maxLength: 40,
                placeholder: DEFAULT_APP_NAME,
                help: `Leave it empty and the site falls back to ${DEFAULT_APP_NAME}.`,
              },
            ],
          },
        ]}
      />
    </div>
  )
}
