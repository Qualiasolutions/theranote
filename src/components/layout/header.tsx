'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/database'
import { motion, FadeIn } from '@/components/ui/motion'
import { LogOut, Bell, Search, Calendar, Sparkles } from 'lucide-react'
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
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        {/* Left section - Greeting */}
        <div className="hidden sm:block">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-0.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{today}</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
            </h1>
          </motion.div>
        </div>

        {/* Mobile spacer for menu button */}
        <div className="lg:hidden w-10" />

        {/* Center - Search (desktop) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="hidden md:flex flex-1 max-w-md mx-8"
        >
          <div
            className={`relative w-full transition-all duration-300 ${
              isSearchFocused ? 'scale-[1.02]' : ''
            }`}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students, sessions..."
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border transition-all duration-300
                ${isSearchFocused
                  ? 'bg-white border-primary/30 shadow-lg shadow-primary/5 ring-2 ring-primary/10'
                  : 'bg-muted/50 border-transparent hover:bg-muted'
                }
                focus:outline-none
              `}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-muted-foreground/70 bg-muted rounded font-mono">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </motion.div>

        {/* Right section - Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1 sm:gap-2"
        >
          {/* AI Status */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI Ready</span>
          </motion.div>

          {/* Notifications */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl hover:bg-muted"
            >
              <Bell className="h-5 w-5" />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"
              />
              <motion.span
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 right-2 h-2 w-2 bg-red-500/50 rounded-full"
              />
            </Button>
          </motion.div>

          {/* Sign out */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </header>
    </FadeIn>
  )
}
