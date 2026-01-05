'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  School,
  ShieldCheck,
  DollarSign,
  Users2,
  FileText,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Classrooms', href: '/classrooms', icon: School },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Families', href: '/families', icon: Users2 },
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
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-800">
        <Building2 className="h-8 w-8 text-purple-500" />
        <span className="text-xl font-bold text-white">ThriveSync</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-gray-800 p-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

      {/* TheraNote Link */}
      <div className="border-t border-gray-800 p-3">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-purple-400 hover:bg-purple-900/20 transition-colors"
        >
          <FileText className="h-5 w-5" />
          Open TheraNote →
        </a>
      </div>
    </div>
  )
}
