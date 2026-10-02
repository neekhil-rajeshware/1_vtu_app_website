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
 * Both return `null` on error rather than throwing, matching `getCoverage()`,
 * so a route renders a 404 instead of a 500.
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
  streams: string
  sessions: string
  url: string
}

export type VtuIndex = {
  papers: VtuPaper[]
  totals: {
    /** Distinct PDFs, not filled cells. 170 on 2026-10-02. */
    papers: number
    subjects: number
    sessions: number
    schemes: number
  }
}

export const getGateIndex = cache(async (): Promise<GateIndex | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('gate_pyq_index')
  if (error || !data) return null

  return data as GateIndex
})

export const getVtuIndex = cache(async (): Promise<VtuIndex | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('vtu_pyq_index')
  if (error || !data) return null

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
