'use client'

import { CollectionEditor, type Row } from '@/components/admin/collection-editor'
import { PushSendButton } from '@/components/admin/push-send-button'

/**
 * The announcements list, with a Send button on every row.
 *
 * Writing and sending are deliberately two steps. An announcement is a normal
 * row that the app's Circulars screen shows on its own; the push is an extra
 * that goes out when you press Send. That way a typo is a quick edit rather
 * than a second notification to every student on the platform.
 */
export function PushEditor({
  branchOptions,
}: {
  /** Branch names exactly as profiles store them — see the page for why. */
  branchOptions: string[]
}) {
  return (
    <CollectionEditor
      table="notifications"
      singular="announcement"
      addLabel="Write announcement"
      titleField="title"
      subtitleField="description"
      hasSortOrder={false}
      orderBy={{ column: 'published_at', ascending: false }}
      defaults={{ is_active: true, push_enabled: true, notif_type: 'general' }}
      emptyTitle="No announcements yet"
      emptyDescription="Write one, check who it is going to, then press Send."
      rowAction={(row: Row, reload) => (
        <PushSendButton row={row} reload={reload} />
      )}
      fields={[
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
          maxLength: 80,
          placeholder: '5th sem results are out',
          help: 'This is the bold line on the phone. Keep it under about 45 characters or Android trims it.',
        },
        {
          name: 'description',
          label: 'Message',
          type: 'textarea',
          rows: 4,
          required: true,
          help: 'The body of the notification, and the text shown in the app. Two sentences at most.',
        },
        {
          name: 'notif_type',
          label: 'Kind',
          type: 'select',
          half: true,
          options: [
            { value: 'general', label: 'General' },
            { value: 'circular', label: 'Circular' },
            { value: 'calendar', label: 'Academic calendar' },
            { value: 'scholarship', label: 'Scholarship' },
          ],
        },
        {
          name: 'external_url',
          label: 'Link (optional)',
          type: 'url',
          half: true,
          placeholder: 'https://vtu.ac.in/...',
          help: 'Opened when a student taps through from the app.',
        },
        {
          name: 'branch_code',
          label: 'Branch',
          type: 'select',
          half: true,
          options: [
            { value: '', label: 'Every branch' },
            ...branchOptions.map((name) => ({ value: name, label: name })),
          ],
          help: 'Leave on "Every branch" unless this only concerns one.',
        },
        {
          name: 'scheme_code',
          label: 'Scheme',
          type: 'select',
          half: true,
          options: [
            { value: '', label: 'Every scheme' },
            { value: '2025', label: '2025' },
            { value: '2022', label: '2022' },
            { value: '2021', label: '2021' },
            { value: '2018', label: '2018' },
          ],
        },
        {
          name: 'semester',
          label: 'Semester',
          type: 'select',
          half: true,
          options: [
            { value: '', label: 'Every semester' },
            ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
              value: String(n),
              label: `Semester ${n}`,
            })),
          ],
        },
        {
          name: 'pinned',
          label: 'Pin to the top',
          type: 'toggle',
          half: true,
        },
        {
          name: 'push_enabled',
          label: 'Allow sending to phones',
          type: 'toggle',
          help: 'Turn off for something that should sit in the app without a notification. The Send button disappears.',
        },
        {
          name: 'is_active',
          label: 'Visible in the app',
          type: 'toggle',
        },
      ]}
    />
  )
}
