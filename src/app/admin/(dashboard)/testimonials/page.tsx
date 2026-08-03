import { AdminCard } from '@/components/admin/fields'
import { CollectionEditor } from '@/components/admin/collection-editor'

export const metadata = { title: 'Student reviews' }

export default function AdminTestimonialsPage() {
  return (
    <div className="space-y-4">
      <AdminCard title="Use real quotes only">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Ask the student before you publish their name and college. If they would
          rather not be named, use a first name and branch only. Made-up reviews
          are a policy problem on the Play Store, so it is not worth it.
        </p>
      </AdminCard>

      <CollectionEditor
        table="web_testimonials"
        singular="review"
        titleField="student_name"
        subtitleField="quote"
        imageField="avatar_url"
        defaults={{ is_active: true, rating: 5 }}
        emptyTitle="No reviews yet"
        emptyDescription="The reviews section stays hidden until you add one."
        fields={[
          {
            name: 'student_name',
            label: 'Student name',
            type: 'text',
            required: true,
            half: true,
            maxLength: 120,
          },
          {
            name: 'rating',
            label: 'Stars (1 to 5)',
            type: 'number',
            half: true,
          },
          {
            name: 'branch',
            label: 'Branch',
            type: 'text',
            half: true,
            placeholder: 'CSE',
            maxLength: 80,
          },
          {
            name: 'college',
            label: 'College',
            type: 'text',
            half: true,
            placeholder: 'RVCE, Bengaluru',
            maxLength: 120,
          },
          {
            name: 'quote',
            label: 'What they said',
            type: 'textarea',
            rows: 4,
            required: true,
          },
          {
            name: 'avatar_url',
            label: 'Photo',
            type: 'image',
            help: 'Optional. Their initial is shown if you leave this empty.',
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
