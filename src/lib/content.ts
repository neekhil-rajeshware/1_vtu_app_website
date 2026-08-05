import { bundledScreenshots } from '@/lib/app-screens'
import { fillPlaceholders, getRawSettings, getSetting } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'

/** Row shapes for the `web_*` content tables the public site reads. */

export type Feature = {
  id: string
  group_name: string
  title: string
  short_description: string | null
  long_description: string | null
  icon: string | null
  image_url: string | null
  is_highlight: boolean
  is_active: boolean
  sort_order: number
}

export type Screenshot = {
  id: string
  title: string
  caption: string | null
  image_url: string
  category: string
  is_active: boolean
  sort_order: number
}

export type Post = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  tags: string[] | null
  status: 'draft' | 'published'
  published_at: string | null
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export type Faq = {
  id: string
  question: string
  answer: string
  category: string
  is_active: boolean
  sort_order: number
}

export type Testimonial = {
  id: string
  student_name: string
  branch: string | null
  college: string | null
  quote: string
  avatar_url: string | null
  rating: number
  is_active: boolean
  sort_order: number
}

export type Stat = {
  id: string
  label: string
  value: string
  icon: string
  is_active: boolean
  sort_order: number
}

export type AppVersion = {
  id: string
  version: string
  release_date: string | null
  notes: string
  is_active: boolean
  sort_order: number
}

export type HomeSection = {
  id: string
  section_key: string
  name: string
  heading: string | null
  subheading: string | null
  is_visible: boolean
  sort_order: number
  extra: Record<string, unknown>
}

export type LegalPage = {
  slug: string
  title: string
  content: string
  updated_at: string
}

/**
 * All reads below go through the publishable key, so Row Level Security decides
 * what comes back: only active rows and published posts are readable by the
 * public. Every helper returns [] (or null) on failure instead of throwing, so
 * one empty table can never take the whole page down.
 *
 * Text fields pass through `withTokens`, so anything typed in the dashboard may
 * use `[APP_NAME]`, `[SUPPORT_EMAIL]` or `[WEBSITE]` and follows Admin → App
 * name instead of spelling the app out in every row.
 */

async function withTokens<T extends object>(
  rows: T[],
  fields: Array<keyof T>,
): Promise<T[]> {
  const settings = await getRawSettings()

  return rows.map((row) => {
    const copy = { ...row }
    for (const field of fields) {
      const value = copy[field]
      if (typeof value === 'string') {
        copy[field] = fillPlaceholders(value, settings) as T[keyof T]
      }
    }
    return copy
  })
}

const FEATURE_TEXT: Array<keyof Feature> = [
  'group_name',
  'title',
  'short_description',
  'long_description',
]

export async function getFeatures(): Promise<Feature[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_features')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('title')
  return withTokens((data as Feature[]) ?? [], FEATURE_TEXT)
}

export async function getHighlightFeatures(): Promise<Feature[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_features')
    .select('*')
    .eq('is_active', true)
    .eq('is_highlight', true)
    .order('sort_order')
  return withTokens((data as Feature[]) ?? [], FEATURE_TEXT)
}

/**
 * Falls back to the screenshots bundled with the site (`src/lib/app-screens.ts`)
 * while `web_screenshots` is still empty, so the gallery is never blank. Adding
 * even one row in Admin -> Screenshots replaces the whole bundled set.
 *
 * While the bundled set is in use, the ones switched off in
 * Admin -> Screenshots (the `screens` settings row) are left out.
 */
export async function getScreenshots(): Promise<Screenshot[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_screenshots')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  const rows = (data as Screenshot[]) ?? []
  if (rows.length > 0) return withTokens(rows, ['title', 'caption'])

  const { hidden } = await getSetting('screens')
  const off = new Set(hidden)
  return bundledScreenshots.filter((shot) => !off.has(shot.id))
}

export async function getFaqs(): Promise<Faq[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_faqs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return withTokens((data as Faq[]) ?? [], ['question', 'answer'])
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_testimonials')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return withTokens((data as Testimonial[]) ?? [], ['quote'])
}

export async function getStats(): Promise<Stat[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_stats')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return withTokens((data as Stat[]) ?? [], ['label'])
}

export async function getVersions(): Promise<AppVersion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_versions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return withTokens((data as AppVersion[]) ?? [], ['notes'])
}

export async function getHomeSections(): Promise<Record<string, HomeSection>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_home_sections')
    .select('*')
    .order('sort_order')

  const rows = await withTokens((data as HomeSection[]) ?? [], [
    'heading',
    'subheading',
  ])

  const map: Record<string, HomeSection> = {}
  for (const row of rows) map[row.section_key] = row
  return map
}

/**
 * Deliberately raw: `LegalPageView` and Admin -> Legal pages resolve the
 * placeholders themselves, because they also have to report the ones still
 * left unfilled. Resolving here would hide them.
 */
export async function getLegalPage(slug: string): Promise<LegalPage | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_legal_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return (data as LegalPage) ?? null
}

const POST_TEXT: Array<keyof Post> = [
  'title',
  'excerpt',
  'content',
  'meta_title',
  'meta_description',
]

export async function getPublishedPosts(limit?: number): Promise<Post[]> {
  const supabase = await createClient()
  let query = supabase
    .from('web_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
  if (limit) query = query.limit(limit)
  const { data } = await query
  return withTokens((data as Post[]) ?? [], POST_TEXT)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (!data) return null
  const [post] = await withTokens([data as Post], POST_TEXT)
  return post
}

/** Groups features in the order the groups first appear. */
export function groupFeatures(features: Feature[]) {
  const groups: Array<{ name: string; items: Feature[] }> = []
  for (const feature of features) {
    let group = groups.find((g) => g.name === feature.group_name)
    if (!group) {
      group = { name: feature.group_name, items: [] }
      groups.push(group)
    }
    group.items.push(feature)
  }
  return groups
}

/** Groups FAQs by their category, preserving sort order. */
export function groupFaqs(faqs: Faq[]) {
  const groups: Array<{ name: string; items: Faq[] }> = []
  for (const faq of faqs) {
    let group = groups.find((g) => g.name === faq.category)
    if (!group) {
      group = { name: faq.category, items: [] }
      groups.push(group)
    }
    group.items.push(faq)
  }
  return groups
}
