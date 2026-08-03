'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Loader2, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AdminCard,
  SelectInput,
  TextArea,
  TextInput,
} from '@/components/admin/fields'
import { ImageInput } from '@/components/admin/image-input'
import { RichText } from '@/components/admin/rich-text'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import type { Post } from '@/lib/content'

/**
 * Write or edit one blog post. A draft is invisible to everyone but you; the
 * moment status is Published it appears on /blog and in the sitemap.
 */
export function PostEditor({ post }: { post: Post | null }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    cover_image_url: post?.cover_image_url ?? '',
    tags: (post?.tags ?? []).join(', '),
    status: post?.status ?? 'draft',
    meta_title: post?.meta_title ?? '',
    meta_description: post?.meta_description ?? '',
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function save() {
    const title = form.title.trim()
    if (!title) {
      toast.error('Give the post a title first.')
      return
    }

    const slug = slugify(form.slug.trim() || title)
    if (!slug) {
      toast.error('That title needs at least one letter or number for the web address.')
      return
    }

    const payload = {
      title,
      slug,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image_url: form.cover_image_url.trim() || null,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: form.status,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      updated_at: new Date().toISOString(),
      // Stamp the publish date the first time it goes live, then leave it alone.
      published_at:
        form.status === 'published'
          ? (post?.published_at ?? new Date().toISOString())
          : null,
    }

    setSaving(true)
    const supabase = createClient()

    if (post) {
      const { error } = await supabase.from('web_posts').update(payload).eq('id', post.id)
      setSaving(false)

      if (error) {
        toast.error(
          error.code === '23505'
            ? 'Another post already uses that web address. Change the slug.'
            : `Could not save: ${error.message}`,
        )
        return
      }
      toast.success('Saved.')
      router.refresh()
      return
    }

    const { data, error } = await supabase
      .from('web_posts')
      .insert(payload)
      .select('id')
      .single()
    setSaving(false)

    if (error) {
      toast.error(
        error.code === '23505'
          ? 'Another post already uses that web address. Change the slug.'
          : `Could not save: ${error.message}`,
      )
      return
    }

    toast.success('Post created.')
    router.replace(`/admin/posts/${data.id}`)
    router.refresh()
  }

  async function remove() {
    if (!post) return
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return

    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('web_posts').delete().eq('id', post.id)
    setDeleting(false)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Deleted.')
    router.replace('/admin/posts')
    router.refresh()
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All posts
        </Link>
        {post && post.status === 'published' ? (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline dark:text-accent-foreground"
          >
            View on the website
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>

      <AdminCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextInput
              label="Title"
              value={form.title}
              onChange={(value) => {
                set('title', value)
                // Keep the address in step with the title until it is published.
                if (!post || post.status !== 'published') set('slug', slugify(value))
              }}
              placeholder="How to plan the last two weeks before exams"
              maxLength={200}
            />
          </div>

          <TextInput
            label="Web address"
            value={form.slug}
            onChange={(value) => set('slug', value)}
            help="The part after /blog/. Changing it on a published post breaks old links."
            placeholder="exam-revision-plan"
          />

          <SelectInput
            label="Status"
            value={form.status}
            onChange={(value) => set('status', value as 'draft' | 'published')}
            options={[
              { value: 'draft', label: 'Draft — only you can see it' },
              { value: 'published', label: 'Published — live on the website' },
            ]}
          />

          <div className="sm:col-span-2">
            <TextArea
              label="Summary"
              value={form.excerpt}
              onChange={(value) => set('excerpt', value)}
              rows={3}
              help="Shown on the blog cards and used as the description in Google."
            />
          </div>

          <div className="sm:col-span-2">
            <ImageInput
              label="Cover image"
              value={form.cover_image_url}
              onChange={(value) => set('cover_image_url', value)}
              help="Optional. A colour gradient is used when there is none."
            />
          </div>

          <div className="sm:col-span-2">
            <TextInput
              label="Tags"
              value={form.tags}
              onChange={(value) => set('tags', value)}
              help="Separate with commas. For example: exams, results, tips."
            />
          </div>
        </div>
      </AdminCard>

      <AdminCard title="The post">
        <RichText
          value={form.content}
          onChange={(html) => set('content', html)}
          placeholder="Write the post here…"
        />
      </AdminCard>

      <AdminCard
        title="Search settings"
        description="Both optional. Leave them empty and the title and summary above are used."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextInput
              label="Title for Google"
              value={form.meta_title}
              onChange={(value) => set('meta_title', value)}
              maxLength={200}
            />
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Description for Google"
              value={form.meta_description}
              onChange={(value) => set('meta_description', value)}
              rows={2}
              maxLength={300}
            />
          </div>
        </div>
      </AdminCard>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[100rem] items-center gap-3">
          {post ? (
            <Button variant="danger" size="sm" onClick={remove} disabled={deleting}>
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          ) : null}

          <Button className="ml-auto" size="md" onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving
              ? 'Saving…'
              : form.status === 'published'
                ? 'Save and publish'
                : 'Save draft'}
          </Button>
        </div>
      </div>
    </div>
  )
}
