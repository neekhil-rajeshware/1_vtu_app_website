'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

const SUBJECTS = [
  'General question',
  'Report a mistake in the content',
  'Missing question paper or syllabus',
  'Bug report',
  'Delete my account',
  'Copyright / takedown',
  'Partnership or feedback',
]

const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

/**
 * Public contact form. Writes straight into `web_messages` using the
 * publishable key — the database policy only permits an insert with sensible
 * field lengths and status 'new', and nobody except an admin can read them back.
 */
export function ContactForm({ responseTime }: { responseTime?: string }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: SUBJECTS[0],
    message: '',
    honeypot: '',
  })

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    // Bots fill hidden fields; real people never see this one.
    if (form.honeypot) return

    const name = form.name.trim()
    const email = form.email.trim()
    const message = form.message.trim()

    if (name.length < 1 || name.length > 120) {
      toast.error('Please enter your name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (message.length < 10) {
      toast.error('Please write at least 10 characters so we can help.')
      return
    }
    if (message.length > 5000) {
      toast.error('That message is too long. Please keep it under 5000 characters.')
      return
    }

    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.from('web_messages').insert({
      name,
      email,
      subject: form.subject,
      message,
      status: 'new',
    })
    setSending(false)

    if (error) {
      toast.error('That did not send. Please try again, or email us directly.')
      return
    }

    setSent(true)
    toast.success('Message sent. Thank you!')
    setForm({ name: '', email: '', subject: SUBJECTS[0], message: '', honeypot: '' })
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-base font-bold">Message sent</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {responseTime || 'We will get back to you as soon as we can.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => setSent(false)}
        >
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Your name</span>
          <input
            type="text"
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => update('name')(e.target.value)}
            className={inputClass}
            placeholder="Nikhil R"
            autoComplete="name"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email address</span>
          <input
            type="email"
            required
            maxLength={200}
            value={form.email}
            onChange={(e) => update('email')(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">What is this about?</span>
        <select
          value={form.subject}
          onChange={(e) => update('subject')(e.target.value)}
          className={inputClass}
        >
          {SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Message</span>
        <textarea
          required
          rows={6}
          minLength={10}
          maxLength={5000}
          value={form.message}
          onChange={(e) => update('message')(e.target.value)}
          className={`${inputClass} resize-y`}
          placeholder="Tell us what you need. If you are reporting a mistake, please include the subject and semester."
        />
        <span className="mt-1.5 block text-right text-xs text-muted-foreground">
          {form.message.length}/5000
        </span>
      </label>

      {/* Hidden from people, tempting to bots. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.honeypot}
        onChange={(e) => update('honeypot')(e.target.value)}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      <Button type="submit" size="md" disabled={sending} className="w-full sm:w-auto">
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {sending ? 'Sending…' : 'Send message'}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        We use your email only to reply to this message. See our{' '}
        <a href="/privacy-policy" className="underline">
          privacy policy
        </a>
        .
      </p>
    </form>
  )
}
