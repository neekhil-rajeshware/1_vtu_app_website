import type { Metadata } from 'next'
import { Heart, Lock, Sparkles } from 'lucide-react'
import { RazorpayButton } from '@/components/razorpay-button'
import { Card, Container, PageHeader, Section } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Support the Developer',
  description:
    'One VTU is free for every VTU student. If it helps you, you can optionally contribute any amount.',
  alternates: { canonical: '/support' },
}

/**
 * The One VTU app links here (via the `support_developer` row in `app_links`),
 * so the page has to stand on its own inside an in-app browser tab: no reliance
 * on the header nav, and the whole thing readable at phone width.
 *
 * Deliberately sells nothing. A contribution unlocks no feature, grants no
 * credits and removes no ads — that's what keeps it outside Play's in-app
 * purchase rules, which would otherwise require Play Billing instead of an
 * external payment page.
 */
const RAZORPAY_BUTTON_ID = 'pl_TasyXmSduWY9FT'

export default function SupportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Support the Developer"
        subtitle="One VTU is free and I'm continuously adding new features. If you find it useful, you can optionally contribute any amount."
      />

      <Section>
        <Container className="max-w-2xl space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Heart className="h-4 w-4 text-secondary" />
              Contribute any amount
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Every contribution goes straight back into the app — servers, the
              AI features, and the time it takes to keep notes, question papers
              and results up to date.
            </p>
            <div className="mt-5">
              <RazorpayButton buttonId={RAZORPAY_BUTTON_ID} />
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Payments are processed by Razorpay. Cards, UPI, netbanking and
              wallets are all supported, and One VTU never sees your payment
              details.
            </p>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4 text-primary dark:text-accent-foreground" />
              Completely optional
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Nothing in One VTU is locked behind a contribution. Every feature,
              including the AI tools, works exactly the same whether you give
              anything or not — this is a thank-you, not a purchase.
            </p>
          </Card>

          <p className="pt-2 text-center text-sm text-muted-foreground">
            Thank you for using One VTU 💙
          </p>
        </Container>
      </Section>
    </>
  )
}
