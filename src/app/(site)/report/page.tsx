import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Clock, Mail, ShieldCheck } from 'lucide-react'
import { ReportForm } from '@/components/report-form'
import { Card, Container, PageHeader, Section } from '@/components/ui'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Report content',
  description:
    'Report an unsafe, misleading or illegal Student Marketplace listing. Reports can be sent anonymously.',
  alternates: { canonical: '/report' },
}

const STEPS = [
  {
    icon: ShieldCheck,
    title: 'We read every report',
    body: 'A person reviews it — not an automated filter. Nothing is dismissed without being looked at.',
  },
  {
    icon: Clock,
    title: 'Usually within 48 hours',
    body: 'Listings that look dangerous are hidden first and reviewed after, so nobody else gets caught out.',
  },
  {
    icon: AlertTriangle,
    title: 'Repeat offenders lose access',
    body: 'A first mistake usually means the listing comes down. A pattern means the account goes.',
  },
]

export default async function ReportPage() {
  const settings = await getSettings()
  const { contact } = settings

  return (
    <>
      <PageHeader
        eyebrow="Report content"
        title="Tell us about a listing"
        subtitle="Use this form for anything on the Student Marketplace that is unsafe, misleading, illegal or simply does not belong. You do not have to leave your name."
      />

      <Section>
        <Container className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <ReportForm />

          <div className="space-y-4">
            <Card>
              <h2 className="text-sm font-bold">What happens next</h2>
              <div className="mt-4 space-y-4">
                {STEPS.map((step) => (
                  <div key={step.title} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary dark:text-accent-foreground">
                      <step.icon className="h-[1.1rem] w-[1.1rem]" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-secondary/30 bg-secondary/5">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <AlertTriangle className="h-4 w-4 text-secondary" />
                Someone is in danger?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This form is not monitored around the clock. If anyone is in
                immediate danger, contact your local emergency number first — in
                India, dial 112 — and then tell us so we can remove the account.
              </p>
            </Card>

            {contact.support_email ? (
              <Card>
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Mail className="h-4 w-4 text-primary dark:text-accent-foreground" />
                  Sending screenshots
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The form does not take attachments. Submit it first, then email
                  your screenshots to us with the same listing title.
                </p>
                <a
                  href={`mailto:${contact.support_email}`}
                  className="mt-3 block break-all text-sm font-semibold text-primary hover:underline dark:text-accent-foreground"
                >
                  {contact.support_email}
                </a>
              </Card>
            ) : null}

            <Card>
              <h2 className="text-sm font-bold">Not sure if it breaks a rule?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Our Community Guidelines list exactly what may and may not be
                listed. Report it anyway if you are unsure — we would rather look
                twice.
              </p>
              <Link
                href="/community-guidelines"
                className="mt-3 inline-block text-sm font-semibold text-primary hover:underline dark:text-accent-foreground"
              >
                Read the Community Guidelines →
              </Link>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  )
}
