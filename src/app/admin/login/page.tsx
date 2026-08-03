import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/admin/login-form'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  const settings = await getSettings()

  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm
          siteName={settings.site.name || 'OneVTU'}
          logoUrl={settings.site.logo_url}
        />
      </Suspense>
    </div>
  )
}
