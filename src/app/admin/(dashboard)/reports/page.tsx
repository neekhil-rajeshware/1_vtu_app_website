import { AdminCard } from '@/components/admin/fields'
import { Inbox } from '@/components/admin/inbox'

export const metadata = { title: 'Content reports' }

export default function AdminReportsPage() {
  return (
    <div className="space-y-4">
      <AdminCard title="Why this page matters">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Because the app lets students list things for sale, Google expects you
          to have a way for people to report content and to act on it. Working
          through this list, and writing down what you decided, is that record.
          Aim to answer inside 48 hours, which is what the Community Guidelines
          promise.
        </p>
      </AdminCard>

      <Inbox
        table="web_reports"
        titleField="reason"
        metaField="listing_title"
        bodyField="details"
        hasAdminNote
        statuses={[
          { value: 'new', label: 'New' },
          { value: 'reviewing', label: 'Looking into it' },
          { value: 'resolved', label: 'Acted on' },
          { value: 'dismissed', label: 'No action needed' },
        ]}
        fields={[
          { label: 'Listing', name: 'listing_title' },
          { label: 'Seller or reference', name: 'listing_ref' },
          { label: 'Reporter email', name: 'reporter_email', email: true },
        ]}
        emptyTitle="No reports"
        emptyDescription="Reports sent from the website form appear here."
      />
    </div>
  )
}
