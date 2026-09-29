import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarClock, ShieldCheck } from 'lucide-react'
import { JsonLd } from '@/components/json-ld'
import { ClosingCta } from '@/components/sections/closing-cta'
import { FaqSection } from '@/components/sections/faq'
import {
  Badge,
  ButtonLink,
  Card,
  Container,
  EmptyState,
  PageHeader,
  Section,
  SectionHeading,
} from '@/components/ui'
import { getFaqs } from '@/lib/content'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { getSettings, publicWebsiteUrl } from '@/lib/settings'
import { formatDate } from '@/lib/utils'

/**
 * The page that chases "VTU result date" — the query students actually type,
 * and the one nobody answers properly: VTU publishes nothing in advance and
 * colleges post PDF notices that search engines cannot read.
 *
 * Deliberately *not* a new post per result cycle. A fresh URL each time starts
 * from zero authority and leaves last cycle's page ranking with the wrong dates
 * while it competes with the new one. One page, edited in place, keeps whatever
 * ranking it earns and only has to be re-crawled. Its sessions come from
 * `web_settings.results` (see `lib/settings.ts`) so correcting it the day VTU
 * announces needs no deploy.
 *
 * No breadcrumb, on purpose: this is a top-level page, and `lib/seo.ts` reserves
 * BreadcrumbList for pages nested under one.
 */
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    // The query, not the nav label. No year in the title: a hardcoded one goes
    // quietly wrong every January, and the sessions table carries the specifics.
    title: 'VTU Result Dates',
    description:
      'When VTU declares each semester result, where to check yours on the official portal, and the revaluation fees and deadlines that follow. Updated as each session is announced.',
    path: '/vtu-result-dates',
  })
}

export default async function ResultDatesPage() {
  const [settings, faqs] = await Promise.all([getSettings(), getFaqs()])
  const { results } = settings
  const resultFaqs = faqs.filter((faq) => faq.category === 'Results')

  const base = publicWebsiteUrl(settings)

  // A `WebPage` node carrying the one field that matters here: when this was
  // last checked by a human. Freshness is the whole game on a date query, and
  // Google can only reward it if the page says so.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'VTU Result Dates',
    url: absoluteUrl(base, '/vtu-result-dates'),
    ...(results.updated_at ? { dateModified: results.updated_at } : {}),
  }

  return (
    <>
      <JsonLd data={jsonLd} />

      <PageHeader
        eyebrow="Results"
        title="When VTU declares your result"
        subtitle="Every session, when it was announced, and what to do once yours is out."
      />

      <Section>
        <Container>
          {results.intro ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {results.intro}
            </p>
          ) : null}

          {results.updated_at ? (
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Last checked {formatDate(results.updated_at)}
            </p>
          ) : null}

          {/*
            The trust statement earns its place: this page exists on a query
            where students are routinely sent to scrapers that ask for a USN.
            Saying plainly what this page will not do is the differentiator.
          */}
          <Card className="mt-6 flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary dark:text-accent-foreground">
              <ShieldCheck className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">
                This page does not show results, and will never ask for your USN.
              </strong>{' '}
              It tracks when VTU declares each session and points you at the only
              place that publishes them. Results are checked on the official
              portal, and nowhere else.
            </p>
          </Card>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading
            eyebrow="Sessions"
            title="Announced so far"
            subtitle="A session with no date yet is one VTU has not published. We leave it blank rather than estimate."
            align="left"
          />

          {results.sessions.length === 0 ? (
            <EmptyState
              className="mt-8"
              title="No sessions listed yet"
              description="Session dates appear here as VTU announces them."
            />
          ) : (
            // Horizontal scroll rather than a stacked card layout on phones: a
            // date table is the thing AI answer engines and Google both lift
            // wholesale, so keeping it a real <table> is worth the scroll.
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-3 pr-4 font-semibold">
                      Session
                    </th>
                    <th scope="col" className="py-3 pr-4 font-semibold">
                      Exams held
                    </th>
                    <th scope="col" className="py-3 font-semibold">
                      Result declared
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.sessions.map((session) => (
                    <tr
                      key={session.label}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 pr-4 font-medium">{session.label}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {session.exam_window}
                      </td>
                      <td className="py-3">
                        {session.result_date ? (
                          <span className="font-semibold">
                            {formatDate(session.result_date)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Not announced yet
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink
              href={results.portal_url || undefined}
              variant="primary"
              size="lg"
              external
            >
              Check your result on the VTU portal
              <ArrowRight className="h-[1.15rem] w-[1.15rem]" />
            </ButtonLink>
            <p className="text-sm text-muted-foreground">
              You will need your University Seat Number. No password.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted/40">
        <Container className="grid gap-8 lg:grid-cols-2">
          <div>
            <Badge>Once it is out</Badge>
            <h2 className="mt-3 text-xl font-bold tracking-tight">
              Checking it takes a minute
            </h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">1.</strong> Open
                the official portal and choose your course — BE, B.Tech, B.Arch,
                MBA and the rest each have their own link.
              </li>
              <li>
                <strong className="font-semibold text-foreground">2.</strong> Pick
                the examination session you sat, for example{' '}
                <em>May/June 2026</em>.
              </li>
              <li>
                <strong className="font-semibold text-foreground">3.</strong> Enter
                your USN and submit. There is no login.
              </li>
              <li>
                <strong className="font-semibold text-foreground">4.</strong> Save
                the PDF. It is a provisional marksheet — the signed one comes from
                your college later.
              </li>
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              One thing that surprises students every year: VTU now declares
              results astonishingly fast. For the May/June 2026 session the
              sixth-semester BE and B.Tech results went up five minutes after the
              final practical exam ended. Waiting weeks to check is a habit from
              the old process.
            </p>
          </div>

          <div>
            <Badge>If the marks look wrong</Badge>
            <h2 className="mt-3 text-xl font-bold tracking-tight">
              Revaluation has a short window
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Revaluation is ₹600 per subject for UG and ₹3,000 for PG, with
              challenge valuation at ₹5,000 and a photocopy of a UG answer script
              at ₹400 — VTU&rsquo;s own Examination Manual figures. Autonomous
              colleges set their own, often higher.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              There is no fixed last date. VTU notifies a window after each set of
              results and your college displays it, and an application that misses
              it is rejected with the fee gone.
            </p>
            <Link
              href="/blog/vtu-result-date-and-revaluation"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline dark:text-accent-foreground"
            >
              The full revaluation process, step by step
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Badge>Keep every attempt</Badge>
              <h2 className="mt-3 text-xl font-bold tracking-tight">
                A result you can still read in your final year
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                The app fetches your VTU result by USN, saves each attempt on your
                phone, and keeps a backlog count that treats a cleared subject as
                cleared.
              </p>
            </div>
            <ButtonLink
              href="/features/vtu-results"
              variant="primary"
              size="lg"
              className="shrink-0"
            >
              Results &amp; Backlogs
              <ArrowRight className="h-[1.15rem] w-[1.15rem]" />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {resultFaqs.length > 0 ? (
        <div className="border-t border-border bg-muted/40">
          <FaqSection faqs={resultFaqs} showHeading={false} />
        </div>
      ) : null}

      <ClosingCta settings={settings} />
    </>
  )
}
