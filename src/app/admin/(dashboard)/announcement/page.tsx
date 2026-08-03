import { AdminCard } from '@/components/admin/fields'
import { SettingsForm } from '@/components/admin/settings-form'
import { getSettings } from '@/lib/settings'

export const metadata = { title: 'Announcement bar' }

export default async function AdminAnnouncementPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-4">
      <AdminCard title="How it behaves">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The bar sits above the header on every page. Visitors can close it, and
          it stays closed for them until you change the wording — so a new
          announcement is always seen, and an old one never nags. Turn it off
          when there is nothing to say.
        </p>
      </AdminCard>

      <SettingsForm
        settingsKey="announcement"
        initial={settings.announcement as unknown as Record<string, unknown>}
        groups={[
          {
            title: 'Announcement',
            fields: [
              {
                name: 'enabled',
                label: 'Show the announcement bar',
                type: 'toggle',
              },
              {
                name: 'text',
                label: 'Message',
                type: 'textarea',
                rows: 2,
                maxLength: 200,
                help: 'Short and specific. For example: Results out — check the 4th semester timetable.',
              },
              {
                name: 'tone',
                label: 'Colour',
                type: 'select',
                half: true,
                options: [
                  { value: 'brand', label: 'Brand blue' },
                  { value: 'warning', label: 'Attention red' },
                  { value: 'neutral', label: 'Quiet grey' },
                ],
              },
              {
                name: 'link_label',
                label: 'Button text',
                type: 'text',
                half: true,
                placeholder: 'See details',
                help: 'Optional. Leave empty for a message with no link.',
              },
              {
                name: 'link_url',
                label: 'Button link',
                type: 'text',
                help: 'A full https:// link, or a path on this site such as /download.',
              },
            ],
          },
        ]}
      />
    </div>
  )
}
