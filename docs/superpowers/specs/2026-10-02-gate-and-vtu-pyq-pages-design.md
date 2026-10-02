# Question-paper pages: GATE and VTU PYQs

**Date:** 2026-10-02
**Repo:** `onevtu-website`
**Status:** awaiting review

## Why this exists

Students search for question papers by name — *"GATE computer science previous year papers
with solutions"*, *"VTU 1st year question papers 2025 scheme"*. The app holds both datasets
and the website exposes neither. These pages turn data we already own into search traffic,
and route that traffic toward the app.

Success: these pages rank for their paper-specific queries, and a visitor who lands on one
has a clear, honest reason to install.

## What we decided, and what we are not doing

**We show everything.** No teaser, no "install to see more". Every paper and answer key is
linked directly from the page.

Three reasons, and they are worth keeping written down because the instinct to gate is
strong and wrong here:

1. **The gate would be cosmetic.** Every PDF already sits at a public `r2.dev` URL that
   anyone can open without the app. Gating hides the link, not the file.
2. **It would destroy the ranking we are building this for.** Google ranks a page on the
   content it can read. A page titled "GATE Previous Year Papers — All Branches" that shows
   two of 885 papers is, in Google's terms, a doorway page — a page that exists to push
   people elsewhere rather than to be useful. Those get devalued.
3. **Nobody installs an app to download a PDF they can already find.** The app's real,
   defensible value is papers organised by *your* branch and semester, offline access,
   answer keys beside the paper, and the AI Professor explaining why an answer is right.
   **That is the pitch.** It is stronger than a wall.

## Page inventory

### `/gate-pyqs` — hub

Lists all 52 GATE papers. Each row: paper name, code, and how many years are covered.
Links to its own page. Plus a short intro and the totals ("52 papers, 887 papers, keys and
solutions, 2007 to 2026") — **derived from the data, never typed**, because a hardcoded
range sitting next to a derived count is what already produced a wrong figure on
`/coverage` once.

### `/gate-pyqs/[slug]` — one page per paper (52)

The body of the work, and where the traffic is. People search the *specific* paper, not the
generic term.

Each page lists every year the paper actually has, newest first, with the assets that exist
for that year, each linked: Question paper · Answer key · Solved paper. The page states the
span it covers — 2007–2026 for a long-running paper, 2024–2026 for a newer one — and does
not pad the list with empty years.

A short intro per paper, written, not templated. This is the one part that cannot be
mail-merged: 52 pages sharing boilerplate is exactly the pattern Google's scaled-content
policy targets. What keeps these clear of it is that each carries genuinely different
content — different papers, different year coverage, different asset counts — and the intro
must be specific to the paper rather than describing the site.

### `/vtu-pyqs` — the honest small one

`py_qp` holds 69 filled cells, but only **32 distinct PDFs** — the same file is referenced
once per stream. So the page lists **32 papers**, each noting the streams and session it
belongs to, rather than repeating one document across three rows. All 2025 scheme, all first
year, from two sessions (January 2026 and June 2026).

Titled and scoped for what it is — *VTU first-year question papers, 2025 scheme* — not
"VTU previous year question papers". A 2022-scheme fifth-semester student landing on a page
that promises everything and holds first-year papers has been misled, and that is the exact
failure mode `/coverage` was built to avoid.

Grouped by subject (name resolved from `subjects` via the paper's subject code) with its
session. Ends with a request-a-paper prompt, reusing the `/contact` prefill pattern
`/coverage` already uses.

## Data layer

Two read functions, following `content_coverage()` exactly — `SECURITY INVOKER`, `stable`,
`set search_path = public`, `revoke all from public`, `grant execute to anon, authenticated`.
Counting and shaping live in SQL because the shape knowledge does, and because shipping 20
raw text columns per row to the client is waste.

**`public.gate_pyq_index()`** → jsonb

```
{ "papers": [ { "code", "name", "slug", "years": [ { "year", "paper", "answer_key", "solved" } ] } ],
  "totals": { "papers", "documents", "year_from", "year_to" } }
```

`year_from`/`year_to` are derived, so the metadata range can never contradict the count.

**`public.vtu_pyq_index()`** → jsonb

```
{ "papers": [ { "subject_code", "subject_name", "stream", "session", "url" } ],
  "totals": { "papers", "sessions", "schemes" } }
```

The subject code is the leading token of the PDF filename (`1BMATC101 - January-2026.pdf`),
joined to `subjects` for a display name. Where a subject code resolves to nothing, the code
is shown as-is rather than the row being dropped.

### A migration first: name and slug on `gatepyqs`

`gatepyqs` has only `code` and 20 year columns. The paper's name exists only inside the R2
path (`CS_Computer_Science_%26_Engineering`), so deriving it at request time means
regex-parsing URL-encoded folder names on every render, and deriving the slug means doing it
unpredictably.

One migration adds `name` and `slug` (`unique`) to `gatepyqs`, populated once from those
folder names: decode `%26` → `&`, drop the leading `<CODE>_`, underscores → spaces; slug is
the name lowercased with runs of non-alphanumerics collapsed to `-`
(`CS_Computer_Science_%26_Engineering` → name *Computer Science & Engineering*, slug
`computer-science-engineering`).

The migration asserts the slug count equals the row count, so a silent collision fails loudly.

## Copy rules

Carried over from the existing feature pages, all of which were learned by getting them wrong:

- Facts come from the data. Any number in a heading or `<meta>` is derived or states a floor.
- The VTU page never implies broader coverage than it has.
- `seo_title` ≤ 60 chars, `seo_description` 124–161.
- Metadata per paper page is built from that paper's real span, e.g.
  *"GATE Computer Science & Engineering Previous Year Papers (2007–2026)"* — with the span
  computed, so a paper that only covers 2024–2026 does not claim otherwise.

## Conversion

One block, reused on every page, selling what the website cannot do:

> **In the app:** every paper for your branch and semester, already sorted; the whole set
> saved offline; answer keys beside the paper; and the AI Professor to explain any question
> you get wrong.

Placed at the end of the paper list, after the visitor has what they came for. No modal, no
interstitial, nothing that stands between the student and the PDF.

## Cross-linking

- `/coverage` → `/gate-pyqs` and `/vtu-pyqs`. Its existing "Question paper links" tile
  becomes a link, which also gives the coverage page a place to send people for the one
  dataset it currently reports as nearly empty.
- Both paper pages → each other, and back to `/coverage`.
- Blog posts → the relevant page via the `TAG_FEATURE_SLUG` map in `src/lib/content.ts`.
  New tags (`GATE`, `Previous Year Papers`) need entries there; without one a post silently
  renders no link block, which has already happened once.
- Paper pages → `/features/previous-year-papers` and the GATE calculator feature.

## Sitemap and SEO

- `sitemap.ts`: add `/gate-pyqs` and `/vtu-pyqs` to `STATIC_ROUTES`, and emit the 52 paper
  URLs. Dateless except where a real `lastmod` exists.
- Paper pages get `BreadcrumbList` (they are nested under `/gate-pyqs`); the two hubs do not,
  matching the site's existing rule.
- The PDFs stay on `r2.dev`, a separate domain, so Google indexes them there rather than
  under `onevtu.in`. Accepted for now; proxying them under our own domain is a later
  decision with a bandwidth cost attached.

## Phasing

**Phase 1** — migration (`name`/`slug`), the two RPCs, `/gate-pyqs` hub, `/vtu-pyqs`,
cross-links, sitemap.
**Phase 2** — the 52 per-paper pages with written intros.

Phase 1 is small and ships first so the hub and the cross-links can be seen working before
committing to the larger surface.

## Risks

- **52 templated pages.** Mitigated by specific intros and genuinely differing content.
  If the intros end up generic, Phase 2 does more harm than good — worth reviewing a few
  before generating all 52.
- **A thin VTU page.** Accepted, and handled by scoping its title honestly rather than by
  padding it.
- **Data that stops growing.** `py_qp` has 115,620 slots and 69 filled. The page's quality
  is capped by that, and no amount of page design moves it — the lever is collecting papers.

## Verification

- `tsc --noEmit` and a production build.
- Curl production, not the dev server: confirm the hub lists 52, a sampled paper page shows
  its real years, and every linked PDF returns a non-empty 200. A link in the table is not a
  link that works.
- Sample a paper with partial coverage (`DS`, 3 years) and one with full (`CS`, 20) to prove
  the derived span is right in both directions.
