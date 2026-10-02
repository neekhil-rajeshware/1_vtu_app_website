import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Database, RefreshCw } from 'lucide-react'
import {
  CoverageMeter,
  GridLegend,
  SchemeBranchTable,
  StatTile,
} from '@/components/coverage'
import { CoverageChecker } from '@/components/coverage-checker'
import { JsonLd } from '@/components/json-ld'
import { ClosingCta } from '@/components/sections/closing-cta'
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
import { checkerRows, getCoverage, schemeTables } from '@/lib/coverage'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { getSettings, publicWebsiteUrl } from '@/lib/settings'
import { formatDate } from '@/lib/utils'

/**
 * What the app actually holds, counted from the live tables.
 *
 * This page exists because the honest answer to "does it have my branch?" was
 * not available anywhere. The app is installed on phones whose branch has no
 * subject list at all, and nothing on the site said so — a student found out by
 * opening the app and seeing nothing, which reads as a broken app rather than a
 * missing one.
 *
 * So the gaps are the feature, not a disclaimer bolted on. Every number here
 * comes from `content_coverage()` (see `lib/coverage.ts`); nothing is typed in,
 * which is what makes it safe to publish a page whose whole value is being
 * right. The route is dynamic — reading cookies via the Supabase server client
 * does that — so "realtime" costs nothing and means exactly what it says.
 *
 * No breadcrumb, on purpose: this is a top-level page, and `lib/seo.ts` reserves
 * BreadcrumbList for pages nested under one.
 */
/**
 * The description is built from the live counts rather than typed, for the same
 * reason the page is: a number in a `<meta>` tag rots exactly as quietly as one
 * in the body, and this is the copy Google shows. `getCoverage()` is wrapped in
 * React's `cache()`, so this second call costs no extra query.
 */
export async function generateMetadata(): Promise<Metadata> {
  const coverage = await getCoverage()
  const catalogue = coverage?.snapshot.catalogue

  const schemes = (catalogue?.schemes ?? [])
    .filter((scheme) => scheme.subjects > 0)
    .map((scheme) => scheme.name)

  const description = catalogue
    ? `${catalogue.rows.toLocaleString('en-IN')} VTU subjects across ` +
      `${catalogue.branches_covered} of ${catalogue.branches_total} branches` +
      (schemes.length > 0 ? `, on the ${joinList(schemes)} schemes` : '') +
      ' — counted live from the database, gaps included.'
    : 'Exactly how many branches, schemes, syllabuses, previous-year papers and ' +
      'GATE papers the OneVTU app holds right now, including what is still missing.'

  return pageMetadata({
    title: 'VTU Coverage — Schemes, Branches and Syllabuses',
    description,
    path: '/coverage',
  })
}

const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8']

/** "5, 6, 7 and 8" — reads as a sentence rather than a machine dump. */
function joinList(items: string[]) {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

/**
 * A stable in-page anchor, prefixed so it is a valid CSS identifier:
 * "2025 CBCS" → "scheme-2025-cbcs". Unprefixed it begins with a digit, which
 * fragment navigation tolerates but `querySelector` and `:target` do not.
 */
function schemeAnchor(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `scheme-${slug}`
}

export default async function CoveragePage() {
  const [coverage, settings] = await Promise.all([getCoverage(), getSettings()])

  // The function is the only source here, so a failure gets an honest page
  // rather than a crash — the rest of the site is still fine.
  if (!coverage) {
    return (
      <>
        <PageHeader
          eyebrow="Coverage"
          title="What is inside the app"
          subtitle="Counted live from the database on every visit."
        />
        <Section>
          <Container>
            <EmptyState
              title="The live count is unavailable right now"
              description="This page reads the database on every visit, and that read just failed. Please try again in a moment."
            />
          </Container>
        </Section>
        <ClosingCta settings={settings} />
      </>
    )
  }

  const { catalogue, pyq, gate, library } = coverage.snapshot
  const rows = checkerRows(coverage)
  const tables = schemeTables(coverage)

  // Which schemes have rows, from the data rather than from a hardcoded code.
  // There is usually more than one now, so the prose names them as a list —
  // "the 2025 CBCS scheme" was true until the 2022 rows landed on 2026-09-30.
  const liveSchemes = catalogue.schemes.filter((scheme) => scheme.subjects > 0)
  const emptySchemes = catalogue.schemes.filter((scheme) => scheme.subjects === 0)
  const liveSchemeNames = joinList(liveSchemes.map((scheme) => scheme.name))

  // Semesters with nothing for anybody — the single biggest hole, and one a
  // student cannot see from the totals above.
  const emptySemesters = SEMESTERS.filter((semester) =>
    catalogue.branches.every((branch) => (branch.by_semester[semester] ?? 0) === 0),
  )
  const missingBranches = catalogue.branches_total - catalogue.branches_covered

  const n = (value: number) => value.toLocaleString('en-IN')
  const base = publicWebsiteUrl(settings)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'VTU coverage — schemes, branches and syllabuses',
    url: absoluteUrl(base, '/coverage'),
    description:
      'Live counts of the branches, schemes, syllabuses, previous-year question papers and GATE papers held in the OneVTU app.',
    /*
     * Names what the page is about, in the words a student would search. The
     * scheme list is read from the data, so a scheme that gains its first
     * subject joins this without an edit here.
     */
    about: liveSchemes.map((scheme) => ({
      '@type': 'Thing',
      name: `VTU ${scheme.name} scheme`,
    })),
    keywords: [
      'VTU syllabus',
      'VTU scheme subjects',
      'VTU branch subjects',
      ...liveSchemes.map((scheme) => `VTU ${scheme.name} scheme subjects`),
    ].join(', '),
    isAccessibleForFree: true,
  }

  return (
    <>
      <JsonLd data={jsonLd} />

      <PageHeader
        eyebrow="Coverage"
        title="What is inside the app"
        subtitle="Not a promise about what is coming — a count of what is in the database right now, gaps included."
      />

      <Section>
        <Container>
          {/*
            Says out loud what the page is doing, because a coverage page that
            quietly omits its weak numbers is worse than no page at all. The
            stamp doubles as the reader's proof that the numbers are not typed.
          */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Counted on every visit
            </span>
            <span aria-hidden="true">·</span>
            <span>Last read {formatDate(coverage.snapshot.generated_at)}</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile
              label="Subjects in the catalogue"
              value={catalogue.rows}
              detail={
                liveSchemes.length > 0
                  ? `Across the ${liveSchemeNames} scheme${liveSchemes.length === 1 ? '' : 's'}`
                  : 'No scheme has subjects yet'
              }
            />
            <StatTile
              label="Syllabus PDFs on file"
              value={catalogue.with_syllabus}
              detail="Linked to a subject, downloadable in the app"
            />
            <StatTile
              label="Branches with subjects"
              value={`${catalogue.branches_covered} of ${catalogue.branches_total}`}
              detail={`${missingBranches} branches have no subject list yet`}
            />
            {/* Documents, not cells. The tile and the page it links to read the
                same field, so they cannot drift apart. */}
            <StatTile
              label="VTU question paper PDFs"
              value={pyq.documents}
              detail="First year so far — every link on that list is a distinct document"
              href="/vtu-pyqs"
            />
            <StatTile
              label="GATE papers and answer keys"
              value={gate.documents}
              detail="Question papers and answer keys, across every GATE branch"
              href="/gate-pyqs"
            />
            <StatTile
              label="Colleges on file"
              value={catalogue.colleges}
              detail="With code, city and contact details"
            />
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted/40">
        <Container>
          <SectionHeading
            eyebrow="The gaps"
            title="Where the app is still thin"
            subtitle="These are the numbers we would rather not show. They are here because a student who finds out by opening an empty screen assumes the app is broken."
            align="left"
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
              <CoverageMeter
                label="Subjects with a syllabus attached"
                filled={catalogue.with_syllabus}
                total={catalogue.rows}
              />
              <CoverageMeter
                label="Branches with any subjects"
                filled={catalogue.branches_covered}
                total={catalogue.branches_total}
              />
              <CoverageMeter
                label="Schemes with subjects"
                filled={catalogue.schemes_covered}
                total={catalogue.schemes_total}
              />
              <CoverageMeter
                label="Previous-year paper slots filled"
                filled={pyq.filled}
                total={pyq.slots}
                note={`${n(pyq.filled)} slots carry a paper. The ${n(pyq.slots)} is every subject against all ${pyq.sessions} session columns — room we have, not papers we owe.`}
              />
              <CoverageMeter
                label="GATE slots filled"
                filled={gate.filled}
                total={gate.slots}
                note={`A paper or answer key in ${n(gate.filled)} of ${n(gate.slots)} subject-year combinations. There are more PDFs than slots — the ${n(gate.documents)} above — because a recent year can hold two sittings.`}
              />
            </div>

            <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {catalogue.branches_covered} of {catalogue.branches_total} branches
                  have subjects
                </h3>
                <p className="mt-2">
                  {missingBranches} branches are in our college and branch lists, so a
                  student can pick them while signing up, but have no subject
                  catalogue behind them. That is the report we get most often.
                </p>
              </div>

              {emptySemesters.length > 0 ? (
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {emptySemesters.length === 1 ? 'Semester' : 'Semesters'}{' '}
                    {joinList(emptySemesters)}{' '}
                    {emptySemesters.length === 1 ? 'is' : 'are'} empty for everyone
                  </h3>
                  <p className="mt-2">
                    Not thin — empty. No branch has a single subject for{' '}
                    {emptySemesters.length === 1 ? 'this semester' : 'these semesters'}{' '}
                    yet, so the app has nothing to show anyone{' '}
                    {emptySemesters.length === 1 ? 'in it' : 'in them'}.
                  </p>
                </div>
              ) : null}

              {emptySchemes.length > 0 ? (
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {emptySchemes.length} of {catalogue.schemes_total} schemes{' '}
                    {emptySchemes.length === 1 ? 'is' : 'are'} empty
                  </h3>
                  <p className="mt-2">
                    The subject list is built for{' '}
                    {liveSchemes.length > 0 ? liveSchemeNames : 'one scheme'} so far.{' '}
                    {joinList(emptySchemes.map((scheme) => scheme.name))}{' '}
                    {emptySchemes.length === 1 ? 'has' : 'have'} no subjects, so a
                    student on {emptySchemes.length === 1 ? 'it' : 'them'} sees an
                    empty app.
                  </p>
                </div>
              ) : null}

              <p>
                Coverage moves when we add a syllabus or a paper. This page is rebuilt
                on every visit, so it needs no publishing step and cannot go stale.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading
            eyebrow="Scheme by scheme"
            title="Every branch, under the scheme it belongs to"
            subtitle="One table per scheme, because a branch can be covered under one scheme and not another. A stronger shade means more subjects; a dash means nothing has been added for that combination yet."
            align="left"
          />

          <div className="mt-4">
            <GridLegend />
          </div>

          {/*
            Jump links, because the tables are long and a student arrives knowing
            their scheme already. They also make the page's structure legible to
            a crawler in one line, before 90 rows of table.
          */}
          {tables.length > 1 ? (
            <nav aria-label="Jump to a scheme" className="mt-5 flex flex-wrap gap-2">
              {tables.map((table) => (
                <a
                  key={table.code}
                  href={`#${schemeAnchor(table.name)}`}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary dark:hover:text-accent-foreground"
                >
                  {table.name}
                </a>
              ))}
            </nav>
          ) : null}

          <div className="mt-8 space-y-12">
            {tables.map((table) => (
              <div key={table.code} id={schemeAnchor(table.name)} className="scroll-mt-28">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-xl font-bold tracking-tight">
                    {table.name} scheme subjects, branch by branch
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {n(table.subjects)} subjects across {table.rows.length} branches
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <SchemeBranchTable
                    rows={table.rows}
                    semesters={table.semesters}
                    label="Branch"
                    caption={`Subjects in the OneVTU app for the VTU ${table.name} scheme, by branch and semester. A dash means nothing has been added for that combination yet.`}
                  />
                </div>

                <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    {table.emptySemesters.length > 0 ? (
                      <>
                        The {table.name} table stops at semester{' '}
                        {table.semesters.at(-1)} because{' '}
                        {table.emptySemesters.length === 1
                          ? 'semester'
                          : 'semesters'}{' '}
                        {joinList(table.emptySemesters)}{' '}
                        {table.emptySemesters.length === 1 ? 'has' : 'have'} nothing for
                        anyone on this scheme yet.{' '}
                      </>
                    ) : null}
                    {table.schemeHasFirstYear
                      ? `Semesters 1 and 2 include first year, which every branch shares, so ` +
                        `the same subjects are counted in every row — which is why the All ` +
                        `column adds up to more than the ${n(table.subjects)} above.`
                      : 'This scheme has no first-year rows, because the students on it are past first year.'}{' '}
                    Only semesters {table.semesters[0]} to {table.semesters.at(-1)} are
                    listed, because that is the whole span this scheme has subjects for.
                  </p>

                  {table.missingBranches.length > 0 ? (
                    <p>
                      <span className="font-semibold text-foreground">
                        {table.missingBranches.length} branches have nothing on the{' '}
                        {table.name} scheme
                      </span>
                      : {joinList(table.missingBranches.slice(0, 12))}
                      {table.missingBranches.length > 12
                        ? ` and ${table.missingBranches.length - 12} more`
                        : ''}
                      .
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {emptySchemes.length > 0 ? (
            <p className="mt-12 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {joinList(emptySchemes.map((scheme) => `${scheme.name}`))}{' '}
              {emptySchemes.length === 1 ? 'has' : 'have'} no subjects at all, so{' '}
              {emptySchemes.length === 1 ? 'it has' : 'they have'} no table here. A
              page with a heading and nothing under it would be worse than the
              absence.
            </p>
          ) : null}

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Where a row is filled, the app opens the{' '}
            <Link
              href="/features/vtu-syllabus"
              className="font-semibold text-primary hover:underline dark:text-accent-foreground"
            >
              syllabus for that subject
            </Link>
            , searchable offline, along with its previous-year question papers once
            we have them.
          </p>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted/40">
        <Container>
          <SectionHeading
            eyebrow="Your branch"
            title="Find out in one step"
            subtitle="If we do not have yours, say so — every request tells us which branch and semester to work on next."
            align="left"
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
            <CoverageChecker rows={rows} schemes={catalogue.schemes} />

            <div className="space-y-4">
              <Card>
                <Badge>What one subject gets you</Badge>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li>The syllabus PDF, readable and searchable offline.</li>
                  <li>
                    Previous-year papers by session, once we have them for that
                    subject.
                  </li>
                  <li>
                    Module-wise topics, which is what flashcards, the daily quiz, the
                    AI professor and study planning all read from.
                  </li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  That last one is why a missing subject matters more than it looks: an
                  absent subject is not one blank page, it is every study feature with
                  nothing to work on.
                </p>
              </Card>

              <Card>
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Database className="h-4 w-4 text-primary dark:text-accent-foreground" />
                  What else is in the app
                </h2>
                <ul className="mt-3 divide-y divide-border">
                  {library.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                    >
                      <span className="text-sm">
                        {item.label}
                        {item.detail ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {item.detail}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {n(item.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Badge>Ask for anything</Badge>
              <h2 className="mt-3 text-xl font-bold tracking-tight">
                A missing subject is a message away
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Tell us the branch, scheme and semester. Requests are what decides
                which syllabus gets added next, and they go straight to the same inbox
                we read every day.
              </p>
            </div>
            <ButtonLink href="/contact" variant="primary" size="lg" className="shrink-0">
              Request a subject
              <ArrowRight className="h-[1.15rem] w-[1.15rem]" />
            </ButtonLink>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Wondering when results come out? That lives on{' '}
            <Link
              href="/vtu-result-dates"
              className="font-semibold text-primary hover:underline dark:text-accent-foreground"
            >
              VTU result dates
            </Link>
            .
          </p>
        </Container>
      </Section>

      <ClosingCta settings={settings} />
    </>
  )
}
