import { AdminCard } from '@/components/admin/fields'
import { CollectionEditor } from '@/components/admin/collection-editor'

export const metadata = { title: 'Features' }

export default function AdminFeaturesPage() {
  return (
    <div className="space-y-4">
      <AdminCard title="How this shows on the website">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Features are shown on the home page and on the Features page, grouped
          under the heading you type in <strong>Group</strong>. Use the same group
          name on several features to put them together. Turn on{' '}
          <strong>Show in highlights</strong> for the six or so you most want
          people to see on the home page.
        </p>
      </AdminCard>

      <CollectionEditor
        table="web_features"
        singular="feature"
        titleField="title"
        subtitleField="group_name"
        imageField="image_url"
        iconField="icon"
        defaults={{ is_highlight: false, is_active: true, group_name: 'More' }}
        emptyTitle="No features added yet"
        emptyDescription="Add your first feature — the home page and Features page fill themselves in."
        fields={[
          {
            name: 'title',
            label: 'Feature name',
            type: 'text',
            required: true,
            half: true,
            placeholder: 'Attendance tracker',
            maxLength: 120,
          },
          {
            name: 'group_name',
            label: 'Group',
            type: 'text',
            half: true,
            help: 'The heading it appears under. For example: Study tools.',
            maxLength: 60,
          },
          {
            name: 'short_description',
            label: 'One-line description',
            type: 'textarea',
            rows: 2,
            help: 'Shown on the cards. Keep it to a sentence.',
          },
          {
            name: 'long_description',
            label: 'Longer description',
            type: 'textarea',
            rows: 4,
            help: 'Optional. Shown on the Features page under the short one.',
          },
          {
            name: 'icon',
            label: 'Icon',
            type: 'icon',
            half: true,
            help: 'Used when there is no image.',
          },
          {
            name: 'image_url',
            label: 'Image',
            type: 'image',
            help: 'Optional. A screenshot works well here.',
          },
          {
            name: 'is_highlight',
            label: 'Show in highlights on the home page',
            type: 'toggle',
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
