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
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Anything the database can count should be{' '}
          <strong className="font-semibold text-foreground">counted</strong> rather
          than typed: set <em>Where the number comes from</em> and the website
          overrides the typed value with the live one on every page load. The strip
          had drifted before this existed — it read 338 formulas against a table of
          over six thousand.
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
            name: 'metric',
            label: 'Where the number comes from',
            type: 'select',
            help:
              'Leave as "Typed by hand" for anything the database cannot count on its own — study tools and unit converters live in the app code. Everything else is read live, and the typed number above is ignored while one is chosen.',
            options: [
              { value: '', label: 'Typed by hand' },
              { value: 'formulas', label: 'Formulas in the library' },
              { value: 'gate_papers', label: 'GATE papers, keys and solutions' },
              { value: 'syllabuses', label: 'Syllabus PDFs on file' },
              { value: 'branches_covered', label: 'Branches with subjects' },
              { value: 'colleges', label: 'Colleges on file' },
              { value: 'pyq_papers', label: 'Previous-year paper links' },
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
