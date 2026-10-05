import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import { Container, Section, SectionHeading } from '@/components/ui'
import type { HomeSection } from '@/lib/content'

/**
 * The two question-paper hubs, linked from the home page.
 *
 * They went live in the sitemap and cross-linked from `/coverage`, and were
 * reachable from nowhere else on the site — the home page offered no path to
 * either, which is what someone reported first thing after they shipped. A page
 * nothing links to is a page a crawler visits once and a reader never finds, so
 * the link is doing as much work here as the pages are.
 *
 * Counts arrive as props from `content_coverage()` rather than being written
 * into the copy. The numbers strip under the hero was hand-typed once and
 * drifted to a figure many times the real one; a hardcoded count in this file
 * would go the same way, and this band sits a scroll away from a page that
 * prints the live figure.
 *
 * `null` means the index behind the count failed to run, and the card says
 * "Browse the collection" instead of a number. Unknown is not zero.
 */
export function PaperHubs({
  section,
  gateDocuments,
  vtuDocuments,
}: {
  section?: HomeSection
  gateDocuments: number | null
  vtuDocuments: number | null
}) {
  const n = (value: number) => value.toLocaleString('en-IN')

  const hubs = [
    {
      href: '/gate-pyqs',
      title: 'GATE previous year papers',
      blurb:
        'Every GATE paper and answer key we hold, sorted by year and sitting. No sign-up, no paywall.',
      documents: gateDocuments,
      unit: 'PDFs',
    },
    {
      href: '/vtu-pyqs',
      title: 'VTU question papers',
      blurb:
        'Question papers by subject, each labelled with the scheme, semester and stream it belongs to.',
      documents: vtuDocuments,
      unit: 'papers',
    },
  ]

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Previous year papers"
          title={section?.heading || 'Question papers, free to download'}
          subtitle={
            section?.subheading ??
            'Both collections are open — read them on the web, or open them in the app.'
          }
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {hubs.map((hub) => (
            <Link
              key={hub.href}
              href={hub.href}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-foreground">
                <FileText className="h-[1.35rem] w-[1.35rem]" />
              </span>
              <h3 className="mt-4 text-base font-bold">{hub.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {hub.blurb}
              </p>
              <p className="mt-4 inline-flex items-center text-sm font-semibold text-primary dark:text-accent-foreground">
                {hub.documents === null
                  ? 'Browse the collection'
                  : `${n(hub.documents)} ${hub.unit}`}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  )
}
