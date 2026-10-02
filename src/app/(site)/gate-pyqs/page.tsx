import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { JsonLd } from '@/components/json-ld'
import { ClosingCta } from '@/components/sections/closing-cta'
import {
  Badge,
  Card,
  Container,
  PageHeader,
  Section,
  SectionHeading,
} from '@/components/ui'
import { documentCount, getGateIndex, yearSpan } from '@/lib/pyq'
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

  // So a code can be read as a paper rather than a riddle. Built from the pages
  // on this list, which is every paper in the table.
  const codeName = new Map(index.papers.map((p) => [p.code, p.name]))

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

      <Section>
        <Container>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {index.papers.map((paper) => {
              // The codes this paper's files are named after, minus its own.
              // Printed rather than resolved: 29 of the 52 papers hold another
              // paper's PDFs, and every one of those links works, so nothing
              // but the filename says so.
              const foreign = paper.source_codes.filter((c) => c !== paper.code)
              const unknown = foreign.filter((c) => !codeName.has(c))
              const foreignLabel = foreign
                .map((c) => (codeName.has(c) ? `${c} — ${codeName.get(c)}` : c))
                .join(', ')

              return (
              // A <details> rather than a link to a per-paper page: those pages
              // are Phase 2, and every card on this page pointed at one of the
              // 52 URLs that 404 until 2026-10-02. A hub whose every outbound
              // link is broken is the doorway page this file's own note warns
              // about — and the PDFs, which already sit at public URLs, were
              // reachable from nowhere on the site. Native disclosure, no JS.
              //
              // Known ceiling, measured 2026-10-02: all 1,776 links in the
              // document make this 1.33 MB of markup, plus 1.71 MB of Next.js
              // RSC payload duplicating it — 3.0 MB. That is heavy for a page
              // meant to rank. The fix is Phase 2's per-paper pages, at which
              // point this hub should list papers and link out rather than
              // expand them; a paper page would carry ~34 links, not 1,776.
              // Shipping it expanded is deliberate: it is slower than it should
              // be, but the alternative that shipped was 52 dead links.
              <Card key={paper.code} className="h-full">
                <details id={paper.slug} className="group scroll-mt-24">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold leading-snug">{paper.name}</p>
                      <Badge tone="neutral">{paper.code}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {yearSpan(paper.year_from, paper.year_to)} ·{' '}
                      {n(documentCount(paper))} PDFs ·{' '}
                      <span className="font-medium text-brand">
                        <span className="group-open:hidden">show years</span>
                        <span className="hidden group-open:inline">hide years</span>
                      </span>
                    </p>
                    {foreignLabel ? (
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        These PDFs are named {foreignLabel}
                        {unknown.length === foreign.length
                          ? ', which is not one of the papers listed here'
                          : ''}
                        .
                      </p>
                    ) : null}
                  </summary>
                  <ul className="mt-3 space-y-2 border-t border-border pt-3">
                    {paper.years.map((year) => (
                      <li key={year.year}>
                        <p className="text-xs font-semibold tabular-nums">{year.year}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          {year.paper.map((asset) => (
                            <a
                              key={asset.url}
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                            >
                              {asset.label ? `Paper ${asset.label}` : 'Question paper'}
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          ))}
                          {year.answer_key.map((asset) => (
                            <a
                              key={asset.url}
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                            >
                              {asset.label ? `Key ${asset.label}` : 'Answer key'}
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              </Card>
              )
            })}
          </div>
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
