'use client'

import { Bell, Search } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-black/[0.04] bg-white px-6">
      <div>
        <h1 className="text-[15px] font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          className={`relative transition-all duration-200 ${
            isSearchFocused ? 'scale-[1.01]' : ''
          }`}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="search"
            placeholder="Search..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`h-8 w-56 rounded-lg pl-9 pr-4 text-sm transition-all duration-200
              ${isSearchFocused
                ? 'bg-white border-black/10 ring-1 ring-black/5'
                : 'bg-muted/50 border-transparent hover:bg-muted'
              }
              border focus:outline-none
            `}
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-black/[0.04] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}
