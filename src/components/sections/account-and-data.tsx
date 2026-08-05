import Link from 'next/link'
import { HardDriveUpload, KeyRound, Smartphone } from 'lucide-react'
import { Container, Section, SectionHeading } from '@/components/ui'
import type { HomeSection } from '@/lib/content'
import type { AllSettings } from '@/lib/settings'

/**
 * The Android package the site belongs to. Written out because Google's OAuth
 * review has to tie this home page to the app on the consent screen, and the
 * Play Store link is not filled in yet.
 */
const PACKAGE_NAME = 'com.oneedtech.onevtu'

/**
 * States plainly what the app is for, that an account is optional, and what
 * the Google permissions are used for. Google's OAuth branding review checks
 * the home page for exactly this, and students deserve the same answer before
 * they install. Wording per card is fixed; the heading comes from Admin → Home
 * page like every other section.
 */
export function AccountAndData({
  section,
  settings,
}: {
  section?: HomeSection
  settings: AllSettings
}) {
  const appName = settings.site.name || 'OneVTU'
  const email = settings.contact.support_email

  const cards = [
    {
      icon: Smartphone,
      title: 'What the app is for',
      body: `${appName} is a free Android app for engineering students of Visvesvaraya Technological University. It brings the syllabus, previous year question papers, formulas, unit converters, attendance, CGPA and a set of AI study tools into one place, filtered to your branch, scheme and semester. Browsing all of it needs no account at all.`,
    },
    {
      icon: KeyRound,
      title: 'Signing in with Google is optional',
      body: `Sign in only if you want your profile, attendance, rewards and study progress to survive a new phone. ${appName} receives your name, email address and profile picture from your Google account, and uses them to recognise you when you come back. Nothing is posted anywhere on your behalf.`,
    },
    {
      icon: HardDriveUpload,
      title: 'Drive backup sees only its own folder',
      body: `"Sync my data" keeps a copy of your study data in a private folder of your own Google Drive. It asks for the app data permission only, which cannot see, read or change anything else in your Drive — your photos and documents stay invisible to the app. It runs when you tap it, and the same screen deletes the backup again.`,
    },
  ]

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Accounts and data"
          title={section?.heading || 'What it does, and what signing in gives you'}
          subtitle={
            section?.subheading ??
            'No sign-up, no account needed to look around, and every permission explained before you grant it.'
          }
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-foreground">
                <card.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {card.body}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {appName} is an Android app, published as{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {PACKAGE_NAME}
          </code>
          . The full detail is in our{' '}
          <Link href="/privacy-policy" className="font-semibold text-primary underline-offset-4 hover:underline">
            privacy policy
          </Link>
          , and you can{' '}
          <Link href="/delete-account" className="font-semibold text-primary underline-offset-4 hover:underline">
            delete your account and its data
          </Link>{' '}
          at any time.
          {email ? (
            <>
              {' '}
              Anything unclear, write to{' '}
              <a
                href={`mailto:${email}`}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {email}
              </a>
              .
            </>
          ) : null}
        </p>
      </Container>
    </Section>
  )
}
