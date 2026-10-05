import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
}

/**
 * The page a student's password-reset email opens. Kept out of the index: it is
 * only ever useful to somebody holding a one-time link.
 */
export default function ResetPasswordPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col px-5 py-16 sm:py-24">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ResetPasswordForm />
      </div>
    </section>
  )
}
