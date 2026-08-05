import { ImageResponse } from 'next/og'
import { appName, getSettings } from '@/lib/settings'

/**
 * The picture that shows when a link to this site is pasted into WhatsApp,
 * Telegram or X. Drawn here so there is always something on-brand, even before
 * the owner uploads a sharing image in Admin → Site settings. If they do upload
 * one, the layout uses that instead and this is never called.
 *
 * Brand colours are copied from globals.css on purpose: this runs outside React,
 * so it cannot read CSS variables.
 */
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function GET() {
  const settings = await getSettings()
  const { site, seo } = settings

  const heading = appName(settings)
  const tagline = seo.default_description || site.tagline || ''
  const domain = (site.domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(135deg, #002878 0%, #003399 55%, #1a56db 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: '#ffffff',
              color: '#003399',
              fontSize: '34px',
              fontWeight: 800,
            }}
          >
            {heading.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ fontSize: '30px', fontWeight: 700, opacity: 0.92 }}>
            {heading}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: tagline.length > 90 ? '54px' : '66px',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-1.5px',
            }}
          >
            {tagline || 'Everything for your VTU semester, in one app'}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontSize: '26px',
              opacity: 0.85,
            }}
          >
            <div
              style={{
                width: '54px',
                height: '6px',
                borderRadius: '3px',
                background: '#ff4d67',
              }}
            />
            {domain || 'Free on Google Play'}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
