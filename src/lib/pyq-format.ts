/**
 * The two shape helpers from `lib/pyq.ts` that a **client** component needs.
 *
 * `lib/pyq.ts` imports `next/headers` at the top, so importing a *value* from it
 * inside a `'use client'` file drags the server Supabase client into the browser
 * bundle and the build fails with "Ecmascript file had an error". Types are
 * fine (an `import type` is erased); values are not.
 *
 * They live here rather than being re-implemented inside the browser, because
 * the hub heading, the metadata, the card and the per-paper page all need the
 * same arithmetic, and four copies of it is four chances for one paper to be
 * described two different ways. `pyq.ts` re-exports both, so no existing import
 * site changes.
 */

import type { GatePaper } from '@/lib/pyq'

/** `2007` or `2007–2026`, en dash. */
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
