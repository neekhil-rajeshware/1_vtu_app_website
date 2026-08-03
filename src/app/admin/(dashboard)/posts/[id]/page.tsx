import { notFound } from 'next/navigation'
import { PostEditor } from '@/components/admin/post-editor'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/lib/content'

export const metadata = { title: 'Edit post' }

export default async function AdminPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id === 'new') {
    return <PostEditor post={null} />
  }

  const supabase = await createClient()
  const { data } = await supabase.from('web_posts').select('*').eq('id', id).maybeSingle()

  if (!data) notFound()

  return <PostEditor post={data as Post} />
}
