'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Loader2, Save, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { AdminCard, TextInput } from '@/components/admin/fields'
import { RichText } from '@/components/admin/rich-text'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { LegalPage } from '@/lib/content'

/**
 * Editor for the four legal pages. They are already written and seeded — this
 * exists so the owner can keep them current without touching code, which the
 * law in most places (and the Play Store) expects.
 */
export function LegalEditor({ page }: { page: LegalPage }) {
  const router = useRouter()
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content)
  const [saving, setSaving] = useState(false)

  // Anything still in [BRACKETS] is a blank the owner has to fill in. Some are
  // filled automatically from Site settings; the rest must be edited here.
  const placeholders = useMemo(() => {
    const found = content.match(/\[[A-Z][A-Z_ ]{2,}\]/g) ?? []
    return Array.from(new Set(found))
  }, [content])

  const autoFilled = ['[APP_NAME]', '[SUPPORT_EMAIL]', '[WEBSITE]', '[DEVELOPER_NAME]']
  const manual = placeholders.filter((token) => !autoFilled.includes(token))
  const automatic = placeholders.filter((token) => autoFilled.includes(token))

  async function save() {
    if (!title.trim()) {
      toast.error('Give the page a title.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('web_legal_pages')
      .update({
        title: title.trim(),
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', page.slug)
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Saved. The public page shows the new text straight away.')
    router.refresh()
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/legal"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All legal pages
        </Link>
        <Link
          href={`/${page.slug}`}
          target="_blank"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          View public page
        </Link>
      </div>

      {placeholders.length > 0 ? (
        <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-secondary">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            This page still has blanks in it
          </p>
          {manual.length > 0 ? (
            <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                Find and replace these by hand in the text below. Leaving them in
                looks unfinished to anyone reading, and Google does check these
                pages.
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {manual.map((token) => (
                  <li
                    key={token}
                    className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs"
                  >
                    {token}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {automatic.length > 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              These ones fill themselves in from{' '}
              <Link href="/admin/settings" className="font-semibold text-primary hover:underline">
                Site settings
              </Link>{' '}
              when the page is shown, so you can leave them alone:{' '}
              <span className="font-mono text-xs">{automatic.join(' ')}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <AdminCard
        title="Page title"
        description="Shown as the heading on the public page and in the browser tab."
      >
        <TextInput
          label="Title"
          value={title}
          onChange={setTitle}
          help="Keep the usual wording — people (and Google) look for names like “Privacy Policy”."
        />
      </AdminCard>

      <AdminCard
        title="The text itself"
        description="Write it like you would in Word. Use Heading 2 for the numbered sections so people can skim it."
      >
        <RichText value={content} onChange={setContent} />
      </AdminCard>

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur">
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(page.updated_at).toLocaleDateString('en-GB', {
            dateStyle: 'medium',
          })}
        </p>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>
    </div>
  )
}
