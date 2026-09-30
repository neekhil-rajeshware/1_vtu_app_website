'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Search } from 'lucide-react'
import { buttonClass } from '@/components/ui'
import type { CheckRow, CoverageScheme } from '@/lib/coverage'

const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8']

/** Matches the contact form's own list, so the prefill lands on the right option. */
const REQUEST_SUBJECT = 'Missing question paper or syllabus'

const selectClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary'

/**
 * "Is my branch in here?" — the one question the grid cannot answer for a
 * specific student.
 *
 * The grid shows everything at once, which is the right shape for a reader
 * surveying the catalogue and the wrong shape for someone who already knows
 * their branch and semester. This turns that survey into an answer, and pairs
 * every "no" with the one action that could change it.
 *
 * The asking is a link to the contact form rather than a form of its own: the
 * site already has a working message path into `web_messages`, and a second one
 * would be a second thing to keep working.
 */
export function CoverageChecker({
  rows,
  schemes,
}: {
  rows: CheckRow[]
  schemes: CoverageScheme[]
}) {
  const [branchCode, setBranchCode] = useState('')
  const [schemeCode, setSchemeCode] = useState('')
  const [semester, setSemester] = useState('')

  const ready = branchCode !== '' && schemeCode !== '' && semester !== ''

  const verdict = useMemo(() => {
    if (!ready) return null

    const branch = rows.find((row) => row.code === branchCode)
    const scheme = schemes.find((item) => item.code === schemeCode)
    if (!branch || !scheme) return null

    const request = new URLSearchParams({
      subject: REQUEST_SUBJECT,
      message:
        `Please add the ${scheme.name} subjects for ${branch.name}, ` +
        `semester ${semester}, to the app.`,
    })
    const href = `/contact?${request}`

    // A scheme with no rows at all is a bigger gap than a missing semester, and
    // saying so is more useful than reporting zero for one branch — every
    // branch would report zero, and the reader would think it was their branch.
    if (scheme.subjects === 0) {
      return {
        ok: false,
        title: `Nothing for the ${scheme.name} scheme yet`,
        body:
          `The app's subject list does not cover ${scheme.name} at all. If that is ` +
          `your scheme, we do not have your subjects — tell us and it moves up the list.`,
        request: href,
      }
    }

    const count = branch.byScheme[schemeCode]?.[semester] ?? 0
    if (count === 0) {
      return {
        ok: false,
        title: `Semester ${semester} for ${branch.name} is not in yet`,
        body:
          `We have nothing for this combination, so the app cannot show you a subject ` +
          `list, syllabus or question papers for it. Ask us for it and we will know ` +
          `which one to work on next.`,
        request: href,
      }
    }

    return {
      ok: true,
      title: `${count} subject${count === 1 ? '' : 's'} for ${branch.name}, semester ${semester}`,
      body:
        `Syllabus, previous-year papers and study tools are in the app for this ` +
        `combination. Coverage is per subject — if one of yours is missing, tell us ` +
        `and we will add it.`,
      request: href,
    }
  }, [ready, rows, schemes, branchCode, schemeCode, semester])

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <Search className="h-4 w-4 text-primary dark:text-accent-foreground" />
        Check your branch
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Pick the three and we will tell you exactly what is in the app for you.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Branch</span>
          <select
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
            className={selectClass}
          >
            <option value="">Select your branch</option>
            {rows.map((row) => (
              <option key={row.code} value={row.code}>
                {row.code === 'FIRST' ? `${row.name} (first year)` : row.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Scheme</span>
          <select
            value={schemeCode}
            onChange={(e) => setSchemeCode(e.target.value)}
            className={selectClass}
          >
            <option value="">Select your scheme</option>
            {schemes.map((scheme) => (
              <option key={scheme.code} value={scheme.code}>
                {scheme.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Semester</span>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className={selectClass}
          >
            <option value="">Select your semester</option>
            {SEMESTERS.map((value) => (
              <option key={value} value={value}>
                Semester {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/*
        The result is announced, not just shown: a screen-reader user changing a
        select has no reason to expect the panel below it to have changed, and
        the whole point of this component is that panel.
      */}
      <div aria-live="polite" className="mt-5">
        {verdict ? (
          <div
            className={`rounded-xl border p-4 ${
              verdict.ok
                ? 'border-border bg-muted/50'
                : 'border-secondary/40 bg-secondary-soft/40'
            }`}
          >
            <p className="flex items-start gap-2 text-sm font-bold">
              {verdict.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              )}
              {verdict.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {verdict.body}
            </p>
            <Link
              href={verdict.request}
              className={buttonClass(verdict.ok ? 'outline' : 'primary', 'sm', 'mt-3')}
            >
              {verdict.ok ? 'Report a missing subject' : 'Request this'}
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pick a branch, scheme and semester to see what we have.
          </p>
        )}
      </div>
    </div>
  )
}
