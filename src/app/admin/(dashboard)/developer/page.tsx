import Link from 'next/link'
import { AdminCard } from '@/components/admin/fields'
import { SettingsForm } from '@/components/admin/settings-form'
import { getRawSettings, getSettings, placeholderValues } from '@/lib/settings'

export const metadata = { title: 'Developer details' }

/** Where each value shows up, in the owner's words rather than in tokens. */
const USED_FOR: { token: string; where: string }[] = [
  {
    token: '[DEVELOPER_NAME]',
    where: 'Privacy policy, Terms (who provides the service, liability, indemnity), Delete account, Community guidelines',
  },
  { token: '[DEVELOPER_ADDRESS]', where: 'Privacy policy, Terms' },
  { token: '[DEVELOPER_EMAIL]', where: 'Privacy policy, Terms' },
  { token: '[DEVELOPER_PHONE]', where: 'Privacy policy, Terms — only if you fill it in' },
  { token: '[GOVERNING_LAW]', where: 'Terms, Governing law' },
  { token: '[JURISDICTION]', where: 'Terms, Governing law' },
]

export default async function AdminDeveloperPage() {
  // The form is fed the stored text, so saving it cannot bake a resolved
  // placeholder in; the preview below uses the resolved copy, because that is
  // what a visitor actually reads.
  const [settings, resolved] = await Promise.all([getRawSettings(), getSettings()])
  const values = placeholderValues(resolved)

  return (
    <div className="space-y-4">
      <AdminCard title="Why this page exists">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Your legal pages have to say who publishes the app, how to reach
            them, and whose law applies. Rather than repeating that in four
            different pages, it is typed here once and{' '}
            <strong className="text-foreground">
              filled into every legal page automatically
            </strong>{' '}
            when the page is opened. Change your address here and all four pages
            change with it — no editing, no deploy.
          </p>
          <p>
            Google Play asks for a real name and a working contact address for
            the developer account, and checks that your privacy policy matches.
            Keep this the same as what you entered in the Play Console.
          </p>
        </div>
      </AdminCard>

      <AdminCard
        title="Where these appear right now"
        description="This is what your legal pages show. Anything empty is left out of the page rather than shown blank."
      >
        <dl className="space-y-2.5">
          {USED_FOR.map((item) => (
            <div
              key={item.token}
              className="rounded-xl border border-border bg-muted/30 px-3 py-2.5"
            >
              <dt className="text-sm font-semibold">
                {values[item.token] ? (
                  values[item.token]
                ) : (
                  <span className="text-muted-foreground">Not filled in</span>
                )}
              </dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.where}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Writing your own legal text? Type{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono">
            [DEVELOPER_NAME]
          </code>{' '}
          — or any of the names above — anywhere in{' '}
          <Link href="/admin/legal" className="font-semibold text-primary hover:underline">
            Legal pages
          </Link>{' '}
          and it is replaced with the value from this page every time someone
          opens it.
        </p>
      </AdminCard>

      <SettingsForm
        settingsKey="developer"
        initial={settings.developer as unknown as Record<string, unknown>}
        groups={[
          {
            title: 'Who publishes the app',
            description:
              'The person or company legally behind it. This is the name that appears in your Terms and Privacy policy.',
            fields: [
              {
                name: 'legal_name',
                label: 'Developer or company name',
                type: 'text',
                half: true,
                placeholder: 'Your full name, or your company name',
                help: 'Use the same name as your Play Console developer account.',
              },
              {
                name: 'email',
                label: 'Legal contact email',
                type: 'email',
                half: true,
                placeholder: 'Leave empty to use your support email',
                help: 'Only needed if legal notices should go somewhere other than your support email.',
              },
              {
                name: 'phone',
                label: 'Phone number',
                type: 'text',
                half: true,
                placeholder: 'Optional',
                help: 'Optional. Left empty, no phone number is published anywhere.',
              },
            ],
          },
          {
            title: 'Postal address',
            description:
              'Fill in as much as you are comfortable publishing. Whatever you leave empty is simply skipped — you will never see a half-finished address on the site.',
            fields: [
              {
                name: 'address_line1',
                label: 'Address line 1',
                type: 'text',
                half: true,
                placeholder: 'Building, street',
              },
              {
                name: 'address_line2',
                label: 'Address line 2',
                type: 'text',
                half: true,
                placeholder: 'Area, landmark',
              },
              { name: 'city', label: 'City', type: 'text', half: true },
              { name: 'state', label: 'State', type: 'text', half: true },
              {
                name: 'postal_code',
                label: 'PIN code',
                type: 'text',
                half: true,
              },
              { name: 'country', label: 'Country', type: 'text', half: true },
            ],
          },
          {
            title: 'Which law applies',
            description:
              'Used in the Governing law section of your Terms. If you are unsure, leave these as they are.',
            fields: [
              {
                name: 'governing_law',
                label: 'Country whose law governs',
                type: 'text',
                half: true,
                placeholder: 'India',
              },
              {
                name: 'jurisdiction',
                label: 'Courts that settle a dispute',
                type: 'text',
                half: true,
                placeholder: 'the competent courts of Bengaluru, Karnataka',
                help: 'Written to follow the words "subject to the exclusive jurisdiction of".',
              },
            ],
          },
        ]}
      />
    </div>
  )
}
