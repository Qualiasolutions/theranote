'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building,
  ShieldCheck,
  Wallet,
  UserCircle,
  FileText,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Classrooms', href: '/classrooms', icon: Building },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { name: 'Finance', href: '/finance', icon: Wallet },
  { name: 'Families', href: '/families', icon: UserCircle },
  { name: 'Reports', href: '/reports', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-full w-56 flex-col bg-[hsl(var(--sidebar-bg))] shrink-0">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-white/[0.06]">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-sm font-bold text-white">T</span>
        </div>
        <span className="text-[15px] font-semibold text-white tracking-tight">ThriveSync</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/[0.05] hover:text-white/90'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full" />
              )}
              <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-white/50')} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-white/[0.06] p-2 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/[0.05] hover:text-white/90 transition-colors duration-150"
        >
          <Settings className="h-4 w-4 text-white/50" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/[0.05] hover:text-white/90 transition-colors duration-150"
        >
          <LogOut className="h-4 w-4 text-white/50" />
          Sign Out
        </button>
      </div>

      {/* TheraNote Link */}
      <div className="border-t border-white/[0.06] p-2">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-white/50 hover:bg-white/[0.05] hover:text-white/70 transition-colors duration-150"
        >
          <span>Open TheraNote</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}
