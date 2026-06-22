import {
  BarChart3,
  Briefcase,
  BriefcaseBusiness,
  Compass,
  DollarSign,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
  Video,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconByName: Record<string, LucideIcon> = {
  'bar-chart-3': BarChart3,
  briefcase: Briefcase,
  'briefcase-business': BriefcaseBusiness,
  compass: Compass,
  'dollar-sign': DollarSign,
  inbox: Inbox,
  'layout-dashboard': LayoutDashboard,
  megaphone: Megaphone,
  'message-square': MessageSquare,
  settings: Settings,
  users: Users,
  video: Video,
  wallet: Wallet,
}

export function resolveNavIcon(name: string): LucideIcon {
  return iconByName[name] ?? Inbox
}
