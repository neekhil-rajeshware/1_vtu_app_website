import { AdminCard } from '@/components/admin/fields'
import { CollectionEditor } from '@/components/admin/collection-editor'
import { ScreenVisibility } from '@/components/admin/screen-visibility'
import { bundledScreenshots } from '@/lib/app-screens'
import { getSetting } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Screenshots' }

export default async function AdminScreenshotsPage() {
  const supabase = await createClient()
  const [{ count }, { hidden }] = await Promise.all([
    supabase.from('web_screenshots').select('id', { count: 'exact', head: true }),
    getSetting('screens'),
  ])
  const overridden = (count ?? 0) > 0

  return (
    <div className="space-y-4 pb-24">
      <AdminCard title="Getting good screenshots">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The website already ships with {bundledScreenshots.length} screenshots
          taken from the app itself. Pick the ones you want visitors to see below —
          tick and un-tick, then save. Nothing else to do.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <strong className="font-semibold text-foreground">
            Adding your own is optional.
          </strong>{' '}
          Anything you add at the bottom of this page replaces all{' '}
          {bundledScreenshots.length} at once, so add them in the order you want,
          not one at a time. Take them on a phone with the status bar tidy and
          upload the plain image — the website adds the phone frame for you.
        </p>
      </AdminCard>

      <ScreenVisibility
        shots={bundledScreenshots}
        hidden={hidden}
        overridden={overridden}
      />

      <CollectionEditor
        table="web_screenshots"
        singular="screenshot"
        titleField="title"
        subtitleField="category"
        imageField="image_url"
        defaults={{ is_active: true, category: 'General' }}
        emptyTitle="Using the screenshots that came with the site"
        emptyDescription="The gallery is already full. Only add here if you want to replace the whole set with your own."
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
