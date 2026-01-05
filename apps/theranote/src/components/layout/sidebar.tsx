'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { motion } from '@/components/ui/motion'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Shield,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface SidebarProps {
  user: Profile | null
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Sessions', href: '/sessions', icon: FileText },
  { name: 'Incidents', href: '/incidents', icon: AlertCircle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

const adminNavigation = [
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
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
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-white/50')} />
      <span className="truncate">{item.name}</span>
    </Link>
  )
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = user?.role === 'admin'
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

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

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="https://images.squarespace-cdn.com/content/v1/65bf52f873aac538961445c5/19d16cc5-aa83-437c-9c2a-61de5268d5bf/Untitled+design+-+2025-01-19T070746.544.png?format=1500w"
            alt="TheraNote"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="text-[15px] font-semibold text-white tracking-tight">
            TheraNote
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return <NavItem key={item.name} item={item} isActive={isActive} />
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1.5">
              <p className="px-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return <NavItem key={item.name} item={item} isActive={isActive} />
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-white/40 truncate capitalize">
              {user?.role || 'therapist'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-white/30" />
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-[hsl(var(--sidebar-bg))] text-white/80 hover:text-white transition-colors"
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
