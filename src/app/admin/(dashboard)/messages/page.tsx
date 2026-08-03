import { Inbox } from '@/components/admin/inbox'

export const metadata = { title: 'Messages' }

export default function AdminMessagesPage() {
  return (
    <Inbox
      table="web_messages"
      titleField="subject"
      metaField="name"
      bodyField="message"
      statuses={[
        { value: 'new', label: 'New' },
        { value: 'read', label: 'Read' },
        { value: 'done', label: 'Done' },
      ]}
      fields={[
        { label: 'From', name: 'name' },
        { label: 'Email', name: 'email', email: true },
      ]}
      emptyTitle="No messages"
      emptyDescription="Anything sent through the contact form lands here."
    />
  )
}
