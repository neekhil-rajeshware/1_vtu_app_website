import { DynamicIcon } from '@/components/dynamic-icon'

/** Tiles drawn in the placeholder screen, mirroring the app's home grid. */
const PLACEHOLDER_TILES = [
  { icon: 'ScrollText', label: 'Syllabus' },
  { icon: 'FileText', label: 'PYQ Papers' },
  { icon: 'Brain', label: 'AI Professor' },
  { icon: 'ClipboardCheck', label: 'Attendance' },
  { icon: 'Sigma', label: 'Formulas' },
  { icon: 'Calculator', label: 'CGPA' },
]

/**
 * Phone frame for the hero. Shows the screenshot the admin uploads in
 * Admin -> Home Page -> Hero image. Until one is uploaded it draws a
 * representative app screen, so the hero never has an empty hole in it.
 */
export function PhoneMockup({
  imageUrl,
  appName,
}: {
  imageUrl?: string | null
  appName: string
}) {
  return (
    <div className="relative w-[17rem] sm:w-[19rem]">
      <div
        className="absolute -inset-6 rounded-[3rem] opacity-30 blur-2xl"
        style={{
          background:
            'linear-gradient(150deg, var(--primary), var(--secondary))',
        }}
        aria-hidden="true"
      />
      <div className="relative rounded-[2.4rem] border border-border bg-card p-2.5 shadow-2xl">
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.9rem] bg-muted">
          <div className="absolute left-1/2 top-2 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-foreground/20" />
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`${appName} app screen`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col gap-3 px-3.5 pb-4 pt-8">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-[0.7rem] font-bold text-primary-foreground">
                  {appName.slice(0, 1).toUpperCase()}
                </span>
                <div className="flex-1">
                  <div className="h-2 w-20 rounded-full bg-foreground/15" />
                  <div className="mt-1.5 h-1.5 w-14 rounded-full bg-foreground/10" />
                </div>
              </div>

              <div
                className="rounded-xl p-3 text-primary-foreground"
                style={{
                  background:
                    'linear-gradient(120deg, var(--primary), var(--secondary))',
                }}
              >
                <p className="text-[0.6rem] font-semibold uppercase tracking-wider opacity-80">
                  Semester 5 · CSE
                </p>
                <p className="mt-1 text-xs font-bold">Next exam in 12 days</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PLACEHOLDER_TILES.map((tile) => (
                  <div
                    key={tile.label}
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-card px-1 py-2.5 shadow-sm"
                  >
                    <DynamicIcon
                      name={tile.icon}
                      className="h-4 w-4 text-primary dark:text-accent-foreground"
                    />
                    <span className="text-center text-[0.5rem] font-semibold leading-tight text-muted-foreground">
                      {tile.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto space-y-2">
                <div className="h-8 rounded-xl bg-card shadow-sm" />
                <div className="h-8 rounded-xl bg-card shadow-sm" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
