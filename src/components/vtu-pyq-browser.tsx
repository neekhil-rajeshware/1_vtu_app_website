'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import type { VtuPaper } from '@/lib/pyq'

/**
 * Search and filter over the 59 VTU first-year papers, styled after the
 * `/coverage` "Check your branch" widget.
 *
 * **Every option here comes from the rows, and nothing is keyed to a value the
 * code knows about.** The branch list is the distinct `streams` tokens the
 * papers actually carry; the semester list is the distinct `semesters` tokens.
 * A branch added to `subjects` tomorrow shows up in the dropdown, and a paper
 * recorded under a semester format nobody anticipated still renders, because
 * the only thing this file does to a value is decide whether to prefix it with
 * the word "Semester". There is no map of known branches and no list of known
 * semesters to forget to update.
 *
 * That is why the two dimensions are read off `subjects` rather than joined to
 * the `branches` table: `subjects.stream` speaks its own vocabulary (CSE, ECE,
 * EEE, CV, ME) and `branches.code` has only some of those (CV, ME) — joining
 * would silently drop the branches that do not match.
 *
 * Two fields the request named are deliberately absent. A Scheme dropdown,
 * because all 59 papers are 2025 CBCS and it would have one option. And a
 * Branch dropdown built on `subjects.branch`, because that column is NULL on
 * every one of these first-year subjects — what varies is the stream, which is
 * what this uses.
 *
 * Filtering is client-side over rows the server already sent. There is no
 * second request and no URL state: 59 rows is nothing to hold in memory, and a
 * query string would be a second source of truth.
 */

/** Matches `coverage-checker.tsx`, so the two widgets read as one thing. */
const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary placeholder:text-muted-foreground'

/** Both dimensions are comma-separated sets — see `VtuPaper.streams`. */
const tokens = (value: string) =>
  value
    .split(', ')
    .map((token) => token.trim())
    .filter(Boolean)

/**
 * `1` → `Semester 1`, `1 & 2` → `Semesters 1 & 2`, and anything the database
 * already spells out (`Not recorded`) passes through untouched.
 *
 * A rule rather than a lookup table, so a semester value this file has never
 * seen renders as itself instead of falling into a default.
 */
const semesterLabel = (value: string) =>
  tokens(value)
    .map((token) =>
      /^\d+(\s*&\s*\d+)*$/.test(token)
        ? `${token.includes('&') ? 'Semesters' : 'Semester'} ${token}`
        : token,
    )
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

      if (branch && !tokens(paper.streams).includes(branch)) return false

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
                  {token}
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
                  {semesterLabel(token)}
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
                {subjectPapers[0].streams} ·{' '}
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
