import { Check, X } from 'lucide-react'
import { Container, Section, SectionHeading } from '@/components/ui'
import type { HomeSection } from '@/lib/content'

const WITHOUT = [
  'Hunting through WhatsApp groups for the right syllabus PDF',
  'Last year’s papers scattered across six different drive links',
  'Attendance maths on the back of a notebook, two weeks too late',
  'Formula sheets photographed from a friend’s book',
  'CGPA guessed with an online calculator that assumes the wrong scheme',
  'Exam dates found out from a classmate the night before',
]

const WITH = [
  'Your scheme’s syllabus, opened in two taps',
  'Previous year papers sorted by subject and year, in one place',
  'Live attendance percentage, and how many classes you can still miss',
  'A searchable formula library with a built-in calculator',
  'SGPA and CGPA worked out for your actual scheme and credits',
  'Exam timetable on your home screen, with reminders',
]

/** Side-by-side before / after comparison. */
export function WhyUs({
  section,
  appName,
}: {
  section?: HomeSection
  appName: string
}) {
  return (
    <Section className="bg-muted/40">
      <Container>
        <SectionHeading
          eyebrow={`Why ${appName}`}
          title={section?.heading || 'The difference it makes'}
          subtitle={section?.subheading ?? undefined}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary-soft text-secondary">
                <X className="h-4 w-4" />
              </span>
              Without it
            </h3>
            <ul className="mt-4 space-y-3">
              {WITHOUT.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-primary/25 bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-primary dark:text-accent-foreground">
                <Check className="h-4 w-4" />
              </span>
              With {appName}
            </h3>
            <ul className="mt-4 space-y-3">
              {WITH.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  )
}
