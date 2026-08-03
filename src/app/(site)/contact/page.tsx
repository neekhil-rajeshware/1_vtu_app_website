import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Flag, Mail } from 'lucide-react'
import { ContactForm } from '@/components/contact-form'
import { FaqSection } from '@/components/sections/faq'
import { SocialIcon, SOCIAL_LABELS, type SocialNetwork } from '@/components/social-icon'
import { Card, Container, PageHeader, Section } from '@/components/ui'
import { getFaqs } from '@/lib/content'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Ask a question, report a mistake, or request an account deletion.',
  alternates: { canonical: '/contact' },
}

const SOCIAL_ORDER: SocialNetwork[] = [
  'whatsapp',
  'youtube',
  'telegram',
  'instagram',
  'twitter',
  'linkedin',
]

export default async function ContactPage() {
  const [settings, faqs] = await Promise.all([getSettings(), getFaqs()])
  const { contact, social } = settings
  const activeSocials = SOCIAL_ORDER.filter((key) => social[key])
  const supportFaqs = faqs.filter((faq) => faq.category === 'Support')

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to us"
        subtitle="Questions, corrections, takedown requests and account deletions all come to the same place."
      />

      <Section>
        <Container className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <ContactForm responseTime={contact.response_time} />

          <div className="space-y-4">
            {contact.support_email ? (
              <Card>
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Mail className="h-4 w-4 text-primary dark:text-accent-foreground" />
                  Email us directly
                </h2>
                <a
                  href={`mailto:${contact.support_email}`}
                  className="mt-2 block break-all text-sm font-semibold text-primary hover:underline dark:text-accent-foreground"
                >
                  {contact.support_email}
                </a>
              </Card>
            ) : null}

            {contact.response_time ? (
              <Card>
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Clock className="h-4 w-4 text-primary dark:text-accent-foreground" />
                  Response time
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {contact.response_time}
                </p>
              </Card>
            ) : null}

            <Card>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Flag className="h-4 w-4 text-secondary" />
                Reporting a listing?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Unsafe or misleading Student Marketplace listings have their own
                form, so we can act on them faster.
              </p>
              <Link
                href="/report"
                className="mt-3 inline-block text-sm font-semibold text-primary hover:underline dark:text-accent-foreground"
              >
                Report content →
              </Link>
            </Card>

            {activeSocials.length > 0 ? (
              <Card>
                <h2 className="text-sm font-bold">Find us elsewhere</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeSocials.map((key) => (
                    <a
                      key={key}
                      href={social[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:text-primary dark:hover:text-accent-foreground"
                    >
                      <SocialIcon network={key} className="h-4 w-4" />
                      {SOCIAL_LABELS[key]}
                    </a>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </Container>
      </Section>

      {supportFaqs.length > 0 ? (
        <div className="border-t border-border bg-muted/40">
          <FaqSection faqs={supportFaqs} showHeading={false} />
        </div>
      ) : null}
    </>
  )
}
