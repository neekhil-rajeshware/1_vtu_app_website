import type { Metadata } from 'next'
import { ScreenshotGallery } from '@/components/screenshot-gallery'
import { ClosingCta } from '@/components/sections/closing-cta'
import { Container, EmptyState, PageHeader, Section } from '@/components/ui'
import { getScreenshots } from '@/lib/content'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Screenshots',
  description: 'See what the app looks like before you install it.',
  alternates: { canonical: '/screenshots' },
}

export default async function ScreenshotsPage() {
  const [screenshots, settings] = await Promise.all([getScreenshots(), getSettings()])

  return (
    <>
      <PageHeader
        eyebrow="Screenshots"
        title="See it before you install it"
        subtitle="Real screens from the app, in light and dark mode. Tap any image to see it full size."
      />

      <Section>
        <Container>
          {screenshots.length === 0 ? (
            <EmptyState
              title="Screenshots are coming soon"
              description="We are putting these together. In the meantime, the features page lists everything the app can do."
            />
          ) : (
            <ScreenshotGallery screenshots={screenshots} />
          )}
        </Container>
      </Section>

      <ClosingCta settings={settings} />
    </>
  )
}
