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
  /** 0 for a scheme with no subjects yet — see `emptySchemes` on the page. */
  subjects: number
}

/**
 * Per-scheme semester cells: `scheme code` → `branch code` → `semester` → count.
 *
 * `CoverageBranch.by_semester` is the union across every scheme, which is the
 * right shape for the grid and the wrong shape for the checker. Eight branch
 * codes are covered by two schemes — CH is 2025 in semesters 1–4 and 2022 in
 * 5–7 — so a union would let a 2025 cell answer a 2022 question, telling a
 * student we have their semester when the app would show them nothing. The
 * checker reads this instead.
 *
 * `FIRST` is a key in here too, per scheme: first year is common to every
 * branch but not across schemes.
 */
export type SchemeBranches = Record<string, Record<string, Record<string, number>>>

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
    scheme_branches: SchemeBranches
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

/** One branch as the checker needs it: a name, and per-scheme semester counts. */
export type CheckRow = {
  code: string
  name: string
  byScheme: Record<string, Record<string, number>>
}

const ALL_SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8']

/** A scheme's own table: the rows to draw, the columns to draw them in, the gaps. */
export type SchemeTable = {
  code: string
  name: string
  subjects: number
  rows: Array<{ code: string; name: string; bySemester: Record<string, number>; total: number }>
  /** Semesters this scheme has rows in, as a contiguous span so numbering has no holes. */
  semesters: string[]
  /** Semesters inside that span with nothing in them. */
  emptySemesters: string[]
  /** Branches this scheme has no subjects for, by name, for the sentence below. */
  missingBranches: string[]
  /** Whether a `FIRST` row exists — it is folded into rows, not listed as one. */
  schemeHasFirstYear: boolean
}

/**
 * One table per scheme, rather than one table of everything.
 *
 * A single combined grid reads well until two schemes cover the same branch in
 * different semesters — Chemical Engineering is 2025 CBCS in 1–4 and 2022 CBCS in
 * 5–7 — at which point it shows seven filled cells for a branch that no student
 * can ever see filled, because no single scheme covers all seven. Splitting by
 * scheme costs a second table and makes every cell mean one thing.
 *
 * A cell is what a student on that branch and semester gets, first year
 * included, because that is the question the page exists to answer. Own rows and
 * the shared `FIRST` row are summed together here, so the table and
 * `checkerRows()` cannot disagree.
 *
 * Columns are the scheme's own span, not always all eight: a 2022-scheme student
 * is never in semester 1, and five columns of guaranteed dashes would bury the
 * three that matter. The gap is not dropped, it is said in words instead —
 * `emptySemesters` is what the prose under each table names.
 */
export function schemeTables(coverage: Coverage): SchemeTable[] {
  const byScheme = coverage.snapshot.catalogue.scheme_branches ?? {}
  const nameOf = new Map(coverage.allBranches.map((branch) => [branch.code, branch.name]))

  return coverage.snapshot.catalogue.schemes
    .filter((scheme) => scheme.subjects > 0)
    .map((scheme) => {
      const cells = byScheme[scheme.code] ?? {}
      const firstYear = cells.FIRST ?? {}

      /*
       * First year is folded into semesters 1 and 2 of every row rather than
       * given a row of its own. As its own row it made forty rows read "—" for
       * a semester that in fact holds 56 subjects, and — worse — it disagreed
       * with the checker further down this same page, which folds. `FIRST` is
       * not a branch, so it is dropped here; `schemeHasFirstYear` remembers it.
       */
      const rows = Object.entries(cells)
        .filter(([code]) => code !== 'FIRST')
        .map(([code, bySemester]) => {
          const folded: Record<string, number> = { ...firstYear }
          for (const [semester, count] of Object.entries(bySemester)) {
            folded[semester] = (folded[semester] ?? 0) + count
          }
          return {
            code,
            name: nameOf.get(code) ?? code,
            bySemester: folded,
            total: Object.values(folded).reduce((sum, value) => sum + value, 0),
          }
        })

      const used = ALL_SEMESTERS.filter((semester) =>
        rows.some((row) => (row.bySemester[semester] ?? 0) > 0),
      )
      // A contiguous span, so a scheme with sems 1 and 8 does not label its third
      // column "8" and imply seven semesters of data before it.
      const first = ALL_SEMESTERS.indexOf(used[0] ?? '')
      const last = ALL_SEMESTERS.indexOf(used.at(-1) ?? '')
      const semesters =
        used.length > 0 ? ALL_SEMESTERS.slice(first, last + 1) : ALL_SEMESTERS.slice(0, 2)

      return {
        code: scheme.code,
        name: scheme.name,
        subjects: scheme.subjects,
        rows,
        semesters,
        schemeHasFirstYear: cells.FIRST !== undefined,
        emptySemesters: semesters.filter(
          (semester) => !rows.some((row) => (row.bySemester[semester] ?? 0) > 0),
        ),
        missingBranches: coverage.allBranches
          .filter((branch) => cells[branch.code] === undefined)
          .map((branch) => branch.name)
          .sort((a, b) => a.localeCompare(b)),
      }
    })
}

/**
 * Every branch, with each scheme's per-semester counts already folded.
 *
 * First year is the reason this is not a straight lookup. VTU's first year is
 * common to every branch, so semesters 1 and 2 are the branch's own rows *plus*
 * the shared `FIRST` row — which means a branch with no subjects of its own
 * still correctly reports the first-year ones. `FIRST` itself is left alone
 * rather than doubled.
 *
 * The fold runs per scheme, not once across all of them: a branch can be on the
 * 2025 scheme for its early semesters and the 2022 scheme for its later ones,
 * and folding the 2025 first-year rows into a 2022 question would be wrong.
 *
 * The fold happens here so the client component stays a lookup, and so the one
 * place that knows VTU's first-year rule stays on the server.
 */
export function checkerRows(coverage: Coverage): CheckRow[] {
  const byScheme = coverage.snapshot.catalogue.scheme_branches ?? {}

  return coverage.allBranches.map((branch) => {
    const perScheme: Record<string, Record<string, number>> = {}

    for (const [scheme, branches] of Object.entries(byScheme)) {
      const own = branches[branch.code] ?? {}
      const firstYear = branches.FIRST ?? {}
      perScheme[scheme] =
        branch.code === 'FIRST'
          ? { ...own }
          : {
              ...own,
              '1': (own['1'] ?? 0) + (firstYear['1'] ?? 0),
              '2': (own['2'] ?? 0) + (firstYear['2'] ?? 0),
            }
    }

    return { code: branch.code, name: branch.name, byScheme: perScheme }
  })
}
