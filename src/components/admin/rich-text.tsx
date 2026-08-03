'use client'

import { useEffect, useState } from 'react'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from 'lucide-react'
import { toast } from 'sonner'
import { MediaPicker } from '@/components/admin/image-input'
import { cn } from '@/lib/utils'

/**
 * The writing surface for blog posts and legal pages. It saves HTML, which is
 * what the public pages render, and it deliberately supports only the tags the
 * public styles know how to lay out: headings, paragraphs, lists, quotes,
 * links, images, rules and inline code. No tables, because this editor cannot
 * round-trip them and they would be silently lost on the next save.
 */
export function RichText({
  value,
  onChange,
  placeholder,
  minHeight = '24rem',
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}) {
  const [picking, setPicking] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer' },
        },
      }),
      Image.configure({ HTMLAttributes: { class: 'rounded-xl' } }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Start writing…',
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose-brand max-w-none outline-none',
        style: `min-height:${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // If the record is swapped underneath us (a different post, say), take the
  // new content — but never while the writer is mid-sentence in this one.
  useEffect(() => {
    if (!editor) return
    if (!editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    return (
      <div
        className="rounded-xl border border-border bg-background"
        style={{ minHeight }}
      />
    )
  }

  function setLink() {
    const previous = editor!.getAttributes('link').href as string | undefined
    const href = window.prompt('Link address', previous ?? 'https://')
    if (href === null) return

    if (href.trim() === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    if (!/^(https?:|mailto:|tel:|\/)/i.test(href.trim())) {
      toast.error('Links must start with https://, mailto:, tel: or /')
      return
    }
    editor!
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: href.trim() })
      .run()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5">
        <ToolButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolButton
          label="Big heading"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Small heading"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Inline code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Divider line"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolButton label="Add link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Remove link"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Insert image" onClick={() => setPicking(true)}>
          <ImagePlus className="h-4 w-4" />
        </ToolButton>

        <span className="ml-auto flex items-center gap-0.5">
          <ToolButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolButton>
        </span>
      </div>

      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>

      {picking ? (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(item) => {
            editor.chain().focus().setImage({ src: item.url, alt: '' }).run()
            setPicking(false)
          }}
        />
      ) : null}
    </div>
  )
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active ?? false}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

