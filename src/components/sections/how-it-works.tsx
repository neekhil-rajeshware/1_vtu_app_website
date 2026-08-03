import { Download, GraduationCap, Sparkles } from 'lucide-react'
import { Container, Section, SectionHeading } from '@/components/ui'
import type { HomeSection } from '@/lib/content'

const STEPS = [
  {
    icon: Download,
    title: 'Install and open',
    body: 'Free from Google Play. No account needed to look around — you can browse the syllabus and papers straight away.',
  },
  {
    icon: GraduationCap,
    title: 'Tell it your course',
    body: 'Branch, scheme, semester and cycle. One screen, under a minute. You can change any of it later from your profile.',
  },
  {
    icon: Sparkles,
    title: 'Everything filters itself',
    body: 'Syllabus, question papers, exam dates, subjects, formulas and job posts all narrow down to your exact course. No more scrolling past other branches.',
  },
]

/** Three-step onboarding explainer. */
export function HowItWorks({ section }: { section?: HomeSection }) {
  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title={section?.heading || 'Set up once, in under a minute'}
          subtitle={section?.subheading ?? undefined}
        />

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
