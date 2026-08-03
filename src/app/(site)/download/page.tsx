import type { Metadata } from 'next'
import { Download, QrCode, ShieldCheck, Smartphone, Sparkles } from 'lucide-react'
import { ButtonLink, Card, Container, EmptyState, PageHeader, Section, SectionHeading } from '@/components/ui'
import { getVersions } from '@/lib/content'
import { getSettings } from '@/lib/settings'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Download',
  description:
    'Get the app free on Android. Requirements, download size and the full version history.',
  alternates: { canonical: '/download' },
}

export default async function DownloadPage() {
  const [settings, versions] = await Promise.all([getSettings(), getVersions()])
  const { download, site } = settings

  const facts = [
    { icon: Smartphone, label: 'Requires', value: download.min_android },
    { icon: Download, label: 'Download size', value: download.size },
    { icon: Sparkles, label: 'Price', value: download.price },
    { icon: ShieldCheck, label: 'Permissions', value: 'No location, contacts or SMS' },
  ].filter((fact) => fact.value)

  return (
    <>
      <PageHeader
        eyebrow="Download"
        title={`Get ${site.name} on Android`}
        subtitle="Free, no subscription, and no account needed just to look around."
      />

      <Section>
        <Container className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink
                href={download.play_store_url || undefined}
                variant="primary"
                size="lg"
                unavailableTitle="Launching on Google Play soon"
              >
                <Download className="h-[1.15rem] w-[1.15rem]" />
                Get it on Google Play
              </ButtonLink>
              {!download.play_store_url ? (
                <p className="text-sm text-muted-foreground">
                  The Play Store listing goes live shortly — this button will start
                  working the moment it does.
                </p>
              ) : null}
            </div>

            {facts.length > 0 ? (
              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary dark:text-accent-foreground">
                      <fact.icon className="h-[1.1rem] w-[1.1rem]" />
                    </span>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        {fact.label}
                      </dt>
                      <dd className="text-sm font-semibold">{fact.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <Card className="flex flex-col items-center justify-center text-center">
            {download.qr_image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={download.qr_image_url}
                  alt={`QR code to download ${site.name}`}
                  className="h-44 w-44 rounded-xl bg-white p-2"
                />
                <p className="mt-4 text-sm font-semibold">Scan to install</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Point your phone camera at the code.
                </p>
              </>
            ) : (
              <>
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
                  <QrCode className="h-8 w-8" />
                </span>
                <p className="mt-4 text-sm font-semibold">QR code coming soon</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  It appears here once the Play Store listing is live.
                </p>
              </>
            )}
          </Card>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted/40">
        <Container>
          <SectionHeading
            eyebrow="Changelog"
            title="Version history"
            subtitle="What changed in each release."
            align="left"
          />

          {versions.length === 0 ? (
            <EmptyState className="mt-8" title="No releases published yet" />
          ) : (
            <ol className="mt-8 space-y-4">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                      v{version.version}
                    </span>
                    {version.release_date ? (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(version.release_date)}
                      </span>
                    ) : null}
                  </div>
                  {version.notes ? (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {version.notes}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Container>
      </Section>
    </>
  )
}
