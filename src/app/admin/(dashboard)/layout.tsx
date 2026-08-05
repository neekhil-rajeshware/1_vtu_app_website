import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdmin } from '@/lib/admin/auth'
import { appName, getSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [admin, settings] = await Promise.all([requireAdmin(), getSettings()])

  return (
    <AdminShell
      siteName={appName(settings)}
      logoUrl={settings.site.logo_url}
      email={admin.email}
    >
      {children}
    </AdminShell>
  )
}
