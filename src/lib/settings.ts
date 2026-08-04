import { defaultHiddenScreens } from '@/lib/app-screens'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/utils'

/**
 * Every editable block of text on the public site lives in the `web_settings`
 * table as JSON, one row per key. The admin dashboard writes these rows, so
 * nothing here needs a code change to update.
 *
 * Pages read settings through `getSettings()`. Because the site is rendered per
 * request, a change saved in the dashboard shows up on the next page load.
 */

export type SiteSettings = {
  name: string
  tagline: string
  short_description: string
  domain: string
  logo_url: string
  favicon_url: string
}

export type HeroSettings = {
  badge: string
  heading: string
  highlight: string
  subheading: string
  image_url: string
  primary_cta_label: string
  primary_cta_url: string
  secondary_cta_label: string
  secondary_cta_url: string
}

export type AnnouncementSettings = {
  enabled: boolean
  text: string
  link_label: string
  link_url: string
  tone: 'brand' | 'warning' | 'neutral'
}

export type ContactSettings = {
  support_email: string
  whatsapp_url: string
  youtube_url: string
  response_time: string
}

export type SocialSettings = {
  youtube: string
  instagram: string
  twitter: string
  linkedin: string
  telegram: string
  whatsapp: string
}

export type DownloadSettings = {
  play_store_url: string
  qr_image_url: string
  min_android: string
  size: string
  price: string
}

export type SeoSettings = {
  default_title: string
  default_description: string
  og_image_url: string
  ga_measurement_id: string
  google_site_verification: string
}

export type FooterSettings = {
  description: string
  disclaimer: string
  copyright: string
}

export type AboutSettings = {
  heading: string
  story: string
  mission: string
}

export type AdsTxtSettings = {
  content: string
}

/**
 * Who publishes the app, in the sense the law and Google Play mean it. These
 * values are typed once here and appear on every legal page through the
 * placeholders below, so the developer name, address or governing law is never
 * written into the page text itself.
 */
export type DeveloperSettings = {
  legal_name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  governing_law: string
  jurisdiction: string
}

/**
 * Which of the screenshots bundled with the site are switched off. Ids come
 * from `src/lib/app-screens.ts`; anything not listed here is shown.
 */
export type ScreensSettings = {
  hidden: string[]
}

export type AllSettings = {
  site: SiteSettings
  hero: HeroSettings
  announcement: AnnouncementSettings
  contact: ContactSettings
  social: SocialSettings
  download: DownloadSettings
  seo: SeoSettings
  footer: FooterSettings
  about: AboutSettings
  adstxt: AdsTxtSettings
  developer: DeveloperSettings
  screens: ScreensSettings
}

/**
 * Used only if the database is unreachable, so the site still renders
 * something sensible instead of crashing.
 */
export const FALLBACK_SETTINGS: AllSettings = {
  site: {
    name: 'OneVTU',
    tagline: 'Your complete VTU study companion',
    short_description: '',
    domain: '',
    logo_url: '',
    favicon_url: '',
  },
  hero: {
    badge: '',
    heading: 'Everything for your semester,',
    highlight: 'in one app',
    subheading: '',
    image_url: '',
    primary_cta_label: 'Get it on Google Play',
    primary_cta_url: '',
    secondary_cta_label: 'See all features',
    secondary_cta_url: '/features',
  },
  announcement: { enabled: false, text: '', link_label: '', link_url: '', tone: 'brand' },
  contact: { support_email: '', whatsapp_url: '', youtube_url: '', response_time: '' },
  social: { youtube: '', instagram: '', twitter: '', linkedin: '', telegram: '', whatsapp: '' },
  download: { play_store_url: '', qr_image_url: '', min_android: '', size: '', price: '' },
  seo: {
    default_title: 'OneVTU',
    default_description: '',
    og_image_url: '',
    ga_measurement_id: '',
    google_site_verification: '',
  },
  footer: { description: '', disclaimer: '', copyright: 'OneVTU' },
  about: { heading: '', story: '', mission: '' },
  adstxt: { content: '' },
  developer: {
    legal_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    governing_law: '',
    jurisdiction: '',
  },
  screens: { hidden: defaultHiddenScreens },
}

export async function getSettings(): Promise<AllSettings> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('web_settings').select('key, value')

    if (error || !data) return FALLBACK_SETTINGS

    const merged = { ...FALLBACK_SETTINGS } as Record<string, unknown>
    for (const row of data) {
      const key = row.key as keyof AllSettings
      if (key in FALLBACK_SETTINGS && row.value && typeof row.value === 'object') {
        merged[key] = { ...(FALLBACK_SETTINGS[key] as object), ...(row.value as object) }
      }
    }
    return merged as AllSettings
  } catch {
    return FALLBACK_SETTINGS
  }
}

/** Reads a single settings key. */
export async function getSetting<K extends keyof AllSettings>(
  key: K,
): Promise<AllSettings[K]> {
  const all = await getSettings()
  return all[key]
}

/**
 * Placeholders such as [SUPPORT_EMAIL] are left in the seeded legal text on
 * purpose, so they are easy to find. This swaps in the real values from
 * settings wherever they appear.
 */
export function fillPlaceholders(html: string, settings: AllSettings): string {
  const values = placeholderValues(settings)

  // [[ ... ]] marks a detail that only appears once it has been filled in —
  // a phone number, a postal address. Without this an unfilled optional field
  // would publish the raw token, or leave a stray "Phone:" label behind.
  let out = html.replace(/\[\[([\s\S]*?)\]\]/g, (_match, inner: string) =>
    tokensIn(inner).every((token) => values[token]) ? inner : '',
  )

  for (const [token, value] of Object.entries(values)) {
    if (!value) continue
    out = out.split(token).join(value)
  }
  return out
}

/** Every placeholder the legal pages may use, with the value it resolves to. */
export function placeholderValues(settings: AllSettings): Record<string, string> {
  const { site, contact, footer, developer } = settings
  const email = contact.support_email || developer.email

  return {
    '[APP_NAME]': site.name || 'OneVTU',
    '[SUPPORT_EMAIL]': email,
    '[WEBSITE]': publicWebsiteUrl(settings),
    '[DEVELOPER_NAME]': developer.legal_name || footer.copyright || site.name || 'OneVTU',
    '[DEVELOPER_EMAIL]': developer.email || email,
    '[DEVELOPER_PHONE]': developer.phone.trim(),
    '[DEVELOPER_ADDRESS]': [
      developer.address_line1,
      developer.address_line2,
      [developer.city, developer.postal_code].filter(Boolean).join(' '),
      developer.state,
      developer.country,
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', '),
    '[GOVERNING_LAW]': developer.governing_law.trim(),
    '[JURISDICTION]': developer.jurisdiction.trim(),
  }
}

/** The placeholders in a piece of text, in `[TOKEN]` form. */
export function tokensIn(html: string): string[] {
  return Array.from(new Set(html.match(/\[[A-Z][A-Z0-9_ ]{2,}\]/g) ?? []))
}

/**
 * Placeholders that would still be showing on a page — either not understood
 * at all, or understood but not filled in yet. What the dashboard warns about.
 * Anything inside a `[[ ... ]]` optional block is left out: it disappears
 * cleanly instead of being published.
 */
export function unresolvedPlaceholders(
  html: string,
  settings: AllSettings,
): string[] {
  const values = placeholderValues(settings)
  const withoutOptional = html.replace(/\[\[[\s\S]*?\]\]/g, '')
  return tokensIn(withoutOptional).filter((token) => !values[token])
}

/**
 * The site's own address. Site settings → domain wins, because that is the one
 * the owner can change without a deploy; `NEXT_PUBLIC_SITE_URL` is the
 * fallback. The domain may be typed without the https:// part.
 */
export function publicWebsiteUrl(settings: AllSettings): string {
  const domain = settings.site.domain.trim().replace(/\/$/, '')
  if (!domain) return siteUrl()
  return /^https?:\/\//.test(domain) ? domain : `https://${domain}`
}
