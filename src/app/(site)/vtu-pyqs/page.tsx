import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { ClosingCta } from '@/components/sections/closing-cta'
import { ButtonLink, Container, PageHeader, Section, SectionHeading } from '@/components/ui'
import { VtuPyqBrowser } from '@/components/vtu-pyq-browser'
import { getVtuIndex } from '@/lib/pyq'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { getSettings, publicWebsiteUrl } from '@/lib/settings'

/**
 * The VTU question papers we hold — first year, and only what exists.
 *
 * Titled for what it is rather than what would rank. A 2022-scheme fifth-
 * semester student landing on a page promising "VTU previous year papers" and
 * finding first-year papers has been misled, which is the failure mode
 * `/coverage` was built to avoid; so the title says first year.
 *
 * Every number here is derived. An earlier version of the index behind this
 * page counted rows and advertised 170 papers; the rows were not papers. One
 * subject — Engineering Drawing — is listed once per stream in `subjects`, and
 * all five of those rows held the same files, so the page would have handed an
 * ME student a CSE paper and claimed three times the collection. The index now
 * resolves each paper's subject from the filename and drops browser
 * duplicate-download suffixes, so this page reports 59 papers across 33
 * subjects and every one of them is a distinct document.
 *
 * `/contact` ignores a subject it does not have in its list, so the prefill
 * below spells the option exactly as `contact-form.tsx` does — the same string
 * `/coverage` already uses. A near miss would silently send "General question".
 */

const REQUEST_SUBJECT = 'Missing question paper or syllabus'

export async function generateMetadata(): Promise<Metadata> {
  const index = await getVtuIndex()
  if (index.papers.length === 0) {
    return {
      title: 'VTU first-year question papers',
      robots: { index: false, follow: true },
    }
  }

  const { papers, subjects, sessions } = index.totals

  return pageMetadata({
    title: `VTU First-Year Question Papers — ${papers} Papers, ${subjects} Subjects`,
    description:
      `${papers} VTU first-year question papers across ${subjects} subjects and ` +
      `${sessions} exam sessions. Free PDFs for every stream, no sign-up required.`,
    path: '/vtu-pyqs',
  })
}

export default async function VtuPyqsPage() {
  const [index, settings] = await Promise.all([getVtuIndex(), getSettings()])
  if (index.papers.length === 0) notFound()

  const base = publicWebsiteUrl(settings)
  const { totals } = index

  const request = new URLSearchParams({
    subject: REQUEST_SUBJECT,
    message: 'Please add the first-year VTU question papers for: ',
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'VTU First-Year Question Papers',
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
        title="VTU first-year question papers"
        subtitle={
          `${totals.papers} papers across ${totals.subjects} subjects and ` +
          `${totals.sessions} exam sittings, every one free to download. This is ` +
          `everything we hold for VTU question papers — later semesters are still ` +
          `being collected, and the app shows each subject's syllabus today.`
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
