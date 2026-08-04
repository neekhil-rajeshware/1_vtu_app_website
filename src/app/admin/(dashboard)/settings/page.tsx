import { SettingsTabs, type SettingsTab } from '@/components/admin/settings-tabs'
import { getSettings } from '@/lib/settings'

export const metadata = { title: 'Site settings' }

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  const tabs: SettingsTab[] = [
    {
      key: 'site',
      label: 'Basics',
      initial: settings.site as unknown as Record<string, unknown>,
      groups: [
        {
          title: 'Name and identity',
          description:
            'Used in the header, the browser tab, and anywhere the app name appears.',
          fields: [
            {
              name: 'name',
              label: 'App name',
              type: 'text',
              half: true,
              placeholder: 'OneVTU',
            },
            {
              name: 'domain',
              label: 'Website address',
              type: 'text',
              half: true,
              placeholder: 'onevtu.in',
              help: 'Just the domain, no https://. Used in your legal pages, your sitemap, and every shared link.',
            },
            {
              name: 'tagline',
              label: 'Tagline',
              type: 'text',
              help: 'One short line. Shown next to the logo and in the footer.',
            },
            {
              name: 'short_description',
              label: 'Short description',
              type: 'textarea',
              rows: 3,
              help: 'A sentence or two about the app, used as a fallback description.',
            },
          ],
        },
        {
          title: 'Logo and icon',
          fields: [
            {
              name: 'logo_url',
              label: 'Logo',
              type: 'image',
              help: 'A square PNG works best. Leave empty to show the first letter instead.',
            },
            {
              name: 'favicon_url',
              label: 'Browser icon',
              type: 'image',
              help: 'The tiny icon in the browser tab. 512×512 PNG is fine.',
            },
          ],
        },
      ],
    },
    {
      key: 'contact',
      label: 'Contact',
      initial: settings.contact as unknown as Record<string, unknown>,
      groups: [
        {
          title: 'How people reach you',
          description:
            'The email here is shown on the Contact and About pages, and is used in your legal pages wherever [SUPPORT_EMAIL] appears.',
          fields: [
            {
              name: 'support_email',
              label: 'Support email',
              type: 'email',
              half: true,
              placeholder: 'support@example.com',
            },
            {
              name: 'response_time',
              label: 'How fast you reply',
              type: 'text',
              half: true,
              placeholder: 'Usually within 2 working days',
            },
            {
              name: 'whatsapp_url',
              label: 'WhatsApp group link',
              type: 'url',
              half: true,
            },
            {
              name: 'youtube_url',
              label: 'YouTube channel link',
              type: 'url',
              half: true,
            },
          ],
        },
      ],
    },
    {
      key: 'social',
      label: 'Social links',
      initial: settings.social as unknown as Record<string, unknown>,
      groups: [
        {
          title: 'Where else you are',
          description:
            'Leave any of these empty and the icon simply does not appear.',
          fields: [
            { name: 'whatsapp', label: 'WhatsApp', type: 'url', half: true },
            { name: 'telegram', label: 'Telegram', type: 'url', half: true },
            { name: 'youtube', label: 'YouTube', type: 'url', half: true },
            { name: 'instagram', label: 'Instagram', type: 'url', half: true },
            { name: 'twitter', label: 'X / Twitter', type: 'url', half: true },
            { name: 'linkedin', label: 'LinkedIn', type: 'url', half: true },
          ],
        },
      ],
    },
    {
      key: 'download',
      label: 'Download page',
      initial: settings.download as unknown as Record<string, unknown>,
      groups: [
        {
          title: 'The download button',
          description:
            'Until you paste the Play Store link, every download button on the site politely shows that it is coming soon instead of leading nowhere.',
          fields: [
            {
              name: 'play_store_url',
              label: 'Play Store link',
              type: 'url',
              placeholder: 'https://play.google.com/store/apps/details?id=…',
            },
            {
              name: 'qr_image_url',
              label: 'QR code image',
              type: 'image',
              help: 'Optional. Generate one for your Play Store link and upload it here.',
            },
          ],
        },
        {
          title: 'The facts box',
          fields: [
            {
              name: 'min_android',
              label: 'Requires Android',
              type: 'text',
              half: true,
              placeholder: 'Android 7.0 and above',
            },
            {
              name: 'size',
              label: 'Download size',
              type: 'text',
              half: true,
              placeholder: '28 MB',
            },
            {
              name: 'price',
              label: 'Price',
              type: 'text',
              half: true,
              placeholder: 'Free, with ads',
            },
          ],
        },
      ],
    },
    {
      key: 'seo',
      label: 'Search and sharing',
      initial: settings.seo as unknown as Record<string, unknown>,
      groups: [
        {
          title: 'How the site looks in Google and when shared',
          fields: [
            {
              name: 'default_title',
              label: 'Default page title',
              type: 'text',
              help: 'Around 60 characters. Other pages add their own name in front of this.',
            },
            {
              name: 'default_description',
              label: 'Default description',
              type: 'textarea',
              rows: 3,
              help: 'Around 155 characters. This is the grey text under the link in Google.',
            },
            {
              name: 'og_image_url',
              label: 'Sharing image',
              type: 'image',
              help: 'Shown when the link is pasted into WhatsApp or X. 1200×630 works everywhere.',
            },
          ],
        },
        {
          title: 'Tracking and verification',
          description:
            'Both optional. Paste the codes exactly as Google gives them to you.',
          fields: [
            {
              name: 'ga_measurement_id',
              label: 'Google Analytics ID',
              type: 'text',
              half: true,
              placeholder: 'G-XXXXXXXXXX',
              help: 'Leave empty and no analytics script is loaded at all.',
            },
            {
              name: 'google_site_verification',
              label: 'Google Search Console code',
              type: 'text',
              half: true,
              help: 'The content value of the verification meta tag.',
            },
          ],
        },
      ],
    },
    {
      key: 'footer',
      label: 'Footer',
      initial: settings.footer as unknown as Record<string, unknown>,
      groups: [
        {
          title: 'The bottom of every page',
          fields: [
            {
              name: 'description',
              label: 'Short blurb',
              type: 'textarea',
              rows: 3,
              help: 'Sits under the logo in the footer.',
            },
            {
              name: 'disclaimer',
              label: 'Disclaimer',
              type: 'textarea',
              rows: 4,
              help: 'Keep the line saying you are not affiliated with VTU. It matters both legally and for the Play Store review.',
            },
            {
              name: 'copyright',
              label: 'Copyright name',
              type: 'text',
              half: true,
              help: 'Your name or company. The year is added automatically.',
            },
          ],
        },
      ],
    },
    {
      key: 'about',
      label: 'About page',
      initial: settings.about as unknown as Record<string, unknown>,
      groups: [
        {
          title: 'Your story',
          description: 'This is the whole of the About page apart from the numbers strip.',
          fields: [
            {
              name: 'heading',
              label: 'Heading',
              type: 'text',
              placeholder: 'Why we built this',
            },
            {
              name: 'mission',
              label: 'Subheading',
              type: 'textarea',
              rows: 3,
              help: 'One or two sentences directly under the heading.',
            },
            {
              name: 'story',
              label: 'The longer story',
              type: 'textarea',
              rows: 8,
              help: 'Write it as you would say it. Students respond to the honest version.',
            },
          ],
        },
      ],
    },
  ]

  return <SettingsTabs tabs={tabs} />
}
