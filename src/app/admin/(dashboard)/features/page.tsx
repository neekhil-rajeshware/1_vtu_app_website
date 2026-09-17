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

      <AdminCard title="Giving a feature its own page">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Most features are only listed on the Features page, and that is
            fine. A feature gets a page of its own — at{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              onevtu.in/features/your-web-address
            </code>{' '}
            — only once you fill in <strong>Web address</strong>.
          </p>
          <p>
            Give one to the handful of features students search for by name:
            the ones where somebody types &ldquo;VTU CGPA calculator&rdquo; into
            Google rather than looking for your app. Every one of the 33 getting
            a page would leave 33 near-identical pages competing with each
            other, which search engines treat as filler.
          </p>
          <p>
            <strong>Web address is locked once you save it.</strong> Changing it
            later breaks any link anyone has already shared, so pick the words
            you want and leave them alone. Clearing it removes the page.
          </p>
          <p>
            The <strong>Page headline</strong> is the version Google shows. Put
            the word &ldquo;VTU&rdquo; in it if the feature name does not
            already have it — the app name is added to the end automatically, so
            do not type that in.
          </p>
        </div>
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
            name: 'slug',
            label: 'Web address',
            type: 'text',
            half: true,
            lockOnEdit: true,
            transform: 'slug',
            placeholder: 'vtu-cgpa-calculator',
            help: 'Optional. Filling this in creates the page. Letters, numbers and hyphens only.',
          },
          {
            name: 'seo_title',
            label: 'Page headline',
            type: 'text',
            half: true,
            maxLength: 120,
            placeholder: 'VTU CGPA & SGPA Calculator',
            help: 'Optional. What Google shows as the title. The app name is added automatically.',
          },
          {
            name: 'page_intro',
            label: 'Page content',
            type: 'textarea',
            rows: 14,
            help: 'Optional. The body of the feature page. Plain HTML — start headings at <h2>, since the feature name is already the <h1>.',
          },
          {
            name: 'seo_description',
            label: 'Google description',
            type: 'textarea',
            rows: 3,
            help: 'Optional. The grey sentence under the title in search results. Around 155 characters.',
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
