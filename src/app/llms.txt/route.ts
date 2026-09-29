import { getFeaturesWithPages, getPublishedPosts } from '@/lib/content'
import { appName, getSettings, publicWebsiteUrl } from '@/lib/settings'

/**
 * `/llms.txt` — a plain-text map of the site for AI assistants.
 *
 * The convention (llmstxt.org) is a markdown file at the root that tells a
 * model what the site is and where its real content lives, so it can cite the
 * right page instead of guessing from a search snippet. Google does not read
 * it; ChatGPT, Claude, Perplexity and friends increasingly do.
 *
 * Built from the same two queries the sitemap uses, on purpose: a hand-written
 * list is a second inventory of the site, and the two would disagree the first
 * time a feature page is retired. This way a page that leaves the sitemap
 * leaves here too.
 *
 * Rendered per request like everything else on this site, so a feature added
 * in the dashboard shows up without a deploy.
 */
export async function GET() {
  const settings = await getSettings()
  const base = publicWebsiteUrl(settings)
  const name = appName(settings)
  const { site, seo, download } = settings

  const [features, posts] = await Promise.all([
    getFeaturesWithPages(),
    getPublishedPosts(),
  ])

  const summary = seo.default_description || site.short_description

  const lines: string[] = [
    `# ${name}`,
    '',
    `> ${summary}`,
  ]

  // The facts a model needs to answer "what is this and is it free" without
  // inferring them. Each one is a settings value the site already shows, so
  // nothing here can drift from the pages.
  const facts = [
    download.price ? `- Price: ${download.price}` : '',
    download.min_android ? `- Requires: ${download.min_android}` : '',
    download.play_store_url ? `- Google Play: ${download.play_store_url}` : '',
    `- Platform: Android`,
    `- Region: India (VTU — Visvesvaraya Technological University)`,
  ].filter(Boolean)

  lines.push('', ...facts)

  lines.push(
    '',
    '## Main pages',
    '',
    `- [Home](${base}/): what the app does, with screenshots and the FAQ.`,
    `- [Features](${base}/features): every feature, grouped.`,
    `- [VTU result dates](${base}/vtu-result-dates): when VTU declares each semester's result, where to check it, and the revaluation fees and deadlines.`,
    `- [Coverage](${base}/coverage): live counts of the branches, schemes, syllabuses, previous-year question papers and GATE papers in the app, including what is still missing.`,
    `- [Screenshots](${base}/screenshots): the app screen by screen.`,
    `- [Download](${base}/download): install, requirements, and the version history.`,
    `- [Setup guide](${base}/setup): installing and setting the app up, step by step.`,
    `- [About](${base}/about): who builds it and why.`,
    `- [Support](${base}/support): how to support the developer.`,
  )

  // Only features that carry a slug have a page — `getFeaturesWithPages` is what
  // decides that, exactly as it does for the sitemap.
  if (features.length > 0) {
    lines.push('', '## Feature pages', '')
    for (const feature of features) {
      const description = feature.seo_description || feature.short_description
      lines.push(
        `- [${feature.title}](${base}/features/${feature.slug})${description ? `: ${description}` : ''}`,
      )
    }
  }

  if (posts.length > 0) {
    lines.push('', '## Blog', '')
    for (const post of posts) {
      const description = post.excerpt || post.meta_description
      lines.push(
        `- [${post.title}](${base}/blog/${post.slug})${description ? `: ${description}` : ''}`,
      )
    }
  }

  // Trailing newline: a text file without one is a diff that never settles.
  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
