import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type Crumb = { name: string; path: string }

/**
 * The visible breadcrumb trail, paired with `breadcrumbJsonLd` from
 * `@/lib/seo`, which emits the same trail as structured data.
 *
 * The last crumb is the current page, so it renders as plain text: linking a
 * page to itself does nothing for a reader and would put a self-referencing
 * link in the crawl path.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length < 2) return null

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1

          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
              ) : null}
              {isLast ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="transition-colors hover:text-primary dark:hover:text-accent-foreground"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
