'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import type { VtuPaper } from '@/lib/pyq'

/**
 * Search and filter over the 59 VTU first-year papers, styled after the
 * `/coverage` "Check your branch" widget.
 *
 * The dimensions are the ones the data actually varies in. A Scheme dropdown
 * was asked for and is deliberately absent: all 59 papers are 2025 CBCS, so it
 * would be one option. A Branch dropdown was asked for and `branch` cannot
 * supply it — every one of these subjects is first-year and common, so
 * `subjects.branch` is NULL on all of them. The stream is what varies, and the
 * dropdown below is built from it.
 *
 * Filtering is client-side over rows the server already sent. There is no
 * second request and no URL state: 59 rows is nothing to hold in memory, and a
 * query string would be a second source of truth to keep the page and the
 * filters agreeing about.
 */

/** What `subjects.stream` actually holds for a subject common to every branch. */
const COMMON = 'ALL'
const COMMON_LABEL = 'All branches'

const SEMESTER_LABELS: Record<string, string> = {
  '1': 'Semester 1',
  '2': 'Semester 2',
  '1 & 2': 'Semesters 1 & 2',
  'Not recorded': 'Semester not recorded',
}

/** Matches `coverage-checker.tsx`, so the two widgets read as one thing. */
const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary placeholder:text-muted-foreground'

/** Both dimensions are comma-separated sets — see `VtuPaper.streams`. */
const tokens = (value: string) =>
  value
    .split(', ')
    .map((token) => token.trim())
    .filter(Boolean)

const streamLabel = (value: string) =>
  tokens(value)
    .map((token) => (token === COMMON ? COMMON_LABEL : token))
    .join(', ')

const semesterLabel = (value: string) =>
  tokens(value)
    .map((token) => SEMESTER_LABELS[token] ?? `Semester ${token}`)
    .join(', ')

export function VtuPyqBrowser({ papers }: { papers: VtuPaper[] }) {
  const [query, setQuery] = useState('')
  const [branch, setBranch] = useState('')
  const [semester, setSemester] = useState('')

  /*
   * Options are read off the papers rather than listed by hand, so a dropdown
   * can never offer a value that matches nothing — and a stream that appears in
   * tomorrow's data appears in the dropdown without anyone remembering to add
   * it. Ordered by how many papers each holds, which floats "All branches"
   * (23 papers) to the top and is deterministic regardless of row order.
   */
  const branches = useMemo(() => {
    const counts = new Map<string, number>()
    for (const paper of papers) {
      for (const token of tokens(paper.streams)) {
        counts.set(token, (counts.get(token) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([token]) => token)
  }, [papers])

  const semesters = useMemo(() => {
    const seen = new Set<string>()
    for (const paper of papers) {
      for (const token of tokens(paper.semesters)) seen.add(token)
    }
    return [...seen].sort()
  }, [papers])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return papers.filter((paper) => {
      if (
        needle &&
        !`${paper.subject_name} ${paper.subject_code}`
          .toLowerCase()
          .includes(needle)
      ) {
        return false
      }

      if (semester && !tokens(paper.semesters).includes(semester)) return false

      if (branch) {
        const streams = tokens(paper.streams)
        /*
         * A subject listed for ALL streams belongs to whichever branch is
         * picked. "My branch" means the papers I can sit, not the papers that
         * happen to carry my branch code — so a CSE student sees the 13 CSE
         * papers and the 23 common ones, and picking "All branches" is how you
         * isolate the 23.
         */
        const matches =
          streams.includes(branch) ||
          (branch !== COMMON && streams.includes(COMMON))
        if (!matches) return false
      }

      return true
    })
  }, [papers, query, branch, semester])

  // Grouped by subject, as the page has always rendered it, so a student scans
  // for their subject once instead of hunting a code in a flat list.
  const bySubject = useMemo(() => {
    const map = new Map<string, VtuPaper[]>()
    for (const paper of filtered) {
      const list = map.get(paper.subject_name) ?? []
      list.push(paper)
      map.set(paper.subject_name, list)
    }
    return [...map.entries()]
  }, [filtered])

  const active = query.trim() !== '' || branch !== '' || semester !== ''

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Search className="h-4 w-4 text-primary dark:text-accent-foreground" />
          Find your paper
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Search by subject or code, or narrow to your branch and semester.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Subject or code
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Engineering Physics"
              autoComplete="off"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Branch</span>
            <select
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className={fieldClass}
            >
              <option value="">Any branch</option>
              {branches.map((token) => (
                <option key={token} value={token}>
                  {token === COMMON ? `${COMMON_LABEL} (common)` : token}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Semester</span>
            <select
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              className={fieldClass}
            >
              <option value="">Any semester</option>
              {semesters.map((token) => (
                <option key={token} value={token}>
                  {SEMESTER_LABELS[token] ?? `Semester ${token}`}
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
              ? `${filtered.length} of ${papers.length} papers`
              : `${papers.length} papers`}
          </p>
          {active ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setBranch('')
                setSemester('')
              }}
              className="text-sm font-medium text-brand hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {bySubject.length === 0 ? (
          <Card>
            <p className="text-sm font-semibold">Nothing matches those filters</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Try clearing them, or tell us which paper you need below and we
              will look for it.
            </p>
          </Card>
        ) : (
          bySubject.map(([name, subjectPapers]) => (
            <Card key={name}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold leading-snug">{name}</p>
                <Badge tone="neutral">{subjectPapers[0].subject_code}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {streamLabel(subjectPapers[0].streams)} ·{' '}
                {semesterLabel(subjectPapers[0].semesters)}
              </p>
              <ul className="mt-3 space-y-2">
                {subjectPapers.map((paper) => (
                  <li key={paper.url}>
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      {paper.sessions}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
