import { ArrowRight, Check } from 'lucide-react'
import { Badge, ButtonLink, Container, Section, SectionHeading } from '@/components/ui'
import type { HomeSection } from '@/lib/content'
import type { AllSettings } from '@/lib/settings'
import { appName } from '@/lib/settings'

/**
 * The second Android app, announced before it exists.
 *
 * VTU's autonomous colleges set their own syllabus, their own question papers
 * and their own exam timetable, so VTU's scheme codes are the wrong content for
 * them. That is why this is a separate app rather than a mode inside the first
 * one — and why this band exists at all: a site that only advertises
 * `com.oneedtech.onevtu` invites exactly the wrong install from a student who
 * cannot use it.
 *
 * The name and the package id are written out here for the same reason
 * `account-and-data.tsx` writes out the first app's — they are facts about an
 * Android build, not something the owner should be able to retitle into being
 * wrong. Everything a reader might want reworded (the heading, the subheading)
 * comes from Admin → Home page like every other section, and the whole band can
 * be hidden or moved from there.
 *
 * It does not promise a date, and it must not: it says "in development" because
 * that is what is true. The content tables behind the autonomous app are still
 * empty, so nothing here may suggest it is finished or that a student's college
 * is already covered.
 */
const AUTONOMOUS_APP_NAME = 'One VTU Autonomous'
const AUTONOMOUS_PACKAGE_NAME = 'com.oneedtech.onevtuautonomous'

/** Spelt exactly as `contact-form.tsx` has it — a near miss silently sends "General question". */
const REQUEST_SUBJECT = 'Autonomous college enquiry'

export function AutonomousApp({
  section,
  settings,
}: {
  section?: HomeSection
  settings: AllSettings
}) {
  const name = appName(settings)

  const request = new URLSearchParams({
    subject: REQUEST_SUBJECT,
    message: 'I study at an autonomous college. My college is: ',
  })

  const facts = [
    `For students at VTU's autonomous colleges`,
    `${AUTONOMOUS_APP_NAME}, published as`,
    'In development — not on the Play Store yet',
  ]

  return (
    <Section className="border-t border-border">
      <Container>
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
            <div>
              <Badge>Coming soon</Badge>
              <div className="mt-4">
                <SectionHeading
                  align="left"
                  title={section?.heading || AUTONOMOUS_APP_NAME}
                  subtitle={
                    section?.subheading ??
                    `A second app for students whose college is autonomous — the same tools, built around your college's own syllabus.`
                  }
                />
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Autonomous colleges run their own syllabus, their own question
                papers and their own exam timetable. {name} is built on VTU&apos;s
                schemes, so its subjects and papers are the wrong ones for you —
                which is why this is a separate app rather than a setting inside
                it. {AUTONOMOUS_APP_NAME} carries the same timetable, attendance,
                CGPA and study tools, pointed at your college instead.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <ButtonLink href={`/contact?${request}`} variant="primary">
                  Tell us your college
                  <ArrowRight className="h-[1.15rem] w-[1.15rem]" />
                </ButtonLink>
                <p className="text-sm text-muted-foreground">
                  We will write back when it is ready to install.
                </p>
              </div>
            </div>

            <ul className="space-y-4 rounded-2xl border border-border bg-muted/40 p-6">
              {facts.map((fact) => (
                <li key={fact} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-primary dark:text-accent-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="leading-relaxed">
                    {fact}
                    {fact.endsWith('published as') ? (
                      <>
                        {' '}
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {AUTONOMOUS_PACKAGE_NAME}
                        </code>
                      </>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  )
}
