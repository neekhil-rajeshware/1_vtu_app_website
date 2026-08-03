'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

type PostRow = {
  id: string
  slug: string
  title: string
  status: string
  published_at: string | null
  updated_at: string
}

/** Everything written so far, drafts included. */
export function PostsList() {
  const router = useRouter()
  const [posts, setPosts] = useState<PostRow[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('web_posts')
      .select('id, slug, title, status, published_at, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      toast.error(`Could not load posts: ${error.message}`)
      setPosts([])
      return
    }
    setPosts((data ?? []) as PostRow[])
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(post: PostRow) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return

    setBusy(post.id)
    const supabase = createClient()
    const { error } = await supabase.from('web_posts').delete().eq('id', post.id)
    setBusy(null)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Deleted.')
    await load()
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/admin/posts/new"
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Write a post
        </Link>
      </div>

      {posts === null ? (
        <div className="grid place-items-center rounded-2xl border border-border bg-card py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="A post or two about exams and results is the easiest way to bring students to the site."
        />
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => {
            const published = post.status === 'published'
            return (
              <li
                key={post.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{post.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {published
                      ? `Published ${formatDate(post.published_at ?? post.updated_at)}`
                      : 'Draft — not visible on the website'}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${
                    published
                      ? 'bg-primary-soft text-primary dark:bg-primary/15 dark:text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {published ? 'Live' : 'Draft'}
                </span>

                {published ? (
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="View on the website"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                ) : null}

                <Link
                  href={`/admin/posts/${post.id}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => remove(post)}
                  disabled={busy === post.id}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-secondary"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
