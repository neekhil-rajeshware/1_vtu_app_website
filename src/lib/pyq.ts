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
  /**
   * `1` / `2`, and the scheme's own name — `2025 CBCS` / `2022 CBCS`.
   *
   * Added 2026-10-07, when the py_qp backfill brought 2022-scheme papers in
   * beside the 2025-scheme ones: 360 of the 436 are now 2022 CBCS and 76 are
   * 2025 CBCS, against a page that until then had only ever held 2025 papers.
   *
   * The RPC also groups by `scheme_code`, which matters more than the filter it
   * enables. Its group key is (scheme_code, subject_code, subject_name,
   * base_file), and `base_file` is only the *filename* — stripped of the R2
   * folder that names the scheme — so a 2022 and a 2025 paper sharing a subject
   * code and a filename used to merge into one card, with `min(url)` quietly
   * choosing which of the two PDFs to link to.
   */
  scheme_code: string
  scheme_name: string
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
     * 436 on 2026-10-07, up from 59. That jump was real — the py_qp backfill
     * filled five session columns the RPC had never had data in — but the same
     * jump has lied before: an earlier version of the RPC counted rows and said
     * 170, because one subject per stream held the same files and those files
     * carried browser duplicate-download suffixes. So a rise here still means
     * "check the cell-shape handling" before it means "the collection grew".
     * What settles it is that the paper count and the filled-cell count moved
     * together; only one of them moving is a bug.
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
 * `yearSpan` and `documentCount` are defined in `./pyq-format` and re-exported
 * here, so every existing `from '@/lib/pyq'` import keeps working and nothing
 * has to know they moved.
 *
 * They moved because this module imports `next/headers`. A `'use client'`
 * component showing a paper needs both values, and a **value** import from here
 * pulls the server Supabase client into the browser bundle — the build fails
 * with "Ecmascript file had an error" and a five-deep import trace. Types are
 * unaffected; an `import type` is erased.
 */
export { documentCount, yearSpan } from './pyq-format'
