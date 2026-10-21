import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Heart, Mail, ShieldCheck, Target } from 'lucide-react'
import { ClosingCta } from '@/components/sections/closing-cta'
import { StatsStrip } from '@/components/sections/stats-strip'
import { buttonClass, Card, Container, PageHeader, Section } from '@/components/ui'
import { getStats } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { appName, developerAddress, getSettings } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'About One Ed Tech',
    description:
      'One Ed Tech is the independent studio behind One VTU — who builds it, who it is for, and what the app does with your data.',
    path: '/about',
  })
}

const VALUES = [
  {
    icon: Target,
    title: 'Filtered, not flooded',
    body: 'You should never scroll past five other branches to find your own syllabus. Tell the app your course once and it stops showing you anything else.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data stays yours',
    body: 'Attendance, marks and notes are stored on your phone, not on our servers. Backups go to your own Google Drive, into a folder only this app can see.',
  },
  {
    icon: Heart,
    title: 'Free, and honest about it',
    body: 'The app is free and funded by ads. There is no subscription, no paywalled syllabus, and no selling your information to anyone.',
  },
]

export default async function AboutPage() {
  const [settings, stats] = await Promise.all([getSettings(), getStats()])
  const { about, contact, footer, developer } = settings
  const name = appName(settings)
  const address = developerAddress(developer)

  return (
    <>
      <PageHeader
        eyebrow="About"
        title={about.heading || 'Why we built this'}
        subtitle={about.mission || undefined}
      />

      <StatsStrip stats={stats} />

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {about.story ? (
              <p className="text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
                {about.story}
              </p>
            ) : null}

            <div className="mt-8 space-y-4">
              {VALUES.map((value) => (
                <div key={value.title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-foreground">
                    <value.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold">{value.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {value.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/*
              The company block. Before this, the only place the business was
              named was the copyright line, and the legal pages called the
              publisher by a person's name — which is exactly what an ad network
              or payment provider checks the site against. It reads from the
              same `developer` row the legal pages use, so the two cannot drift.
            */}
            <Card>
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <Building2 className="h-4 w-4 text-primary dark:text-accent-foreground" />
                The company
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {name} is published by{' '}
                <strong>{developer.legal_name || 'an independent studio'}</strong>
                , an independent app studio based in {developer.city || 'India'}.
                It is owned and run by Neekhil — a solo developer who designs,
                builds and supports every app the studio ships. Alongside {name},
                the studio is building One VTU Autonomous, One India University
                and One India PUC.
              </p>

              <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
                {contact.support_email ? (
                  <div className="flex gap-3">
                    <dt className="w-16 shrink-0 text-muted-foreground">Email</dt>
                    <dd className="min-w-0 break-all">
                      <a
                        href={`mailto:${contact.support_email}`}
                        className="font-medium text-primary hover:underline dark:text-accent-foreground"
                      >
                        {contact.support_email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {developer.phone ? (
                  <div className="flex gap-3">
                    <dt className="w-16 shrink-0 text-muted-foreground">Phone</dt>
                    <dd>
                      <a
                        href={`tel:${developer.phone.replace(/\s+/g, '')}`}
                        className="font-medium text-primary hover:underline dark:text-accent-foreground"
                      >
                        {developer.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {address ? (
                  <div className="flex gap-3">
                    <dt className="w-16 shrink-0 text-muted-foreground">Address</dt>
                    <dd className="leading-relaxed">{address}</dd>
                  </div>
                ) : null}
              </dl>
            </Card>

            <Card>
              <h3 className="text-sm font-bold">Get in touch</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Found a mistake in the syllabus? Missing a question paper? Tell us
                and we will fix it.
              </p>
              {contact.support_email ? (
                <a
                  href={`mailto:${contact.support_email}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline dark:text-accent-foreground"
                >
                  <Mail className="h-4 w-4" />
                  {contact.support_email}
                </a>
              ) : null}
              <Link
                href="/contact"
                className={buttonClass('outline', 'sm', 'mt-4 w-full')}
              >
                Open the contact form
              </Link>
            </Card>

            {footer.disclaimer ? (
              <Card className="bg-muted/60">
                <h3 className="text-sm font-bold">An important note</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {footer.disclaimer}
                </p>
              </Card>
            ) : null}
          </div>
        </Container>
      </Section>

      <ClosingCta settings={settings} />
    </>
  )
}
