'use client'

import Link from 'next/link'
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
  AlertTriangle,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface SidebarProps {
  user: Profile | null
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Sessions', href: '/sessions', icon: FileText },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

const adminNavigation = [
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

function NavItem({
  item,
  isActive,
  index,
}: {
  item: { name: string; href: string; icon: React.ElementType }
  isActive: boolean
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        href={item.href}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-white/10 text-white'
            : 'text-white/60 hover:bg-white/5 hover:text-white'
        )}
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}

        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <item.icon
            className={cn(
              'h-5 w-5 transition-colors',
              isActive ? 'text-primary' : 'text-current'
            )}
          />
        </motion.div>

        <span className="flex-1">{item.name}</span>

        {isActive && (
          <ChevronRight className="h-4 w-4 text-primary/60" />
        )}
      </Link>
    </motion.div>
  )
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = user?.role === 'admin'
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Prevent scroll when mobile menu is open
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
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/30 blur-lg rounded-lg" />
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </motion.div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">
              TheraNote
            </span>
            <div className="flex items-center gap-1 text-[10px] text-white/40 font-medium">
              <Sparkles className="h-2.5 w-2.5" />
              <span>AI-Powered</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return <NavItem key={item.name} item={item} isActive={isActive} index={index} />
        })}

        {isAdmin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-6 pb-2"
            >
              <p className="px-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">
                Admin
              </p>
            </motion.div>
            {adminNavigation.map((item, index) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  index={index + navigation.length}
                />
              )
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 border-t border-white/10"
      >
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/80 to-blue-600/80 flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-[hsl(var(--sidebar-bg))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-white/50 truncate capitalize">
              {user?.role || 'therapist'}
              {user?.discipline && ` - ${user.discipline.toUpperCase()}`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
        </div>
      </motion.div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-[hsl(var(--sidebar-bg))] text-white shadow-lg"
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
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[hsl(var(--sidebar-bg))] flex flex-col shadow-2xl"
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </motion.aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[hsl(var(--sidebar-bg))] flex-col">
        {sidebarContent}
      </aside>
    </>
  )
}
