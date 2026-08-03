'use client'

import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

const REASONS = [
  'Scam or fraud',
  'Illegal item',
  'Leaked exam paper or academic dishonesty',
  'Pirated or copyrighted material',
  'Sexual or adult content',
  'Harassment or threats',
  'Someone else’s personal information',
  'Spam or advertising',
  'Impersonation',
  'Something else',
]

const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

/**
 * Public report form for unsafe Student Marketplace listings. Writes into
 * `web_reports`; only an admin can read them back. Email is optional so that
 * someone can report anonymously.
 */
export function ReportForm() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    listing_title: '',
    listing_ref: '',
    reporter_email: '',
    reason: REASONS[0],
    details: '',
    honeypot: '',
  })

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    // Bots fill hidden fields; real people never see this one.
    if (form.honeypot) return

    const listingTitle = form.listing_title.trim()
    const listingRef = form.listing_ref.trim()
    const email = form.reporter_email.trim()
    const details = form.details.trim()

    if (listingTitle.length > 300) {
      toast.error('Please keep the listing title under 300 characters.')
      return
    }
    if (listingRef.length > 200) {
      toast.error('Please keep the seller or listing reference under 200 characters.')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('That email address does not look right. You may also leave it blank.')
      return
    }
    if (email.length > 200) {
      toast.error('Please use a shorter email address.')
      return
    }
    if (details.length < 10) {
      toast.error('Please describe the problem in at least 10 characters.')
      return
    }
    if (details.length > 5000) {
      toast.error('That is too long. Please keep it under 5000 characters.')
      return
    }

    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.from('web_reports').insert({
      listing_title: listingTitle || null,
      listing_ref: listingRef || null,
      reporter_email: email || null,
      reason: form.reason,
      details,
      status: 'new',
    })
    setSending(false)

    if (error) {
      toast.error('That did not send. Please try again, or email us directly.')
      return
    }

    setSent(true)
    toast.success('Report received. Thank you for telling us.')
    setForm({
      listing_title: '',
      listing_ref: '',
      reporter_email: '',
      reason: REASONS[0],
      details: '',
      honeypot: '',
    })
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary dark:text-accent-foreground">
          <Flag className="h-6 w-6" />
        </span>
        <p className="mt-4 text-base font-bold">Report received</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          We review every report, usually within 48 hours. If you left your email
          we will tell you what we decided.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => setSent(false)}
        >
          Report something else
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
          <span className="mb-1.5 block text-sm font-medium">
            Listing title <span className="text-muted-foreground">(optional)</span>
          </span>
          <input
            type="text"
            maxLength={300}
            value={form.listing_title}
            onChange={(e) => update('listing_title')(e.target.value)}
            className={inputClass}
            placeholder="e.g. Second hand DSP textbook"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Seller name or reference{' '}
            <span className="text-muted-foreground">(optional)</span>
          </span>
          <input
            type="text"
            maxLength={200}
            value={form.listing_ref}
            onChange={(e) => update('listing_ref')(e.target.value)}
            className={inputClass}
            placeholder="Whatever helps us find it"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">What is wrong with it?</span>
        <select
          value={form.reason}
          onChange={(e) => update('reason')(e.target.value)}
          className={inputClass}
        >
          {REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">What happened?</span>
        <textarea
          required
          rows={6}
          minLength={10}
          maxLength={5000}
          value={form.details}
          onChange={(e) => update('details')(e.target.value)}
          className={`${inputClass} resize-y`}
          placeholder="Tell us what you saw. Screenshots help — you can email them to us afterwards."
        />
        <span className="mt-1.5 block text-right text-xs text-muted-foreground">
          {form.details.length}/5000
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Your email <span className="text-muted-foreground">(optional)</span>
        </span>
        <input
          type="email"
          maxLength={200}
          value={form.reporter_email}
          onChange={(e) => update('reporter_email')(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
          Leave this blank to report anonymously. We only use it to ask a follow-up
          question or tell you the outcome.
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
          <Flag className="h-4 w-4" />
        )}
        {sending ? 'Sending…' : 'Submit report'}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Reports are read only by our moderation team. If someone is in immediate
        danger, contact your local emergency number first.
      </p>
    </form>
  )
}
