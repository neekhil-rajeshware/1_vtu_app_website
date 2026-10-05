import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * GATE and VTU question papers, for `/gate-pyqs` and `/vtu-pyqs`.
 *
 * Shapes mirror `gate_pyq_index()` and `vtu_pyq_index()`; if one changes, both
 * change. Counting and shaping happen in SQL because the shape knowledge lives
 * there — 20 quoted year columns, two live cell formats in each table, and a
 * paper referenced once per stream — and shipping 20 raw text columns per row
 * to the client would be waste.
 *
 * Both throw on a failed read rather than returning `null`. `getCoverage()`
 * returns null and `/coverage` renders an "unavailable" state, which is right
 * for a page whose whole content is the live count — it can still tell the
 * reader to try again. These two pages have nothing to say without their rows,
 * and a `null` here sent them to `notFound()`: a 404 tells a crawler the URL is
 * gone for good, so a database blip would drop the page from the index. A
 * thrown error renders a 500 instead, which is the failure a crawler retries.
 */

export type GateAsset = {
  url: string
  /** `Session 1` / `Session 2` where a year had two sittings, else `null`. */
  label: string | null
}

export type GateYear = {
  year: number
  paper: GateAsset[]
  answer_key: GateAsset[]
}

export type GatePaper = {
  code: string
  name: string
  slug: string
  year_from: number
  year_to: number
  /** Newest first. Empty years are absent, not blank. */
  years: GateYear[]
  /**
   * The codes the paper's own files are named after, read off the filenames.
   *
   * Usually just `code`. Measured 2026-10-02, 29 of the 52 depart from it — AR,
   * AU, MM, MS, MT, RA and RI each hold copies of ME's 60 PDFs for every year
   * from 2007 to 2026, and EA, ET, ML and UE hold EC's 37. All of those URLs
   * return real PDFs, which is why nothing caught it: a link that serves bytes
   * is not a link that is correct.
   *
   * Empty for the 15 papers whose filenames carry no `XX<year>` code at all.
   * The page prints these codes so a reader can see which paper they are
   * actually getting; it does not decide whether that is the intended data.
   */
  source_codes: string[]
}

export type GateIndex = {
  papers: GatePaper[]
  totals: {
    papers: number
    /** Question papers plus answer keys — 1,776 on 2026-10-02. */
    documents: number
    year_from: number
    year_to: number
  }
}

export type VtuPaper = {
  subject_code: string
  subject_name: string
  /**
   * Every stream the subject is listed under, comma-separated — `EEE` for most,
   * `CSE, CV, ECE, EEE, ME` for a first-year subject every branch sits.
   *
   * The set, not one member of it. `subjects` holds one row per stream, and the
   * first cut of `vtu_pyq_index()` resolved them with `limit 1` and no ORDER BY:
   * 1BESC104A is listed under CSE, ECE, EEE and ME, and the page printed "EEE".
   *
   * A subject common to every branch used to come back as the literal `ALL`,
   * with the site holding a constant that knew what that meant. The RPC expands
   * it now, so the value is always real stream names and no consumer needs to
   * know a sentinel exists. `All branches` survives only as the fallback for a
   * paper whose filename resolves to no subject at all, where the branch is
   * genuinely unknown.
   */
  streams: string
  /**
   * The semesters the subject is taught in — `1`, `2`, `1 & 2`, or the literal
   * `Not recorded`.
   *
   * A set for the same reason `streams` is, and NULL is a real answer: 15 of the
   * 33 subjects behind these papers have no `subjects.semester` at all, so the
   * RPC labels that rather than guessing. A blank dropdown entry would look like
   * a bug; "Semester not recorded" is the truth.
   */
  semesters: string
  /** One or more sittings, e.g. `Dec 2025 – Jan 2026, June – July 2026`. */
  sessions: string
  url: string
}

export type VtuIndex = {
  papers: VtuPaper[]
  totals: {
    /**
     * Distinct documents, not filled cells and not rows.
     *
     * 59 on 2026-10-02. An earlier version of the RPC counted rows and said
     * 170: one subject per stream held the same files, and those files carried
     * browser duplicate-download suffixes. If this number jumps, suspect the
     * cell-shape handling before believing the collection grew.
     */
    papers: number
    subjects: number
    sessions: number
    schemes: number
  }
}

export const getGateIndex = cache(async (): Promise<GateIndex> => {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('gate_pyq_index')
  if (error) throw new Error(`gate_pyq_index failed: ${error.message}`)
  if (!data) throw new Error('gate_pyq_index returned no payload')

  return data as GateIndex
})

export const getVtuIndex = cache(async (): Promise<VtuIndex> => {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('vtu_pyq_index')
  if (error) throw new Error(`vtu_pyq_index failed: ${error.message}`)
  if (!data) throw new Error('vtu_pyq_index returned no payload')

  return data as VtuIndex
})

/**
 * `2007` or `2007–2026`, en dash.
 *
 * Here rather than in each page because the hub heading, the per-paper page and
 * the `<meta>` all need it, and three copies of one piece of arithmetic is
 * three chances for a paper to be described two different ways.
 */
export function yearSpan(from: number, to: number): string {
  return from === to ? String(from) : `${from}–${to}`
}

/** How many PDFs a paper actually has, answer keys included. */
export function documentCount(paper: GatePaper): number {
  return paper.years.reduce(
    (total, year) => total + year.paper.length + year.answer_key.length,
    0,
  )
}
