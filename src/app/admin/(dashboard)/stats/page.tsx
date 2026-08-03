import { AdminCard } from '@/components/admin/fields'
import { CollectionEditor } from '@/components/admin/collection-editor'

export const metadata = { title: 'Numbers strip' }

export default function AdminStatsPage() {
  return (
    <div className="space-y-4">
      <AdminCard title="Keep these honest">
        <p className="text-sm leading-relaxed text-muted-foreground">
          These four or five numbers sit under the headline on the home page.
          Write only what you can stand behind — inflated download counts are the
          kind of thing Google removes listings for. Leave a number out entirely
          rather than guessing.
        </p>
      </AdminCard>

      <CollectionEditor
        table="web_stats"
        singular="number"
        addLabel="Add number"
        titleField="value"
        subtitleField="label"
        iconField="icon"
        defaults={{ is_active: true }}
        emptyTitle="No numbers yet"
        emptyDescription="Add something like 5,000+ students or 22 branches covered."
        fields={[
          {
            name: 'value',
            label: 'The number',
            type: 'text',
            required: true,
            half: true,
            placeholder: '5,000+',
            maxLength: 40,
          },
          {
            name: 'label',
            label: 'What it counts',
            type: 'text',
            required: true,
            half: true,
            placeholder: 'Students using the app',
            maxLength: 80,
          },
          { name: 'icon', label: 'Icon', type: 'icon', half: true },
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
