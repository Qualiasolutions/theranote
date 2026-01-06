'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/database'
import { motion, FadeIn } from '@/components/ui/motion'
import { LogOut, Bell, Search } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  user: Profile | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <FadeIn>
      <header className="h-14 bg-white border-b border-black/[0.04] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        {/* Left section - Greeting */}
        <div className="hidden sm:block">
          <p className="text-[13px] text-muted-foreground">{today}</p>
          <h1 className="text-[15px] font-medium text-foreground">
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
        </div>

        {/* Mobile spacer for menu button */}
        <div className="lg:hidden w-10" />

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-sm mx-8">
          <div
            className={`relative w-full transition-all duration-200 ${
              isSearchFocused ? 'scale-[1.01]' : ''
            }`}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search..."
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full pl-9 pr-4 py-1.5 rounded-lg text-sm transition-all duration-200
                ${isSearchFocused
                  ? 'bg-white border-black/10 ring-1 ring-black/5'
                  : 'bg-muted/50 border-transparent hover:bg-muted'
                }
                border focus:outline-none
              `}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-muted-foreground/50 bg-black/[0.03] rounded font-mono">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-1">
          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 mr-1 rounded-md bg-emerald-50 border border-emerald-100">
            <div className="status-dot status-dot-success" />
            <span className="text-xs font-medium text-emerald-700">Online</span>
          </div>

          {/* Notifications - 44px touch target */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11 rounded-lg hover:bg-black/[0.04]"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
          </motion.div>

          {/* Sign out - 44px touch target */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-11 w-11 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </header>
    </FadeIn>
  )
}
