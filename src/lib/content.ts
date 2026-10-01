import { bundledScreenshots } from '@/lib/app-screens'
import { coverageMetrics } from '@/lib/coverage'
import { fillPlaceholders, getRawSettings, getSetting } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'

/** Row shapes for the `web_*` content tables the public site reads. */

export type Feature = {
  id: string
  group_name: string
  title: string
  short_description: string | null
  long_description: string | null
  /**
   * Set only on the handful of features that get their own page at
   * `/features/<slug>`. A null slug means "listed on /features only", which is
   * how every feature started — so clearing the field retires a page without
   * touching anything else.
   */
  slug: string | null
  /** The long-form body of that page, as HTML. */
  page_intro: string | null
  seo_title: string | null
  seo_description: string | null
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
  /** Set when the FAQ belongs to one feature's page rather than the whole site. */
  feature_slug: string | null
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
  /**
   * A live counter key from `coverageMetrics()`, or null for a hand-typed
   * number. Only the countable rows have one — "Study tools" and "Unit
   * converters" live in app code and nothing in the database can check them.
   */
  metric: string | null
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
  'page_intro',
  'seo_title',
  'seo_description',
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

/**
 * One feature by its URL slug, for `/features/<slug>`.
 *
 * Returns null both when the slug is unknown and when the feature has been
 * switched off in the dashboard, so a hidden feature 404s rather than quietly
 * staying reachable.
 */
export async function getFeatureBySlug(slug: string): Promise<Feature | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_features')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (!data) return null
  const [feature] = await withTokens([data as Feature], FEATURE_TEXT)
  return feature
}

/** Every feature that has its own page, for the sitemap. */
export async function getFeaturesWithPages(): Promise<Feature[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_features')
    .select('*')
    .eq('is_active', true)
    .not('slug', 'is', null)
    .order('sort_order')
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

/**
 * The site-wide FAQ list, for the home page and `/features`.
 *
 * Feature-scoped rows are filtered out here rather than at each call site: they
 * belong to one landing page, and rendering them globally would put a question
 * like "which VTU scheme does the CGPA calculator use" on the home page.
 */
export async function getFaqs(): Promise<Faq[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_faqs')
    .select('*')
    .eq('is_active', true)
    .is('feature_slug', null)
    .order('sort_order')
  return withTokens((data as Faq[]) ?? [], ['question', 'answer'])
}

/** The FAQs belonging to one feature's landing page. */
export async function getFeatureFaqs(slug: string): Promise<Faq[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('web_faqs')
    .select('*')
    .eq('is_active', true)
    .eq('feature_slug', slug)
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

/**
 * The numbers strip under the hero, and the same strip on `/about`.
 *
 * A row with a `metric` takes its value from the live tables rather than from
 * its typed `value` — the failures this prevents were real: the strip
 * advertised 338 formulas against a table of 6,255, and there was nothing to
 * catch it because nothing compared the two. A metric the helper does not
 * return (offline, or a renamed key) falls back to the typed value rather than
 * rendering an empty tile.
 */
export async function getStats(): Promise<Stat[]> {
  const supabase = await createClient()
  const [{ data }, metrics] = await Promise.all([
    supabase.from('web_stats').select('*').eq('is_active', true).order('sort_order'),
    coverageMetrics(),
  ])

  const stats = await withTokens((data as Stat[]) ?? [], ['label'])

  return stats.map((stat) =>
    stat.metric && metrics[stat.metric] ? { ...stat, value: metrics[stat.metric] } : stat,
  )
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

/**
 * Which feature page a blog tag points at.
 *
 * Tags are free-form text an author typed; feature slugs are stable identifiers.
 * Nothing derives one from the other — "CGPA" and `vtu-cgpa-calculator` share no
 * substring, and "Internal Marks" is not `vtu-internal-marks` — so the
 * relationship is written down. Keys are matched lowercased, because this
 * database stores the same tag as both "fresher" and "Fresher" elsewhere.
 *
 * Deliberately short. A tag earns a rule only when the feature page is what the
 * post is *about*; `Engineering`, `AI` and `Guides` are themes, not features, and
 * mapping them would staple the same link to twenty posts, which is how an
 * internal link stops meaning anything.
 */
const TAG_FEATURE_SLUG: Record<string, string> = {
  cgpa: 'vtu-cgpa-calculator',
  'internal marks': 'vtu-internal-marks',
  attendance: 'vtu-attendance-tracker',
  syllabus: 'vtu-syllabus',
  '2025 scheme': 'vtu-syllabus',
  'vtu 2025 scheme': 'vtu-syllabus',
  results: 'vtu-results',
  revaluation: 'vtu-results',
  rag: 'ai-professor',
}

/**
 * The feature pages a post should link to, in the order `features` was passed.
 *
 * Returns nothing for most posts, and that is the honest answer: a dev diary
 * about TLS in the result fetcher has no tag that names a feature. An empty
 * result renders no block rather than a guessed link.
 */
export function featuresForPost(
  post: Post,
  features: Feature[],
): Array<Feature & { slug: string }> {
  const wanted = new Set(
    (post.tags ?? [])
      .map((tag) => TAG_FEATURE_SLUG[tag.trim().toLowerCase()])
      .filter(Boolean),
  )
  // `getFeatures()` returns every active feature, slugged or not, so the slug
  // has to be re-checked here — and narrowing it in the predicate saves every
  // caller the same `feature.slug!`. A feature with no slug has no page to link
  // to; see the note in `features/[slug]/page.tsx`.
  return features.filter(
    (feature): feature is Feature & { slug: string } =>
      feature.slug !== null && wanted.has(feature.slug),
  )
}

/** The posts that belong on a feature page, newest first. */
export function postsForFeature(feature: Feature, posts: Post[]): Post[] {
  if (!feature.slug) return []
  const tags = new Set(
    Object.entries(TAG_FEATURE_SLUG)
      .filter(([, slug]) => slug === feature.slug)
      .map(([tag]) => tag),
  )
  return posts.filter((post) =>
    (post.tags ?? []).some((tag) => tags.has(tag.trim().toLowerCase())),
  )
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
