import { AdminCard } from '@/components/admin/fields'
import { SettingsForm } from '@/components/admin/settings-form'
import { getRawSettings } from '@/lib/settings'
import { siteUrl } from '@/lib/utils'

export const metadata = { title: 'app-ads.txt' }

export default async function AdminAdsTxtPage() {
  const settings = await getRawSettings()
  const url = `${siteUrl()}/app-ads.txt`

  return (
    <div className="space-y-4">
      <AdminCard title="What this file is for">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            AdMob checks this file to confirm that you, and only you, are allowed
            to sell ads in your app. Without it your ads still work, but you are
            paid less because many buyers skip unverified apps.
          </p>
          <p>
            Two things have to line up. First, the website address in your Play
            Store listing must be this site. Second, this file must be reachable
            at the exact address below. It already is — you only need to paste
            the line AdMob gives you.
          </p>
          <p className="font-mono text-xs break-all text-foreground">{url}</p>
          <p>
            In AdMob, go to <strong>Apps</strong> → your app →{' '}
            <strong>App settings</strong> → <strong>app-ads.txt</strong>, copy the
            line shown there, paste it below, and save. It looks like{' '}
            <span className="font-mono text-xs">
              google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
            </span>
            . Verification can take a day or two after that.
          </p>
        </div>
      </AdminCard>

      <SettingsForm
        settingsKey="adstxt"
        initial={settings.adstxt as unknown as Record<string, unknown>}
        groups={[
          {
            title: 'File contents',
            description:
              'Served exactly as typed. Lines starting with # are comments and are ignored by crawlers.',
            fields: [
              {
                name: 'content',
                label: 'app-ads.txt',
                type: 'code',
                rows: 12,
                help: 'One entry per line. Do not add anything you were not given by an ad network.',
              },
            ],
          },
        ]}
      />
    </div>
  )
}
