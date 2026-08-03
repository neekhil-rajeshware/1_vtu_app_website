import type { ReactNode, SVGProps } from 'react'

export type SocialNetwork =
  | 'youtube'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'telegram'
  | 'whatsapp'

export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  twitter: 'X',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
}

/**
 * Hand-drawn social marks.
 *
 * lucide-react v1 removed its brand icons, so these are drawn here in the same
 * outline style (1.7px stroke, round caps) as the lucide icons they sit beside.
 */
export function SocialIcon({
  network,
  ...props
}: { network: SocialNetwork } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[network]}
    </svg>
  )
}

const PATHS: Record<SocialNetwork, ReactNode> = {
  youtube: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="4.5" />
      <path d="M10.2 9.4 15.4 12l-5.2 2.6Z" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.9" />
      <circle cx="17.1" cy="6.9" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  twitter: (
    <>
      <path d="M4.2 4.2 19.8 19.8" />
      <path d="M19.8 4.2 4.2 19.8" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M7.4 10.6v6.6" />
      <circle cx="7.4" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11.4 17.2v-6.6" />
      <path d="M11.4 13.4c0-1.6 1.1-2.8 2.6-2.8s2.6 1.2 2.6 2.8v3.8" />
    </>
  ),
  telegram: (
    <>
      <path d="M21 4.4 2.9 11.2l4.9 1.7" />
      <path d="M21 4.4 17.9 20l-6.4-4.6" />
      <path d="M7.8 12.9 11.5 15.4 21 4.4" />
      <path d="M11.5 15.4v4.1l2.6-2.9" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.6 20.4l1.4-4.4A8.4 8.4 0 1 1 20.5 11.6Z" />
      <path d="M9.1 8.9c.5 2.5 2.5 4.5 5 5l1-1.4-2-.8-.8.8a4.6 4.6 0 0 1-1.8-1.8l.8-.8-.8-2Z" />
    </>
  ),
}
