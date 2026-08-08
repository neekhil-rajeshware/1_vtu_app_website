import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  Bell,
  BellRing,
  Building2,
  FileText,
  Flag,
  Gauge,
  HelpCircle,
  Image as ImageIcon,
  Images,
  Inbox,
  Layers,
  Link as LinkIcon,
  Newspaper,
  Quote,
  ScrollText,
  Settings,
  Sparkles,
  Star,
  Tag,
  UserCog,
} from 'lucide-react'

export type AdminNavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Plain-language hint shown on the overview page. */
  hint: string
}

export type AdminNavGroup = {
  title: string
  items: AdminNavItem[]
}

/**
 * The dashboard menu. Grouped the way the owner thinks about the site rather
 * than the way the database is laid out.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: Gauge,
        hint: 'What needs your attention right now.',
      },
    ],
  },
  {
    title: 'The app',
    items: [
      {
        href: '/admin/push',
        label: 'Push notifications',
        icon: BellRing,
        hint: 'Send a notification to students’ phones.',
      },
    ],
  },
  {
    title: 'The website',
    items: [
      {
        href: '/admin/app-name',
        label: 'App name',
        icon: Tag,
        hint: 'Type it once — the whole website follows it.',
      },
      {
        href: '/admin/settings',
        label: 'Site settings',
        icon: Settings,
        hint: 'Logo, website address, contact email, social links, SEO.',
      },
      {
        href: '/admin/home',
        label: 'Home page',
        icon: Layers,
        hint: 'Headline, section headings, and what shows or hides.',
      },
      {
        href: '/admin/announcement',
        label: 'Announcement bar',
        icon: Bell,
        hint: 'The thin strip at the very top of every page.',
      },
    ],
  },
  {
    title: 'Content',
    items: [
      {
        href: '/admin/features',
        label: 'Features',
        icon: Sparkles,
        hint: 'Everything your app can do, grouped into sections.',
      },
      {
        href: '/admin/screenshots',
        label: 'Screenshots',
        icon: Images,
        hint: 'Phone screens shown on the home and screenshots pages.',
      },
      {
        href: '/admin/stats',
        label: 'Numbers strip',
        icon: BadgeCheck,
        hint: 'Downloads, subjects covered, and other headline numbers.',
      },
      {
        href: '/admin/testimonials',
        label: 'Student reviews',
        icon: Quote,
        hint: 'Quotes from students, with a star rating.',
      },
      {
        href: '/admin/faqs',
        label: 'FAQ',
        icon: HelpCircle,
        hint: 'Questions and answers, grouped by category.',
      },
      {
        href: '/admin/posts',
        label: 'Blog posts',
        icon: Newspaper,
        hint: 'Write updates and study guides. Drafts stay hidden.',
      },
      {
        href: '/admin/versions',
        label: 'Version history',
        icon: FileText,
        hint: 'What changed in each release of the app.',
      },
    ],
  },
  {
    title: 'Inbox',
    items: [
      {
        href: '/admin/messages',
        label: 'Messages',
        icon: Inbox,
        hint: 'Everything sent through the contact form.',
      },
      {
        href: '/admin/reports',
        label: 'Content reports',
        icon: Flag,
        hint: 'Marketplace listings students have reported.',
      },
    ],
  },
  {
    title: 'App and legal',
    items: [
      {
        href: '/admin/developer',
        label: 'Developer details',
        icon: Building2,
        hint: 'Your name, address and contact — filled into every legal page.',
      },
      {
        href: '/admin/legal',
        label: 'Legal pages',
        icon: ScrollText,
        hint: 'Privacy policy, terms, deletion, community guidelines.',
      },
      {
        href: '/admin/app-links',
        label: 'In-app links',
        icon: LinkIcon,
        hint: 'Change where buttons inside the app go, with no app update.',
      },
      {
        href: '/admin/ads-txt',
        label: 'app-ads.txt',
        icon: Star,
        hint: 'The AdMob verification file served at your domain root.',
      },
      {
        href: '/admin/media',
        label: 'Media library',
        icon: ImageIcon,
        hint: 'Every image you have uploaded, with copyable links.',
      },
      {
        href: '/admin/account',
        label: 'My account',
        icon: UserCog,
        hint: 'Change your own password.',
      },
    ],
  },
]

export const ADMIN_ITEMS: AdminNavItem[] = ADMIN_NAV.flatMap(
  (group) => group.items,
)
