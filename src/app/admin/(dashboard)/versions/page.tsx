import { AdminCard } from '@/components/admin/fields'
import { CollectionEditor } from '@/components/admin/collection-editor'

export const metadata = { title: 'Version history' }

export default function AdminVersionsPage() {
  return (
    <div className="space-y-4">
      <AdminCard title="Keep this in step with the Play Store">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Each entry shows on the Download page under Version history. Paste the
          same release notes you put on the Play Store so the two never disagree.
          Newest at the top.
        </p>
      </AdminCard>

      <CollectionEditor
        table="web_versions"
        singular="version"
        titleField="version"
        subtitleField="notes"
        defaults={{ is_active: true }}
        emptyTitle="No releases listed yet"
        emptyDescription="Add your first version, for example 1.0.0."
        fields={[
          {
            name: 'version',
            label: 'Version number',
            type: 'text',
            required: true,
            half: true,
            placeholder: '1.0.0',
            maxLength: 40,
          },
          {
            name: 'release_date',
            label: 'Release date',
            type: 'date',
            half: true,
          },
          {
            name: 'notes',
            label: 'What changed',
            type: 'textarea',
            rows: 6,
            help: 'One change per line. Line breaks are kept.',
          },
          {
            name: 'is_active',
            label: 'Visible on the website',
            type: 'toggle',
          },
        ]}
      />
    </div>
  )
}
