import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonClass, Container, Section, SectionHeading } from '@/components/ui'
import type { HomeSection, Screenshot } from '@/lib/content'

/**
 * Horizontally scrolling row of phone screenshots. Hidden entirely when the
 * admin has not uploaded any yet, so the home page never shows empty frames.
 */
export function ScreenshotShowcase({
  section,
  screenshots,
}: {
  section?: HomeSection
  screenshots: Screenshot[]
}) {
  if (screenshots.length === 0) return null

  return (
    <Section className="overflow-hidden bg-muted/40">
      <Container>
        <SectionHeading
          eyebrow="Screenshots"
          title={section?.heading || 'Take a look inside'}
          subtitle={section?.subheading ?? undefined}
        />
      </Container>

      <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8">
        {screenshots.slice(0, 10).map((shot) => (
          <figure key={shot.id} className="w-[13.5rem] shrink-0 snap-center">
            <div className="overflow-hidden rounded-[1.6rem] border border-border bg-card p-1.5 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.image_url}
                alt={shot.title}
                loading="lazy"
                className="aspect-[9/19.5] w-full rounded-[1.25rem] object-cover"
              />
            </div>
            <figcaption className="mt-3 px-1">
              <p className="text-sm font-semibold">{shot.title}</p>
              {shot.caption ? (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {shot.caption}
                </p>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>

      <Container className="mt-8 text-center">
        <Link href="/screenshots" className={buttonClass('outline', 'md')}>
          View all screenshots
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Container>
    </Section>
  )
}
