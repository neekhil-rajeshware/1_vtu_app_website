import {
  Archive,
  ArrowLeftRight,
  AudioLines,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  CalendarClock,
  ChartColumn,
  ClipboardCheck,
  Cloud,
  Code2,
  FileText,
  Gift,
  GraduationCap,
  HelpCircle,
  History,
  Layers,
  LayoutGrid,
  Library,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Palette,
  RefreshCw,
  Rocket,
  ScanText,
  ScrollText,
  Shield,
  Sigma,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Trophy,
  Users,
  WifiOff,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

/**
 * Features and stats store an icon *name* in the database, so the admin can
 * change an icon without a code change. Only the names listed here are bundled,
 * which keeps the JavaScript small. Anything unrecognised falls back to
 * Sparkles rather than rendering nothing.
 *
 * ICON_NAMES is also what the admin dashboard offers in its icon picker.
 */
const ICONS: Record<string, LucideIcon> = {
  Archive,
  ArrowLeftRight,
  AudioLines,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  CalendarClock,
  ChartColumn,
  ClipboardCheck,
  Cloud,
  Code2,
  FileText,
  Gift,
  GraduationCap,
  HelpCircle,
  History,
  Layers,
  LayoutGrid,
  Library,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Palette,
  RefreshCw,
  Rocket,
  ScanText,
  ScrollText,
  Shield,
  Sigma,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Trophy,
  Users,
  WifiOff,
  Wrench,
}

export const ICON_NAMES = Object.keys(ICONS).sort()

export function DynamicIcon({
  name,
  className = 'h-5 w-5',
}: {
  name?: string | null
  className?: string
}) {
  const Icon = (name && ICONS[name]) || Sparkles
  return <Icon className={className} aria-hidden="true" />
}
