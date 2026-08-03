import { DynamicIcon } from '@/components/dynamic-icon'
import { Container } from '@/components/ui'
import type { Stat } from '@/lib/content'

/** Numbers strip under the hero. Edited in Admin -> Home Page -> Stats. */
export function StatsStrip({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null

  return (
    <section className="border-y border-border bg-muted/40">
      <Container className="py-8">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.id} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-foreground">
                <DynamicIcon name={stat.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <dt className="truncate text-xs font-medium text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="text-lg font-bold leading-tight">{stat.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
