import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GatePyqBrowser } from '@/components/gate-pyq-browser'
import { JsonLd } from '@/components/json-ld'
import { ClosingCta } from '@/components/sections/closing-cta'
import {
  Container,
  PageHeader,
  Section,
  SectionHeading,
} from '@/components/ui'
import { getGateIndex, yearSpan } from '@/lib/pyq'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { getSettings, publicWebsiteUrl } from '@/lib/settings'

/**
 * Every GATE paper the app holds, one link each.
 *
 * Nothing is gated. The PDFs already sit at public r2.dev URLs anyone can open
 * without the app, so hiding the link would hide nothing — and Google ranks a
 * page on the content it can read, so a page titled "all papers" that showed
 * two would be a doorway page and rank for nothing. The honest pitch is what
 * the app adds, and it is at the bottom of this page.
 *
 * Every number in the heading comes from the index, never typed: a hardcoded
 * range sitting next to a derived count is what already produced a wrong figure
 * on /coverage once.
 */

export async function generateMetadata(): Promise<Metadata> {
  const index = await getGateIndex()
  if (index.papers.length === 0) {
    return {
      title: 'GATE previous year papers',
      robots: { index: false, follow: true },
    }
  }

  const { papers, documents, year_from, year_to } = index.totals

  return pageMetadata({
    title: `GATE Previous Year Papers — ${papers} Papers, ${yearSpan(year_from, year_to)}`,
    description:
      `Question papers and answer keys for all ${papers} GATE papers, ` +
      `${yearSpan(year_from, year_to)}. ${documents.toLocaleString('en-IN')} PDFs across ` +
      `every branch, free to download with no sign-up required.`,
    path: '/gate-pyqs',
  })
}

export default async function GatePyqsPage() {
  const [index, settings] = await Promise.all([getGateIndex(), getSettings()])
  if (index.papers.length === 0) notFound()

  const base = publicWebsiteUrl(settings)
  const { totals } = index
  const n = (value: number) => value.toLocaleString('en-IN')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'GATE Previous Year Papers',
    url: absoluteUrl(base, '/gate-pyqs'),
    isPartOf: { '@id': `${base}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: index.papers.length,
      itemListElement: index.papers.map((paper, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${paper.name} — GATE previous year papers`,
        // Each paper is a <details> carrying this id, so the fragment resolves
        // to a real element. These pointed at /gate-pyqs/<slug> until
        // 2026-10-02 — 52 URLs that 404, listed in structured data.
        url: `${absoluteUrl(base, '/gate-pyqs')}#${paper.slug}`,
      })),
    },
  }

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* PageHeader renders its own full-bleed band, so it is never wrapped in
          Section/Container. See coverage/page.tsx. */}
      <PageHeader
        eyebrow="Question papers"
        title="GATE previous year papers"
        subtitle={
          `${totals.papers} papers, ${n(totals.documents)} PDFs, ` +
          `${yearSpan(totals.year_from, totals.year_to)}. Every question paper and answer ` +
          `key we hold, free to download — no sign-up, no app required.`
        }
      />

      {/*
        Known ceiling, measured 2026-10-02 and unchanged by the filter: all 1,776
        links live in this one document — 1.33 MB of markup plus 1.71 MB of
        Next.js RSC payload duplicating it, 3.0 MB. The fix is Phase 2's
        per-paper pages, at which point this hub lists papers and links out
        instead of expanding them; one paper page carries ~34 links. Shipping it
        expanded is deliberate — the alternative that shipped was 52 dead links.
        The filter is what makes the weight tolerable meanwhile; it does not
        reduce it, because a client component is still server-rendered.
      */}
      <Section>
        <Container>
          <GatePyqBrowser papers={index.papers} />
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading
            eyebrow="In the app"
            title="What the app adds"
            subtitle="The papers are free here. The app is what makes them yours — sorted, offline, and explained."
          />
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            <Link
              href="/vtu-pyqs"
              className="text-sm font-medium text-brand hover:underline"
            >
              VTU first-year question papers →
            </Link>
            <Link
              href="/coverage"
              className="text-sm font-medium text-brand hover:underline"
            >
              What else the app covers →
            </Link>
            {/* "Previous Year Papers" is the feature these pages serve, but its
                slug is NULL so it has no landing page — `/features/<NULL>` is a
                404. GATE Question Papers does have one and is the honest link. */}
            <Link
              href="/features/gate-question-papers"
              className="text-sm font-medium text-brand hover:underline"
            >
              GATE Question Papers in the app →
            </Link>
          </div>
        </Container>
      </Section>

      <ClosingCta settings={settings} />
    </>
  )
}
