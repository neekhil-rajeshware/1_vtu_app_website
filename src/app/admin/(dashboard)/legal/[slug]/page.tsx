import { notFound } from 'next/navigation'
import { LegalEditor } from '@/components/admin/legal-editor'
import { createClient } from '@/lib/supabase/server'
import type { LegalPage } from '@/lib/content'

export const metadata = { title: 'Edit legal page' }

export default async function AdminLegalSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const { data } = await supabase
    .from('web_legal_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) notFound()

  return <LegalEditor page={data as LegalPage} />
}
