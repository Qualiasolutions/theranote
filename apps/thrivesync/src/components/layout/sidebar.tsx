'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from '@/components/ui/motion'
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
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Classrooms', href: '/classrooms', icon: Building },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { name: 'Finance', href: '/finance', icon: Wallet },
  { name: 'Families', href: '/families', icon: UserCircle },
  { name: 'Reports', href: '/reports', icon: FileText },
]

function NavItem({
  item,
  isActive,
}: {
  item: { name: string; href: string; icon: React.ElementType }
  isActive: boolean
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-white/60 hover:bg-white/[0.05] hover:text-white/90'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-white/50')} />
      <span className="truncate">{item.name}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Lazy-load supabase client
  const getSupabase = useMemo(() => {
    let supabase: ReturnType<typeof import('@/lib/supabase/client').createClient> | null = null
    return () => {
      if (!supabase) {
        const { createClient } = require('@/lib/supabase/client')
        supabase = createClient()
      }
      return supabase
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  const handleSignOut = async () => {
    const supabase = getSupabase()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="https://images.squarespace-cdn.com/content/v1/65bf52f873aac538961445c5/19d16cc5-aa83-437c-9c2a-61de5268d5bf/Untitled+design+-+2025-01-19T070746.544.png?format=1500w"
            alt="ThriveSync"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="text-[15px] font-semibold text-white tracking-tight">ThriveSync</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return <NavItem key={item.name} item={item} isActive={isActive} />
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
      <div className="border-t border-white/[0.06] p-3">
        <a
          href="https://theranote-delta.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/[0.05] hover:text-white/70 transition-colors duration-150"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded bg-white/10 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-white/70">TN</span>
            </div>
            <span>TheraNote</span>
          </div>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2.5 rounded-lg bg-[hsl(var(--sidebar-bg))] text-white/80 hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Mobile sidebar */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isMobileOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--sidebar-bg))] flex flex-col"
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </motion.aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-[hsl(var(--sidebar-bg))] flex-col shrink-0">
        {sidebarContent}
      </aside>
    </>
  )
}
