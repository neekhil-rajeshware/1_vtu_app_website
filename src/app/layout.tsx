import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { appName, getSettings, publicWebsiteUrl } from '@/lib/settings'
import './globals.css'

const geistSans = Geist({ variable: '--font-sans-stack', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-mono-stack', subsets: ['latin'] })

/** Title, description, social image and verification all come from Admin -> SEO. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const { site, seo } = settings
  const base = publicWebsiteUrl(settings)
  const name = appName(settings)

  // Falls back to the drawn card at /og so a shared link is never a bare
  // rectangle, even before a sharing image is uploaded.
  const shareImage = seo.og_image_url || `${base}/og`

  return {
    metadataBase: new URL(base),
    title: {
      default: seo.default_title || `${name} — ${site.tagline}`,
      template: `%s — ${name}`,
    },
    description: seo.default_description || site.short_description,
    applicationName: name,
    icons: site.favicon_url ? { icon: site.favicon_url } : undefined,
    openGraph: {
      type: 'website',
      siteName: name,
      url: base,
      title: seo.default_title || `${name} — ${site.tagline}`,
      description: seo.default_description || site.short_description,
      images: [{ url: shareImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.default_title || name,
      description: seo.default_description || site.short_description,
      images: [shareImage],
    },
    verification: seo.google_site_verification
      ? { google: seo.google_site_verification }
      : undefined,
    robots: { index: true, follow: true },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1f' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { seo } = await getSettings()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>

        {/*
          Visitor counts in the Vercel dashboard with nothing to set up, and no
          cookies. Google Analytics below is optional and only loads once a
          measurement ID is pasted into Admin → Site settings.
        */}
        <Analytics />

        {seo.ga_measurement_id ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${seo.ga_measurement_id}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${seo.ga_measurement_id}');`,
              }}
            />
          </>
        ) : null}
      </body>
    </html>
  )
}
