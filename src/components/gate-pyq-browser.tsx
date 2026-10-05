'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { documentCount, yearSpan } from '@/lib/pyq-format'
import type { GatePaper } from '@/lib/pyq'

/**
 * Search and filter over the 52 GATE papers, styled after `/vtu-pyqs` and the
 * `/coverage` "Check your branch" widget.
 *
 * The two dropdowns are the two dimensions this data actually has. A paper is
 * one card holding one row per year, so:
 *
 *   - **Paper** narrows which cards are shown. It overlaps the search box on
 *     purpose — the box is for someone who knows they want "civil" and not that
 *     the code is CV, the dropdown is for browsing all 52.
 *   - **Year** narrows the years *inside* each card, not the cards. Every one of
 *     the 40 fully-collected papers runs 2007–2026, so filtering cards by year
 *     would hide almost nothing; what a reader wants from "2024" is the 2024 row
 *     of whichever paper, which is exactly what this does.
 *
 * Both lists come from the rows, so a paper added to the table appears in the
 * dropdown without this file being touched, and a year is offered only if some
 * paper actually has it.
 *
 * Filtering is client-side over rows the server already sent. That matters more
 * here than on `/vtu-pyqs`: this page carries all 1,774 links and is ~3 MB, so
 * the filter makes a heavy page usable rather than making it smaller. The
 * counts in the header are the honest ones and move with the filters.
 */

/** Matches `coverage-checker.tsx`, so the widgets read as one thing. */
const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary placeholder:text-muted-foreground'

export function GatePyqBrowser({ papers }: { papers: GatePaper[] }) {
  const [query, setQuery] = useState('')
  const [code, setCode] = useState('')
  const [year, setYear] = useState('')

  /** Every year any paper holds, newest first. */
  const years = useMemo(() => {
    const seen = new Set<number>()
    for (const paper of papers) {
      for (const entry of paper.years) seen.add(entry.year)
    }
    return [...seen].sort((a, b) => b - a)
  }, [papers])

  /** Read as a paper rather than a riddle — `CV` is not "curriculum vitae". */
  const codeName = useMemo(
    () => new Map(papers.map((paper) => [paper.code, paper.name])),
    [papers],
  )

  /** Alphabetical, so the dropdown can be scanned by name. */
  const codes = useMemo(
    () => [...papers].sort((a, b) => a.name.localeCompare(b.name)),
    [papers],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const wantedYear = year === '' ? null : Number(year)

    return papers
      .filter(
        (paper) =>
          !needle ||
          `${paper.name} ${paper.code}`.toLowerCase().includes(needle),
      )
      .filter((paper) => !code || paper.code === code)
      .map((paper) => ({
        paper,
        years:
          wantedYear === null
            ? paper.years
            : paper.years.filter((entry) => entry.year === wantedYear),
      }))
      // A paper with no row for the chosen year is not a match.
      .filter((entry) => entry.years.length > 0)
  }, [papers, query, code, year])

  const totalPdfs = useMemo(
    () => papers.reduce((sum, paper) => sum + documentCount(paper), 0),
    [papers],
  )
  const shownPdfs = filtered.reduce(
    (sum, entry) =>
      sum +
      entry.years.reduce(
        (inner, y) => inner + y.paper.length + y.answer_key.length,
        0,
      ),
    0,
  )

  const active = query.trim() !== '' || code !== '' || year !== ''
  const n = (value: number) => value.toLocaleString('en-IN')

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Search className="h-4 w-4 text-primary dark:text-accent-foreground" />
          Find your paper
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Search by paper or code, or pick a paper and a year.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Paper or code
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Civil Engineering"
              autoComplete="off"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Paper</span>
            <select
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={fieldClass}
            >
              <option value="">Any paper</option>
              {codes.map((paper) => (
                <option key={paper.code} value={paper.code}>
                  {paper.code} — {paper.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Year</span>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className={fieldClass}
            >
              <option value="">Any year</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Announced, not just shown: changing a select gives a screen-reader
            user no reason to expect the list below to have changed. */}
        <div
          aria-live="polite"
          className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <p className="text-sm text-muted-foreground">
            {active
              ? `${filtered.length} of ${papers.length} papers · ${n(shownPdfs)} of ${n(totalPdfs)} PDFs`
              : `${papers.length} papers · ${n(totalPdfs)} PDFs`}
          </p>
          {active ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCode('')
                setYear('')
              }}
              className="text-sm font-medium text-brand hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm font-semibold">Nothing matches those filters</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Try clearing them, or tell us which paper you need below and we will
            look for it.
          </p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ paper, years: shownYears }) => {
            // The codes this paper's files are named after, minus its own.
            // Printed rather than resolved: 29 of the 52 papers hold another
            // paper's PDFs, and every one of those links works, so nothing but
            // the filename says so.
            const foreign = paper.source_codes.filter((c) => c !== paper.code)
            const unknown = foreign.filter((c) => !codeName.has(c))
            const foreignLabel = foreign
              .map((c) => (codeName.has(c) ? `${c} — ${codeName.get(c)}` : c))
              .join(', ')

            return (
              /*
               * A <details> rather than a link to a per-paper page: those pages
               * are Phase 2, and every card here pointed at one of the 52 URLs
               * that 404 until 2026-10-02. A hub whose every outbound link is
               * broken is a doorway page. Native disclosure, no JS.
               *
               * `open` while a filter is active, because a reader who has just
               * asked for one paper's 2024 row should not have to click again
               * to see it.
               */
              <Card key={paper.code} className="h-full">
                <details
                  id={paper.slug}
                  open={active}
                  className="group scroll-mt-24"
                >
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
                        <span className="hidden group-open:inline">
                          hide years
                        </span>
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
                    {shownYears.map((entry) => (
                      <li key={entry.year}>
                        <p className="text-xs font-semibold tabular-nums">
                          {entry.year}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          {entry.paper.map((asset) => (
                            <a
                              key={asset.url}
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                            >
                              {asset.label
                                ? `Paper ${asset.label}`
                                : 'Question paper'}
                              <ExternalLink
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                            </a>
                          ))}
                          {entry.answer_key.map((asset) => (
                            <a
                              key={asset.url}
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                            >
                              {asset.label ? `Key ${asset.label}` : 'Answer key'}
                              <ExternalLink
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
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
      )}
    </>
  )
}
