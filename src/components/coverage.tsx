/**
 * The figures on `/coverage`.
 *
 * Kept deliberately narrow: plain elements, no chart library. The site has no
 * charting dependency, and nothing here needs one — a fill is a div with a
 * width, and the grid is a table of coloured cells. Adding a charting bundle to
 * the public site to draw three bars would be a real cost for no gain.
 *
 * Colour decisions here were validated rather than eyeballed: the ramp in
 * `globals.css` is an ordinal single-hue blue, checked in both themes for
 * monotone lightness, step separation and a light end that clears 2:1 against
 * the card surface. Text inside a coloured cell is picked by the fill's
 * luminance, which is the one case where a label is allowed on a data colour.
 */

const n = (value: number) => value.toLocaleString('en-IN')

/**
 * One number, standing alone. A stat tile rather than a one-bar chart — a
 * single value has nothing to compare against, so a plot would add ink and no
 * information.
 */
export function StatTile({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {/* Proportional figures: `tabular-nums` is for columns, and makes a
          standalone number like 191 look loosely spaced at this size. */}
      <p className="mt-1 text-3xl font-bold leading-none tracking-tight">
        {typeof value === 'number' ? n(value) : value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  )
}

/**
 * A meter: one value against its real limit.
 *
 * The track is a lighter step of the fill's own hue, so the whole bar reads as
 * one state rather than as two unrelated colours. Percentages are printed for
 * anything with a small fill — a 1.7% bar is a sliver, and the number is what
 * the reader actually takes away.
 */
export function CoverageMeter({
  label,
  filled,
  total,
  note,
}: {
  label: string
  filled: number
  total: number
  note?: string
}) {
  const pct = total > 0 ? (filled / total) * 100 : 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold">{label}</span>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{n(filled)}</span>
          {' / '}
          {n(total)}
        </span>
      </div>

      <div
        role="meter"
        aria-label={label}
        aria-valuenow={filled}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuetext={`${n(filled)} of ${n(total)}`}
        className="mt-2 h-2.5 w-full overflow-hidden rounded-r bg-primary-soft"
      >
        <div
          className="h-full rounded-r bg-primary"
          style={{
            width: `${pct}%`,
            // A true 1.7% is under two pixels on a phone. Without a floor the
            // bar reads as empty, which is the one thing it must not say.
            minWidth: filled > 0 ? '0.5rem' : undefined,
          }}
        />
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">
        {note ?? `${pct.toFixed(pct < 10 ? 1 : 0)}% complete`}
      </p>
    </div>
  )
}

/**
 * Fill for a cell, and the ink that stays legible on it.
 *
 * `ink` is not decoration: white on the lightest step fails contrast, so the
 * two are chosen together. Both directions are checked against the card
 * surface, and the ink clears 4.5:1 on every step in both themes.
 */
function cellStyle(count: number): { className: string; ink: string } {
  if (count === 0) return { className: 'bg-muted', ink: 'text-muted-foreground' }
  if (count <= 8) {
    return { className: 'bg-[var(--cov-1)]', ink: 'text-[#0b1220] dark:text-white' }
  }
  if (count <= 15) {
    return { className: 'bg-[var(--cov-2)]', ink: 'text-white dark:text-[#0b1220]' }
  }
  return { className: 'bg-[var(--cov-3)]', ink: 'text-white dark:text-[#0b1220]' }
}

/**
 * A branch against a set of semesters, shaded by how many subjects it holds.
 *
 * A heatmap because the job is comparing magnitude across a grid — and because
 * the empty cells are the point. A student whose branch is missing sees it
 * immediately rather than inferring it from a total, which is why the row set is
 * chosen to be complete for its scheme rather than only the flattering half.
 *
 * Rendered as a real `<table>`: a screen reader gets row and column headers for
 * free, every empty cell carries the word "nothing yet" in its label rather than
 * relying on a grey the reader may not be able to distinguish, and a crawler
 * reads a caption, headings and a full set of branch names rather than a canvas.
 */
export type SchemeRow = {
  code: string
  name: string
  bySemester: Record<string, number>
  total: number
}

export function SchemeBranchTable({
  rows,
  semesters,
  caption,
  label,
}: {
  rows: SchemeRow[]
  /** The columns to draw, in order — a scheme's own span, not always all eight. */
  semesters: string[]
  caption: string
  /** Names the table row headers, e.g. "Branch". */
  label: string
}) {
  const ordered = [...rows].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[19rem] border-separate border-spacing-[2px] text-left sm:min-w-[34rem]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="pb-2 pr-3 text-xs font-semibold text-muted-foreground">
              {label}
            </th>
            {semesters.map((semester) => (
              <th
                key={semester}
                scope="col"
                className="pb-2 text-center text-xs font-semibold tabular-nums text-muted-foreground"
              >
                {semester}
              </th>
            ))}
            <th
              scope="col"
              className="pb-2 pl-3 text-center text-xs font-semibold text-muted-foreground"
            >
              All
            </th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((branch) => (
            <tr key={branch.code}>
              <th scope="row" className="py-1 pr-3 text-left align-middle sm:max-w-[16rem]">
                <span className="block text-sm font-medium">{branch.code}</span>
                {/* The full name is what makes a row scannable, and what pushes
                    every number off a phone screen. Below `sm` the code alone is
                    the label and the name is announced rather than drawn — the
                    reader knows their own branch code, and the numbers are the
                    reason they came. */}
                <span className="sr-only text-xs font-normal text-muted-foreground sm:not-sr-only sm:block sm:truncate">
                  {branch.name}
                </span>
              </th>
              {semesters.map((semester) => {
                const count = branch.bySemester[semester] ?? 0
                const { className, ink } = cellStyle(count)
                return (
                  <td key={semester} className="p-0">
                    <div
                      className={`grid h-9 w-full min-w-[2.5rem] place-items-center rounded text-xs font-semibold tabular-nums ${className} ${ink}`}
                    >
                      {count > 0 ? count : '—'}
                      <span className="sr-only">
                        {`${branch.name}, semester ${semester}: ${
                          count > 0 ? `${count} subjects` : 'nothing yet'
                        }`}
                      </span>
                    </div>
                  </td>
                )
              })}
              <td className="p-0">
                <div className="grid h-9 w-full min-w-[2.75rem] place-items-center rounded bg-muted/60 text-xs font-bold tabular-nums">
                  {branch.total > 0 ? branch.total : '—'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Three swatches and their thresholds. A legend is not optional with a ramp. */
export function GridLegend() {
  const steps = [
    { className: 'bg-muted', label: 'Nothing yet' },
    { className: 'bg-[var(--cov-1)]', label: '1–8 subjects' },
    { className: 'bg-[var(--cov-2)]', label: '9–15 subjects' },
    { className: 'bg-[var(--cov-3)]', label: '16 or more' },
  ]

  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`h-3.5 w-3.5 rounded-sm ${step.className}`} aria-hidden="true" />
          {step.label}
        </li>
      ))}
    </ul>
  )
}
