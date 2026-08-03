import { AdminCard } from '@/components/admin/fields'
import { HomeSectionsEditor } from '@/components/admin/home-sections-editor'
import { SettingsForm } from '@/components/admin/settings-form'
import { getSettings } from '@/lib/settings'

export const metadata = { title: 'Home page' }

export default async function AdminHomePage() {
  const settings = await getSettings()

  return (
    <div className="space-y-5">
      <SettingsForm
        settingsKey="hero"
        initial={settings.hero as unknown as Record<string, unknown>}
        groups={[
          {
            title: 'The headline area',
            description:
              'The first thing anyone sees. The highlighted words are shown in the brand gradient.',
            fields: [
              {
                name: 'badge',
                label: 'Small badge above the headline',
                type: 'text',
                half: true,
                placeholder: 'Built for VTU students',
                maxLength: 60,
              },
              {
                name: 'heading',
                label: 'Headline',
                type: 'text',
                help: 'The plain part of the headline.',
                placeholder: 'Everything for your semester,',
              },
              {
                name: 'highlight',
                label: 'Highlighted words',
                type: 'text',
                half: true,
                help: 'Shown in colour, right after the headline.',
                placeholder: 'in one app',
              },
              {
                name: 'subheading',
                label: 'Supporting line',
                type: 'textarea',
                rows: 3,
                help: 'Two sentences at most. Say what the app does, not how great it is.',
              },
              {
                name: 'image_url',
                label: 'Phone screenshot',
                type: 'image',
                help: 'Shown inside a phone frame. Leave empty and a drawn placeholder is used instead.',
              },
            ],
          },
          {
            title: 'The two buttons',
            description:
              'Leave the first link empty while the app is not live — the button then shows that it is coming soon rather than going nowhere.',
            fields: [
              {
                name: 'primary_cta_label',
                label: 'Main button text',
                type: 'text',
                half: true,
                placeholder: 'Get it on Google Play',
              },
              {
                name: 'primary_cta_url',
                label: 'Main button link',
                type: 'text',
                half: true,
                help: 'Leave empty to fall back to the Play Store link in Site settings.',
              },
              {
                name: 'secondary_cta_label',
                label: 'Second button text',
                type: 'text',
                half: true,
                placeholder: 'See all features',
              },
              {
                name: 'secondary_cta_url',
                label: 'Second button link',
                type: 'text',
                half: true,
                placeholder: '/features',
              },
            ],
          },
        ]}
      />

      <AdminCard
        title="Sections on the home page"
        description="Hide anything you are not ready to show, and change the heading above each block. Sections with nothing in them hide themselves anyway."
      >
        <HomeSectionsEditor />
      </AdminCard>

      <div className="h-16" />
    </div>
  )
}
