import { Suspense } from 'react'
import { AccountForm } from '@/components/admin/account-form'
import { requireAdmin } from '@/lib/admin/auth'
import { appName, getSettings } from '@/lib/settings'

export const metadata = { title: 'My account' }

export default async function AdminAccountPage() {
  const [admin, settings] = await Promise.all([requireAdmin(), getSettings()])

  return (
    <Suspense>
      <AccountForm email={admin.email} siteName={appName(settings)} />
    </Suspense>
  )
}
