import { AdminCard } from '@/components/admin/fields'
import { CollectionEditor } from '@/components/admin/collection-editor'

export const metadata = { title: 'Announcement categories' }

/**
 * The "Kind" list on the push page, and the colour each kind is drawn in.
 *
 * A table rather than a fixed list in code, because the categories are the
 * college's vocabulary: adding "Revaluation" should be a minute in the
 * dashboard, not an app release and a wait for students to update.
 */
export default function AdminAnnouncementCategoriesPage() {
  return (
    <div className="space-y-4">
      <AdminCard title="What these do">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Each category is one choice in the <strong>Kind</strong> box when you
            write an announcement. The colour is used twice: as the tint on the
            notification that arrives on the phone, and on the label in the app’s
            announcements list. Pick colours students can tell apart at a glance
            — green for results, red for timetables.
          </p>
          <p>
            <strong>Hiding</strong> a category takes it out of the Kind box but
            leaves announcements already sent under it alone — they keep their
            colour and label. That is the safe way to retire one.
          </p>
          <p>
            <strong>Deleting</strong> one does not delete any announcement, but
            those announcements lose their colour and show a plain grey label.
            Hide instead, unless you added the category by mistake.
          </p>
          <p>
            Very light colours are a poor choice: Android draws the notification
            tint against a white background, so pale yellows and pastels come out
            close to invisible.
          </p>
        </div>
      </AdminCard>

      <CollectionEditor
        table="notification_categories"
        singular="category"
        addLabel="Add category"
        titleField="label"
        subtitleField="key"
        colorField="color"
        emptyTitle="No categories yet"
        emptyDescription="Without at least one, the Kind box on the push page falls back to a plain list."
        defaults={{ is_active: true, color: '#6B7280' }}
        fields={[
          {
            name: 'label',
            label: 'Name',
            type: 'text',
            required: true,
            maxLength: 40,
            placeholder: 'Revaluation',
            help: 'What you and the students read. This is the label on the announcement.',
          },
          {
            name: 'key',
            label: 'Code',
            type: 'text',
            required: true,
            half: true,
            maxLength: 40,
            placeholder: 'REVALUATION',
            help: 'Capitals and underscores. Saved onto every announcement of this kind.',
            // Typed however the admin likes, stored the one way the column
            // accepts — the alternative is a CHECK violation on save.
            transform: 'code',
            lockOnEdit: true,
          },
          {
            name: 'color',
            label: 'Colour',
            type: 'color',
            required: true,
            half: true,
            help: 'Used for the notification tint and the label in the app.',
          },
          {
            name: 'is_active',
            label: 'Offer this kind when writing',
            type: 'toggle',
            help: 'Turn off to retire a category. Announcements already sent under it keep working.',
          },
        ]}
      />
    </div>
  )
}
