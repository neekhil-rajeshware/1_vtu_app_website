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

      {/*
        Monetag (Multitag, zone 299926). Deliberately in the public layout, not
        the root layout: the root also wraps `/admin`, and a third-party ad
        script has no business running on a signed-in dashboard. The `sw.js`
        Monetag uses for verification and web push is in `public/sw.js`.

        A raw element, not `next/script`: `afterInteractive` injects the tag
        after hydration, so it is absent from the HTML a verifier fetches.
        React 19 hoists this into <head>, which is where Monetag asks for it.
      */}
      <script
        src="https://quge5.com/88/tag.min.js"
        data-zone="299926"
        data-cfasync="false"
        async
      />
    </>
  )
}
