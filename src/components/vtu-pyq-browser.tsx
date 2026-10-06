'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import type { VtuPaper } from '@/lib/pyq'

/**
 * Search and filter over the VTU question papers, styled after the
 * `/coverage` "Check your branch" widget.
 *
 * **Every option here comes from the rows, and nothing is keyed to a value the
 * code knows about.** The scheme list is the distinct `scheme_name` values the
 * papers carry, the branch list the distinct `streams` tokens, the semester list
 * the distinct `semesters` tokens. A scheme added to `py_qp` tomorrow shows up in
 * the dropdown, and a paper recorded under a semester format nobody anticipated
 * still renders, because the only thing this file does to a value is decide
 * whether to prefix it with the word "Semester". There is no map of known
 * schemes, branches or semesters to forget to update.
 *
 * A Scheme dropdown was absent until 2026-10-07. That was right when it was
 * written — all 59 papers were 2025 CBCS and it would have had one option — but
 * the py_qp backfill that day added 2022-scheme papers, and with two schemes on
 * the page a filter is the only way to tell them apart.
 *
 * Branch is read off `streams` (from `subjects.stream`) rather than joined to
 * the `branches` table: the two speak different vocabularies — `subjects.stream`
 * has CSE, ECE, EEE, CV and ME, `branches.code` has only CV and ME — so joining
 * would silently drop the branches that do not match.
 *
 * Filtering is client-side over rows the server already sent. There is no second
 * request and no URL state: a few hundred rows is nothing to hold in memory, and
 * a query string would be a second source of truth.
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
  const [scheme, setScheme] = useState('')
  const [branch, setBranch] = useState('')
  const [semester, setSemester] = useState('')

  /*
   * Ordered by `scheme_code`, which runs newest-first — `1` is 2025 CBCS, `2` is
   * 2022 CBCS — so the scheme a current student is on is the first option. The
   * branch dropdown below is ordered by how many papers each holds instead,
   * which is what floats "All branches" to the top there.
   */
  const schemes = useMemo(() => {
    const byCode = new Map<string, string>()
    for (const paper of papers) byCode.set(paper.scheme_code, paper.scheme_name)
    return [...byCode.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [papers])

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

      if (scheme && paper.scheme_code !== scheme) return false

      if (semester && !tokens(paper.semesters).includes(semester)) return false

      if (branch && !tokens(paper.streams).includes(branch)) return false

      return true
    })
  }, [papers, query, scheme, branch, semester])

  /*
   * Keyed by scheme *and* subject code, not by subject name. The RPC groups the
   * same way, and for the same reason: a 2022 and a 2025 paper can share a
   * subject name and even a filename, so keying on the name alone would merge
   * two schemes' papers into one card and print one of them under the other's
   * code — the merge this page's index was rewritten to stop doing.
   */
  const bySubject = useMemo(() => {
    const map = new Map<string, VtuPaper[]>()
    for (const paper of filtered) {
      const key = `${paper.scheme_code}|${paper.subject_code}`
      const list = map.get(key) ?? []
      list.push(paper)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [filtered])

  const active =
    query.trim() !== '' || scheme !== '' || branch !== '' || semester !== ''

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Search className="h-4 w-4 text-primary dark:text-accent-foreground" />
          Find your paper
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Search by subject or code, or narrow to your scheme, branch and
          semester.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <span className="mb-1.5 block text-sm font-medium">Scheme</span>
            <select
              value={scheme}
              onChange={(event) => setScheme(event.target.value)}
              className={fieldClass}
            >
              <option value="">Any scheme</option>
              {schemes.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
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
                setScheme('')
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
          bySubject.map(([key, subjectPapers]) => {
            const paper = subjectPapers[0]
            return (
              <Card key={key}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold leading-snug">
                    {paper.subject_name}
                  </p>
                  <Badge tone="neutral">{paper.subject_code}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {paper.scheme_name} · {paper.streams} ·{' '}
                  {semesterLabel(paper.semesters)}
                </p>
                <ul className="mt-3 space-y-2">
                  {subjectPapers.map((p) => (
                    <li key={p.url}>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                      >
                        {p.sessions}
                        <ExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })
        )}
      </div>
    </>
  )
}
