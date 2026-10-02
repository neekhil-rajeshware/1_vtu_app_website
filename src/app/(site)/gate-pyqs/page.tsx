import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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
  if (!index || index.papers.length === 0) {
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
  if (!index || index.papers.length === 0) notFound()

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
        url: absoluteUrl(base, `/gate-pyqs/${paper.slug}`),
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
            {index.papers.map((paper) => (
              <Link
                key={paper.code}
                href={`/gate-pyqs/${paper.slug}`}
                className="group focus-visible:outline-none"
              >
                <Card className="h-full transition-colors group-hover:border-brand group-focus-visible:border-brand">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-snug">{paper.name}</p>
                    <Badge tone="neutral">{paper.code}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {yearSpan(paper.year_from, paper.year_to)} ·{' '}
                    {n(documentCount(paper))} PDFs
                  </p>
                </Card>
              </Link>
            ))}
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
            <Link
              href="/features/previous-year-papers"
              className="text-sm font-medium text-brand hover:underline"
            >
              Previous year papers in the app →
            </Link>
          </div>
        </Container>
      </Section>

      <ClosingCta settings={settings} />
    </>
  )
}
