import { Star } from 'lucide-react'
import { Container, Section, SectionHeading } from '@/components/ui'
import type { HomeSection, Testimonial } from '@/lib/content'

/** Student quotes. Managed in Admin -> Testimonials. */
export function Testimonials({
  section,
  testimonials,
}: {
  section?: HomeSection
  testimonials: Testimonial[]
}) {
  if (testimonials.length === 0) return null

  return (
    <Section className="bg-muted/40">
      <Container>
        <SectionHeading
          eyebrow="Testimonials"
          title={section?.heading || 'What students say'}
          subtitle={section?.subheading ?? undefined}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex gap-0.5" aria-label={`${item.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={
                      index < item.rating
                        ? 'h-4 w-4 fill-current text-warning'
                        : 'h-4 w-4 text-border'
                    }
                    aria-hidden="true"
                  />
                ))}
              </div>

              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                “{item.quote}”
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary dark:text-accent-foreground">
                  {item.student_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {item.student_name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[item.branch, item.college].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  )
}
