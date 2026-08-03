import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Container, PageHeader } from '@/components/ui'
import { getLegalPage } from '@/lib/content'
import { fillPlaceholders, getSettings } from '@/lib/settings'
import { formatDate } from '@/lib/utils'

/** Shared metadata builder for the four legal routes. */
export async function legalMetadata(slug: string): Promise<Metadata> {
  const page = await getLegalPage(slug)
  if (!page) return { title: 'Not found' }
  return {
    title: page.title,
    description: `${page.title} for the OneVTU app.`,
    alternates: { canonical: `/${slug}` },
  }
}

/**
 * Renders a legal page from the database. The HTML is written by the admin in
 * the dashboard editor, which is why it is injected directly — only a signed-in
 * admin can ever write to this table.
 */
export async function LegalPageView({ slug }: { slug: string }) {
  const [page, settings] = await Promise.all([getLegalPage(slug), getSettings()])

  if (!page) notFound()

  const html = fillPlaceholders(page.content, settings)
  const updated = formatDate(page.updated_at)

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={page.title}
        subtitle={updated ? `Last updated ${updated}.` : undefined}
      />
      <Container className="py-12">
        <article
          className="prose-brand"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Container>
    </>
  )
}
