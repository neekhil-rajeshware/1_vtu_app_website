import { ChevronDown } from 'lucide-react'
import { Container, Section, SectionHeading } from '@/components/ui'
import { groupFaqs, type Faq, type HomeSection } from '@/lib/content'

/**
 * FAQ list built from <details> elements, so it opens and closes without any
 * JavaScript and stays keyboard accessible. Also emits FAQPage structured data
 * so the questions can appear directly in Google results.
 */
export function FaqSection({
  section,
  faqs,
  grouped = false,
  showHeading = true,
}: {
  section?: HomeSection
  faqs: Faq[]
  grouped?: boolean
  showHeading?: boolean
}) {
  if (faqs.length === 0) return null

  const groups = grouped
    ? groupFaqs(faqs)
    : [{ name: '', items: faqs }]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <Section>
      <Container>
        {showHeading ? (
          <SectionHeading
            eyebrow="FAQ"
            title={section?.heading || 'Questions students ask'}
            subtitle={section?.subheading ?? undefined}
          />
        ) : null}

        <div className={showHeading ? 'mx-auto mt-12 max-w-3xl space-y-10' : 'mx-auto max-w-3xl space-y-10'}>
          {groups.map((group) => (
            <div key={group.name || 'all'}>
              {group.name ? (
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.name}
                </h3>
              ) : null}

              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {group.items.map((faq) => (
                  <details key={faq.id} className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-[0.95rem] font-semibold transition-colors hover:bg-muted/60">
                      <span className="flex-1">{faq.question}</span>
                      <ChevronDown
                        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Section>
  )
}
