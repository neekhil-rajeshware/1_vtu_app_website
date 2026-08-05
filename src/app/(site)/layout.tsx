import { AnnouncementBar } from '@/components/announcement-bar'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { appName, getSettings } from '@/lib/settings'

/**
 * Chrome shared by every public page: announcement strip, header, footer.
 * The admin dashboard lives outside this group and has its own layout.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSettings()

  return (
    <>
      <AnnouncementBar settings={settings.announcement} />
      <SiteHeader
        siteName={appName(settings)}
        tagline={settings.site.tagline}
        logoUrl={settings.site.logo_url}
        playStoreUrl={settings.download.play_store_url}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </>
  )
}
