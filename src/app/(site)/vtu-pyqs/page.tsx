import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { ClosingCta } from '@/components/sections/closing-cta'
import { ButtonLink, Container, PageHeader, Section, SectionHeading } from '@/components/ui'
import { VtuPyqBrowser } from '@/components/vtu-pyq-browser'
import { getVtuIndex, type VtuPaper } from '@/lib/pyq'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { getSettings, publicWebsiteUrl } from '@/lib/settings'

/**
 * Every VTU question paper we hold, and only what exists.
 *
 * This page was titled "VTU first-year question papers" on purpose: all 59
 * papers were first-year, and a 2022-scheme fifth-semester student landing on a
 * page promising "VTU previous year papers" and finding first-year papers has
 * been misled — the failure mode `/coverage` was built to avoid. The 2026-10-07
 * py_qp backfill inverted that: 360 of the 436 papers are now 2022-scheme
 * semesters 5–7 against 76 first-year ones. So the title says question papers
 * and the subtitle says which schemes, because that is what is actually here.
 *
 * Hardcoding either would go stale again. Every number *and* every scheme name
 * below is read off the rows, so the next backfill cannot leave the prose
 * describing a collection that is no longer there — which is exactly how this
 * page came to advertise a first-year collection four days after it stopped
 * being one.
 *
 * An earlier version of the index behind this page counted rows and advertised
 * 170 papers; the rows were not papers. One subject — Engineering Drawing — is
 * listed once per stream in `subjects`, and all five of those rows held the same
 * files, so the page would have handed an ME student a CSE paper and claimed
 * three times the collection. The index resolves each paper's subject from the
 * filename and drops browser duplicate-download suffixes.
 *
 * `/contact` ignores a subject it does not have in its list, so the prefill
 * below spells the option exactly as `contact-form.tsx` does — the same string
 * `/coverage` already uses. A near miss would silently send "General question".
 */

const REQUEST_SUBJECT = 'Missing question paper or syllabus'

/**
 * Newest first, matching the Scheme dropdown (`scheme_code` runs newest-first:
 * `1` is 2025 CBCS, `2` is 2022 CBCS). Deduplicated, because one scheme has many
 * papers and the sentence this feeds wants schemes, not papers.
 */
function schemeNames(papers: VtuPaper[]): string[] {
  const byCode = new Map(papers.map((paper) => [paper.scheme_code, paper.scheme_name]))
  return [...byCode.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, name]) => name)
}

/** `A and B`, `A, B and C` — so the sentence reads as English at any count. */
const list = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })

export async function generateMetadata(): Promise<Metadata> {
  const index = await getVtuIndex()
  if (index.papers.length === 0) {
    return {
      title: 'VTU question papers',
      robots: { index: false, follow: true },
    }
  }

  const { papers, subjects, sessions } = index.totals

  return pageMetadata({
    title: `VTU Question Papers — ${papers} Papers, ${subjects} Subjects`,
    description:
      `${papers} VTU question papers across ${subjects} subjects and ` +
      `${sessions} exam sittings, for the ${list.format(schemeNames(index.papers))} ` +
      `schemes. Free PDFs, no sign-up required.`,
    path: '/vtu-pyqs',
  })
}

export default async function VtuPyqsPage() {
  const [index, settings] = await Promise.all([getVtuIndex(), getSettings()])
  if (index.papers.length === 0) notFound()

  const base = publicWebsiteUrl(settings)
  const { totals } = index
  const schemes = list.format(schemeNames(index.papers))

  const request = new URLSearchParams({
    subject: REQUEST_SUBJECT,
    message: 'Please add the VTU question papers for: ',
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'VTU Question Papers',
    url: absoluteUrl(base, '/vtu-pyqs'),
    isPartOf: { '@id': `${base}/#website` },
  }

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* PageHeader draws its own full-bleed band — never wrap it in
          Section/Container. See coverage/page.tsx. */}
      <PageHeader
        eyebrow="Question papers"
        title="VTU question papers"
        subtitle={
          `Everything we hold: ${totals.papers} papers across ${totals.subjects} ` +
          `subjects and ${totals.sessions} exam sittings, from the ${schemes} ` +
          `schemes. Every one is a free PDF, no sign-up. We are still collecting, ` +
          `so some subjects and semesters are missing — the filters below show ` +
          `exactly what is here.`
        }
      />

      <Section>
        <Container>
          <VtuPyqBrowser papers={index.papers} />
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading
            eyebrow="Missing your paper?"
            title="Tell us which one"
            subtitle="We add papers as we find them. If yours is not here, say which subject and sitting and we will look for it."
          />
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <ButtonLink href={`/contact?${request}`}>Request a paper</ButtonLink>
            <Link
              href="/gate-pyqs"
              className="text-sm font-medium text-brand hover:underline"
            >
              GATE previous year papers →
            </Link>
            <Link
              href="/coverage"
              className="text-sm font-medium text-brand hover:underline"
            >
              See every subject the app covers →
            </Link>
          </div>
        </Container>
      </Section>

      <ClosingCta settings={settings} />
    </>
  )
}
