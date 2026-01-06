'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'

const ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'aide', label: 'Aide' },
  { value: 'staff', label: 'Staff' },
]

const STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'incomplete', label: 'Incomplete' },
]

export function StaffFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [role, setRole] = useState(searchParams.get('role') || 'all')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [showFilters, setShowFilters] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout>(null)

  // Check if any filters are active
  const hasActiveFilters = search || role !== 'all' || status !== 'all'

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Update URL when filters change (debounced for search)
  const updateUrl = (params: { search: string; role: string; status: string }, immediate = false) => {
    const update = () => {
      const newParams = new URLSearchParams()

      if (params.search) {
        newParams.set('search', params.search)
      }
      if (params.role && params.role !== 'all') {
        newParams.set('role', params.role)
      }
      if (params.status && params.status !== 'all') {
        newParams.set('status', params.status)
      }

      const queryString = newParams.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    }

    if (immediate) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      update()
    } else {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(update, 300)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    updateUrl({ search: value, role, status })
  }

  const handleRoleChange = (value: string) => {
    setRole(value)
    updateUrl({ search, role: value, status }, true)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    updateUrl({ search, role, status: value }, true)
  }

  const clearFilters = () => {
    setSearch('')
    setRole('all')
    setStatus('all')
    router.push(pathname)
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
      {/* Search */}
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search staff..."
          className="h-10 w-full sm:w-64 rounded-lg border bg-white pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 h-10 px-4 rounded-lg border text-sm transition-colors ${
          showFilters || hasActiveFilters
            ? 'border-purple-200 bg-purple-50 text-purple-700'
            : 'bg-white hover:bg-gray-50 text-gray-700'
        }`}
      >
        <Filter className="h-4 w-4" />
        Filter
        {hasActiveFilters && (
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-purple-600 text-white text-xs">
            {[search, role !== 'all', status !== 'all'].filter(Boolean).length}
          </span>
        )}
      </button>

      {/* Filter Dropdowns */}
      {showFilters && (
        <>
          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="h-10 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-10 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 h-10 px-3 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </>
      )}
    </div>
  )
}
