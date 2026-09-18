import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  BellRing,
  BookOpen,
  Bot,
  CalendarCheck,
  KeyRound,
  ListChecks,
  RefreshCw,
  Smartphone,
} from 'lucide-react'
import { ButtonLink, Card, Container, PageHeader, Section, SectionHeading } from '@/components/ui'
import { pageMetadata } from '@/lib/seo'
import { appName, getSettings } from '@/lib/settings'

/**
 * The AI Studio page where a free Gemini key is issued. Hard-coded rather than
 * a setting: it is Google's URL, not ours to move.
 */
const GEMINI_KEYS_URL = 'https://aistudio.google.com/api-keys'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Setup guide',
    description:
      'Install One VTU and set it up step by step: account, profile, reminders, subjects, your free Gemini API key, and the daily study loop.',
    path: '/setup',
  })
}

/**
 * One numbered step. A plain function rather than a component with a `key`,
 * because these are written out by hand in reading order — the numbering is
 * the sequence, and keeping it in the source is what keeps the two honest.
 */
function Step({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: ReactNode
}) {
  return (
    <li className="flex gap-4 rounded-2xl border border-border bg-card p-5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </li>
  )
}

/**
 * A label exactly as it is spelled in the app, so a reader can match what they
 * see on screen instead of guessing at a paraphrase.
 */
function Tap({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 font-semibold text-foreground">
      {children}
    </span>
  )
}

export default async function SetupPage() {
  const settings = await getSettings()
  const name = appName(settings)
  // The same setting the download page's button reads, so the two cannot drift
  // apart — one dashboard field changes both, or neither.
  const playStoreUrl = settings.download.play_store_url

  return (
    <>
      <PageHeader
        eyebrow="Setup guide"
        title={`Set up ${name}, step by step`}
        subtitle="From installing it off the Play Store to your first Daily Quiz, in about ten minutes: an account, your profile, your subjects, a free AI key, and then the daily loop."
      />

      <Section>
        <Container className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <SectionHeading
              eyebrow="Before you begin"
              title="Install the app"
              subtitle={`${name} is free on Google Play, with no subscription and no ads to sit through before you can study.`}
              align="left"
            />

            <ol className="mt-8 space-y-4">
              <li className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary dark:text-accent-foreground">
                  <Smartphone className="h-[1.1rem] w-[1.1rem]" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">Install it from the Play Store</h3>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Open the <strong>Google Play Store</strong> on your phone,
                      search for <strong>{name}</strong>, and tap{' '}
                      <Tap>Install</Tap>.
                    </p>
                    <p>
                      Nothing needs signing in to at this point — the account is
                      created in the app, in the next step.
                    </p>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <Card className="flex h-fit flex-col items-start gap-3 lg:sticky lg:top-24">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary dark:text-accent-foreground">
              <Smartphone className="h-[1.2rem] w-[1.2rem]" />
            </span>
            <p className="font-semibold">Get it on Google Play</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Free, and no subscription. A free account keeps your attendance,
              marks and progress yours if you change phones.
            </p>
            <ButtonLink
              href={playStoreUrl || undefined}
              variant="primary"
              size="md"
              className="w-full"
              unavailableTitle="Launching on Google Play soon"
            >
              Open Google Play
            </ButtonLink>
            {!playStoreUrl ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Search <strong>{name}</strong> in the Play Store app on your
                phone.
              </p>
            ) : null}
          </Card>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted/40">
        <Container>
          <SectionHeading
            eyebrow="Part 1"
            title="Create your account"
            subtitle="Three taps, and no password to remember."
            align="left"
          />

          <ol className="mt-8 space-y-4">
            <Step n={1} title="Open the app and tap Register">
              <p>
                The first screen is the login screen. At the bottom it reads{' '}
                <em>Don&apos;t have an account?</em> — tap <Tap>Register</Tap>.
              </p>
            </Step>

            <Step n={2} title="Accept the Privacy Policy">
              <p>
                Tick the box next to <Tap>I accept the Privacy Policy</Tap>. The
                underlined words open the full policy, which is worth a look —
                it says exactly where your data lives.
              </p>
              <p>
                The <Tap>REGISTER</Tap> button stays grey until the box is
                ticked.
              </p>
            </Step>

            <Step n={3} title="Tap Continue with Google">
              <p>
                Use the same Google account you installed with, so the app and
                your Play account stay linked. Pick the account in the sheet
                that slides up, and you are signed in — no password is created
                and none is stored.
              </p>
            </Step>
          </ol>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading
            eyebrow="Part 2"
            title="Fill in your profile"
            subtitle="This is what the app uses to pick your subjects, so the USN matters more than anything else here."
            align="left"
          />

          <ol className="mt-8 space-y-4">
            <Step n={4} title="Enter your details">
              <p>
                <Tap>Full Name</Tap> — your name, as you want it shown in the
                app.
              </p>
              <p>
                <Tap>USN</Tap> — your full university seat number, for example{' '}
                <strong>3GN25CV001</strong>. Three things read themselves out of
                this number as you type it:
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li>
                  <strong>College Name</strong> — from the first three
                  characters (<code>3GN</code>).
                </li>
                <li>
                  <strong>Branch</strong> — from the two letters after the
                  admission year (<code>25</code>, then <code>CV</code> gives
                  Civil Engineering).
                </li>
                <li>
                  <strong>VTU Scheme</strong> — from the admission year, so{' '}
                  <code>25</code> selects <strong>2025 CBCS</strong>. If you are
                  on an older scheme, change it in the dropdown.
                </li>
              </ul>
              <p>
                Both <Tap>College Name</Tap> and <Tap>Branch</Tap> stay editable,
                so a college or branch we do not have yet can be typed in by hand.
              </p>
              <p>
                Then pick your <Tap>Semester</Tap>. If you are in first year this
                is <strong>Sem 1</strong> or <strong>Sem 2</strong>, and a{' '}
                <Tap>Select Cycle</Tap> field appears below it — choose{' '}
                <strong>Physics Cycle</strong> or <strong>Chemistry Cycle</strong>{' '}
                to match your section.
              </p>
              <p>
                <Tap>Referral code (optional)</Tap> — leave it blank unless a
                friend gave you one.
              </p>
            </Step>

            <Step n={5} title="Tap SAVE AND CONTINUE">
              <p>
                That saves the profile and drops you on the Home screen. If a
                field is missing you will be told which one rather than being
                left on a dead button.
              </p>
            </Step>
          </ol>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted/40">
        <Container>
          <SectionHeading
            eyebrow="Part 3"
            title="Reminders and subjects"
            subtitle="Two minutes of setup that the rest of the app depends on."
            align="left"
          />

          <ol className="mt-8 space-y-4">
            <Step n={6} title="Allow notifications and reminders">
              <p>
                As soon as the Home screen loads, a card asks{' '}
                <em>Get study reminders?</em> — tap{' '}
                <Tap>Allow reminders</Tap>, then <Tap>Allow</Tap> on the Android
                prompt that follows.
              </p>
              <p>
                Without this, class reminders, the daily quiz nudge and exam
                alerts never arrive. Nothing is sent for advertising; you can
                change your mind later in Android Settings.
              </p>
            </Step>

            <Step n={7} title="Check your Subjects">
              <p>
                Open the <Tap>Subjects</Tap> tab in the bottom bar. It lands on{' '}
                <strong>My Subjects</strong>, which lists the papers for the
                semester you just saved.
              </p>
              <p>
                If the list is empty or looks wrong, the USN, branch or semester
                on your profile is the thing to correct — fix it there rather
                than here.
              </p>
            </Step>

            <Step n={8} title="Pick your elective">
              <p>
                Still on Subjects, scroll to <strong>Elective Selection</strong>{' '}
                — <em>Choose your elective paper for each group.</em> Tap a
                group header and select the paper your college has allotted you.
              </p>
              <p>
                Skip this if your semester has no electives. Your choices are
                kept, so quizzes and study material follow the right paper from
                then on.
              </p>
            </Step>
          </ol>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading
            eyebrow="Part 4"
            title="Connect a free AI key"
            subtitle="The AI features run on a key you own. It is free to create, and it never leaves your phone."
            align="left"
          />

          <ol className="mt-8 space-y-4">
            <Step n={9} title="Create a Gemini API key">
              <p>
                Open{' '}
                <a
                  href={GEMINI_KEYS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline dark:text-accent-foreground"
                >
                  aistudio.google.com/api-keys
                </a>{' '}
                — on the phone or on a laptop, either works. Sign in with any
                Google account, tap <Tap>Create API key</Tap>, and copy the key
                it gives you.
              </p>
              <p>
                The free tier is enough to use every AI feature here. Google
                applies its own per-minute and per-day limits to that tier; if
                you ever hit one, the app tells you instead of failing silently.
              </p>
            </Step>

            <Step n={10} title="Paste it into AI Settings">
              <p>
                Open the drawer from the top-left corner and tap{' '}
                <Tap>AI Settings</Tap>.
              </p>
              <p>
                Set <Tap>AI Provider</Tap> to <strong>Google Gemini</strong>,
                then paste the key into the <Tap>API Key</Tap> field. Leave{' '}
                <Tap>Model (optional)</Tap> alone unless you know which model id
                you want.
              </p>
              <p>
                Tap <Tap>Test Connection</Tap> — a green banner means the key
                works. Then tap <Tap>Save</Tap>.
              </p>
              <p>
                The key is kept in the phone&apos;s own secure storage (Android
                Keystore). It is not sent to us and not written to your profile.
              </p>
            </Step>

            <Step n={11} title="Open AI Professor">
              <p>
                Tap the <Tap>AI Professor</Tap> tab in the bottom bar. This is
                where you ask questions about your syllabus and get answers with
                the source shown.
              </p>
            </Step>

            <Step n={12} title="Tap Sync">
              <p>
                On the <em>Study from your own notes</em> banner, tap{' '}
                <Tap>Sync</Tap>. The app pulls your VTU syllabus and documents so
                answers come from your material rather than from the open
                internet — it also prepares the topics your quizzes are built
                from.
              </p>
              <p>
                Give it a minute on the first run. You can carry on using the
                rest of the app while it works.
              </p>
            </Step>
          </ol>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted/40">
        <Container>
          <SectionHeading
            eyebrow="Part 5"
            title="The daily loop"
            subtitle="Four things on the Home screen, every day. This is the habit the whole app is built around."
            align="left"
          />

          <ol className="mt-8 space-y-4">
            <Step n={13} title="Update, then Attendance">
              <p>
                On Home, tap <Tap>Update</Tap> to pull the day&apos;s timetable
                and notes, then <Tap>Attendance</Tap> to mark the classes you
                attended.
              </p>
              <p>
                Attendance is what the safe-bunk count and the exam-eligibility
                warning are calculated from, so mark it the same day — catching
                up on a week of classes from memory is where the numbers stop
                being trustworthy.
              </p>
            </Step>

            <Step n={14} title="Daily Quiz and Flashcards">
              <p>
                Still on Home, tap <Tap>Daily Quiz</Tap> for the day&apos;s
                questions, and <Tap>Flashcards</Tap> for the revision set built
                from the topics you have been studying.
              </p>
              <p>
                Both are generated from your synced syllabus and your elective
                choices, and they get sharper the longer you keep the streak
                going.
              </p>
            </Step>
          </ol>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <SectionHeading
            eyebrow="If something goes wrong"
            title="Common snags"
            align="left"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card>
              <h3 className="flex items-center gap-2 font-semibold">
                <Smartphone className="h-[1.05rem] w-[1.05rem] text-primary dark:text-accent-foreground" />
                The Play Store does not show the app
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Search the full name, <strong>{name}</strong>, rather than a
                shortened one. If it still does not appear, your phone&apos;s
                Android version is below what the app needs — you can check that
                on the <Link href="/download" className="font-medium text-primary hover:underline dark:text-accent-foreground">download page</Link>.
              </p>
            </Card>

            <Card>
              <h3 className="flex items-center gap-2 font-semibold">
                <KeyRound className="h-[1.05rem] w-[1.05rem] text-primary dark:text-accent-foreground" />
                Test Connection fails
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Usually a key pasted with a trailing space or a line break, or
                the wrong provider selected above it. Copy the key again and
                paste it into the field in one go.
              </p>
            </Card>

            <Card>
              <h3 className="flex items-center gap-2 font-semibold">
                <ListChecks className="h-[1.05rem] w-[1.05rem] text-primary dark:text-accent-foreground" />
                Subjects list is empty
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Check the USN, branch and semester on your profile. The subjects
                are matched on those three, so a single wrong character is
                enough to find nothing.
              </p>
            </Card>

            <Card>
              <h3 className="flex items-center gap-2 font-semibold">
                <BellRing className="h-[1.05rem] w-[1.05rem] text-primary dark:text-accent-foreground" />
                No reminders arrive
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Notifications were declined, or Android has since put the app to
                sleep. Allow notifications for {name} in Android Settings, and
                take the app off any battery-restriction list.
              </p>
            </Card>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Still stuck, or found a bug?</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Tell us what you tapped and what happened instead. We read every
                message, and it is usually the fastest way to get something
                fixed.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="primary" size="md">
                Contact us
              </ButtonLink>
              <ButtonLink href="/download" variant="outline" size="md">
                Download page
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted/40">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Bot,
                title: 'Ask the AI Professor',
                body: 'Questions answered from your own syllabus, with the source cited.',
                href: '/features',
              },
              {
                icon: BookOpen,
                title: 'Revision and flashcards',
                body: 'Spaced revision built from the topics you have synced.',
                href: '/features',
              },
              {
                icon: CalendarCheck,
                title: 'Attendance you can trust',
                body: 'Marked daily, so the safe-bunk count means something.',
                href: '/features',
              },
              {
                icon: RefreshCw,
                title: 'See every feature',
                body: 'The full list, with screenshots of each screen.',
                href: '/screenshots',
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary dark:text-accent-foreground">
                  <item.icon className="h-[1.1rem] w-[1.1rem]" />
                </span>
                <p className="mt-3 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
