import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * What the app actually contains, for `/coverage`.
 *
 * Everything here comes from `content_coverage()`, a SQL function rather than a
 * set of counts run from the website — see that function for why. The shape
 * below is a mirror of its `jsonb`; if one changes, both change.
 *
 * This module exists because the alternative is a page that quietly drifts. The
 * home page's numbers strip was hand-typed and had already gone wrong (it
 * advertised 338 formulas against a table of 6,255) which is precisely the
 * failure a "what is inside" page cannot afford.
 */

export type CoverageBranch = {
  /** A branch code, or `FIRST` for the first-year row every branch shares. */
  code: string
  name: string
  stream: string
  subjects: number
  with_syllabus: number
  /** Semester number as a string — `jsonb` object keys are always strings. */
  by_semester: Record<string, number>
}

export type CoverageScheme = {
  code: string
  name: string
  /** Usually 0. Only one scheme has any subjects at the time of writing. */
  subjects: number
}

export type CoverageLibraryItem = {
  key: string
  label: string
  count: number
  detail?: string
}

export type CoverageSnapshot = {
  generated_at: string
  catalogue: {
    branches_total: number
    branches_covered: number
    streams_total: number
    schemes_total: number
    schemes_covered: number
    colleges: number
    rows: number
    with_syllabus: number
    branches: CoverageBranch[]
    schemes: CoverageScheme[]
  }
  pyq: {
    rows: number
    sessions: number
    slots: number
    filled: number
    by_stream: Array<{ stream: string; filled: number }>
  }
  gate: { rows: number; years: number; slots: number; filled: number }
  library: CoverageLibraryItem[]
}

/** A branch a student can pick, including the ones the catalogue has nothing for. */
export type BranchOption = { code: string; name: string }

export type Coverage = {
  snapshot: CoverageSnapshot
  /** All fifty, from the `branches` table — not just the nine with subjects. */
  allBranches: BranchOption[]
}

/**
 * Cached per request: the home page calls this through `getStats()` and
 * `/coverage` calls it directly, and there is no reason to ask twice.
 *
 * Reading cookies makes the route dynamic, which is what "realtime" means here —
 * the page is rebuilt per request against the live tables. A websocket
 * subscription would add moving parts and no freshness the reader can perceive
 * on a number that changes when an admin uploads a PDF.
 */
export const getCoverage = cache(async (): Promise<Coverage | null> => {
  const supabase = await createClient()

  const [coverage, branches] = await Promise.all([
    supabase.rpc('content_coverage'),
    supabase.from('branches').select('code, name').order('name'),
  ])

  if (coverage.error || !coverage.data) return null

  return {
    snapshot: coverage.data as CoverageSnapshot,
    allBranches: (branches.data as BranchOption[]) ?? [],
  }
})

/**
 * Live values for the `web_stats` rows that name a metric.
 *
 * The numbers strip under the hero is admin-typed, which is right for the ones
 * nothing in the database backs ("Study tools", the unit converters — those live
 * in app code). The ones that *are* countable get their value from here instead,
 * so the strip cannot contradict `/coverage`.
 */
export async function coverageMetrics(): Promise<Record<string, string>> {
  const coverage = await getCoverage()
  if (!coverage) return {}

  const { catalogue, pyq, gate, library } = coverage.snapshot
  const formulas = library.find((item) => item.key === 'formulas')

  const n = (value: number) => value.toLocaleString('en-IN')

  return {
    ...(formulas ? { formulas: n(formulas.count) } : {}),
    gate_papers: n(gate.filled),
    syllabuses: n(catalogue.with_syllabus),
    branches_covered: n(catalogue.branches_covered),
    colleges: n(catalogue.colleges),
    pyq_papers: n(pyq.filled),
  }
}

/** One branch as the checker needs it: a name, and a semester → subject count. */
export type CheckRow = { code: string; name: string; counts: Record<string, number> }

/**
 * Every branch, with its per-semester counts already folded.
 *
 * First year is the reason this is not a straight lookup. VTU's first year is
 * common to every branch, so semesters 1 and 2 are the branch's own rows *plus*
 * the shared `FIRST` row — which means a branch with no subjects of its own
 * still correctly reports the first-year ones. `FIRST` itself is left alone
 * rather than doubled.
 *
 * The fold happens here so the client component stays a lookup, and so the one
 * place that knows VTU's first-year rule stays on the server.
 */
export function checkerRows(coverage: Coverage): CheckRow[] {
  const covered = new Map(
    coverage.snapshot.catalogue.branches.map((row) => [row.code, row.by_semester]),
  )
  const firstYear = covered.get('FIRST') ?? {}

  return coverage.allBranches.map((branch) => {
    const own = covered.get(branch.code) ?? {}
    const counts =
      branch.code === 'FIRST'
        ? { ...own }
        : {
            ...own,
            '1': (own['1'] ?? 0) + (firstYear['1'] ?? 0),
            '2': (own['2'] ?? 0) + (firstYear['2'] ?? 0),
          }
    return { code: branch.code, name: branch.name, counts }
  })
}
