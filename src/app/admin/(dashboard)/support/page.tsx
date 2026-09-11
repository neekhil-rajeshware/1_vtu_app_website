import { AdminCard } from '@/components/admin/fields'
import { SettingsForm } from '@/components/admin/settings-form'
import { getRawSettings } from '@/lib/settings'
import { siteUrl } from '@/lib/utils'

export const metadata = { title: 'Support page' }

export default async function AdminSupportPage() {
  const settings = await getRawSettings()
  const url = `${siteUrl()}/support`

  return (
    <div className="space-y-4">
      <AdminCard title="Where this appears">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            The Support the Developer entry in the app&apos;s menu opens this
            page in a browser tab, so students can contribute without leaving
            the app. It is also linked in the website footer.
          </p>
          <p className="font-mono text-xs break-all text-foreground">{url}</p>
          <p>
            To find the button id, open the Razorpay dashboard and go to{' '}
            <strong>Payment Button</strong>. Create one if you have none, then
            copy the id from the button&apos;s page — it looks like{' '}
            <span className="font-mono text-xs">pl_XXXXXXXXXXXXXX</span>. The
            embed code Razorpay shows contains the same id in{' '}
            <span className="font-mono text-xs">data_payment_button_id</span>;
            paste only the id here, not the whole snippet.
          </p>
          <p>
            <strong>The amount, colour, label and description belong to the
            button itself</strong>, not to this page. Change those in Razorpay
            and the page follows on its next load — you only need this field to
            swap in a different button.
          </p>
          <p>
            A button belongs to either test mode or live mode. A test-mode id
            shows nothing on the live site, so make sure the button was created
            in live mode.
          </p>
        </div>
      </AdminCard>

      <SettingsForm
        settingsKey="support"
        initial={settings.support as unknown as Record<string, unknown>}
        groups={[
          {
            title: 'Payment button',
            description:
              'Saved instantly — the page picks up a new button on the next load, with no app update and no redeploy.',
            fields: [
              {
                name: 'razorpay_button_id',
                label: 'Razorpay button id',
                type: 'text',
                placeholder: 'pl_XXXXXXXXXXXXXX',
                help: 'Leave empty to take the payment button off the page. The rest of the page stays up, which is the safe state while you are swapping buttons.',
              },
              {
                name: 'intro',
                label: 'Text above the button',
                type: 'textarea',
                rows: 3,
                maxLength: 400,
                help: 'What the money goes towards. Keep it honest and specific.',
              },
            ],
          },
        ]}
      />
    </div>
  )
}
