import { Suspense } from 'react'
import { AccountForm } from '@/components/admin/account-form'
import { requireAdmin } from '@/lib/admin/auth'

export const metadata = { title: 'My account' }

export default async function AdminAccountPage() {
  const admin = await requireAdmin()

  return (
    <Suspense>
      <AccountForm email={admin.email} />
    </Suspense>
  )
}
