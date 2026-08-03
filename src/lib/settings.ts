import { createClient } from '@/lib/supabase/server'

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
  const site = settings.site
  const map: Record<string, string> = {
    '\\[APP_NAME\\]': site.name || 'OneVTU',
    '\\[SUPPORT_EMAIL\\]': settings.contact.support_email || '[SUPPORT_EMAIL]',
    '\\[WEBSITE\\]': site.domain || '',
    '\\[DEVELOPER_NAME\\]': settings.footer.copyright || site.name || 'OneVTU',
  }
  let out = html
  for (const [pattern, value] of Object.entries(map)) {
    if (!value) continue
    out = out.replace(new RegExp(pattern, 'g'), value)
  }
  return out
}
