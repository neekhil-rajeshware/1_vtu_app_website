import { AdminCard } from '@/components/admin/fields'
import { CollectionEditor } from '@/components/admin/collection-editor'

export const metadata = { title: 'Screenshots' }

export default function AdminScreenshotsPage() {
  return (
    <div className="space-y-4">
      <AdminCard title="Getting good screenshots">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Take them on a phone with the status bar tidy, then upload the plain
          image — the website adds the phone frame and shadow for you. The order
          here is the order visitors scroll through, so put your best first.
        </p>
      </AdminCard>

      <CollectionEditor
        table="web_screenshots"
        singular="screenshot"
        titleField="title"
        subtitleField="category"
        imageField="image_url"
        defaults={{ is_active: true, category: 'General' }}
        emptyTitle="No screenshots yet"
        emptyDescription="Upload a few phone screens. The section hides itself while this is empty."
        fields={[
          {
            name: 'image_url',
            label: 'Screenshot',
            type: 'image',
            required: true,
          },
          {
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true,
            half: true,
            placeholder: 'Today at a glance',
            maxLength: 120,
          },
          {
            name: 'category',
            label: 'Category',
            type: 'text',
            half: true,
            help: 'Used for the filter chips. For example: Timetable, Notes, AI.',
            maxLength: 60,
          },
          {
            name: 'caption',
            label: 'Caption',
            type: 'textarea',
            rows: 2,
            help: 'Optional. One line explaining what the screen does.',
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
