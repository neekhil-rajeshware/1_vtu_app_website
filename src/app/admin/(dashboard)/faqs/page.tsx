import { AdminCard } from '@/components/admin/fields'
import { CollectionEditor } from '@/components/admin/collection-editor'

export const metadata = { title: 'FAQ' }

export default function AdminFaqsPage() {
  return (
    <div className="space-y-4">
      <AdminCard title="Where these appear">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every question appears on the home page FAQ and is also sent to Google
          as structured data, which is how questions sometimes show directly in
          search results. Questions in the <strong>Support</strong> category are
          shown again at the bottom of the Contact page.
        </p>
      </AdminCard>

      <CollectionEditor
        table="web_faqs"
        singular="question"
        addLabel="Add question"
        titleField="question"
        subtitleField="category"
        defaults={{ is_active: true, category: 'General' }}
        emptyTitle="No questions yet"
        emptyDescription="Start with the three things students ask you most often."
        fields={[
          {
            name: 'question',
            label: 'Question',
            type: 'text',
            required: true,
            placeholder: 'Is the app free?',
            maxLength: 200,
          },
          {
            name: 'answer',
            label: 'Answer',
            type: 'textarea',
            rows: 5,
            required: true,
            help: 'Plain text. Two or three sentences is usually plenty.',
          },
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            half: true,
            options: [
              { value: 'General', label: 'General' },
              { value: 'Support', label: 'Support (also shown on Contact)' },
              { value: 'Features', label: 'Features' },
              { value: 'Privacy', label: 'Privacy' },
              { value: 'Account', label: 'Account' },
            ],
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
