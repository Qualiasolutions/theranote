'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ExpenseForm } from '@/components/finance/expense-form'
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ExternalLink,
} from 'lucide-react'
import { format } from 'date-fns'
import type { Expense } from '@repo/database'

// Type for expense with creator info
type ExpenseWithCreator = Expense & {
  creator?: { full_name: string } | null
  approver?: { full_name: string } | null
}

// Category display mapping
const CATEGORY_LABELS: Record<string, string> = {
  supplies: 'Supplies',
  rent: 'Rent',
  utilities: 'Utilities',
  salaries: 'Salaries',
  training: 'Training',
  equipment: 'Equipment',
  transportation: 'Transportation',
  food: 'Food & Meals',
  maintenance: 'Maintenance',
  insurance: 'Insurance',
  other: 'Other',
}

// Allocation type styling
const ALLOCATION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  direct: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Direct' },
  non_direct: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Non-Direct' },
  shared: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Shared' },
  admin: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Admin' },
}

// Status styling
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { bg: 'bg-green-100', text: 'text-green-700' },
  reimbursed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' },
}

const PAGE_SIZE = 20

export function ExpensesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // State
  const [expenses, setExpenses] = useState<ExpenseWithCreator[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Filters from URL
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || 'all'
  const status = searchParams.get('status') || 'all'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const showNewModal = searchParams.get('new') === 'true'

  // Fetch expenses
  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true)

      let query = supabase
        .from('expenses')
        .select(`
          *,
          creator:created_by(full_name),
          approver:approved_by(full_name)
        `, { count: 'exact' })
        .order('expense_date', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      // Apply filters
      if (search) {
        query = query.or(`description.ilike.%${search}%,vendor.ilike.%${search}%`)
      }
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, count, error } = await query

      if (error) {
        console.error('Error fetching expenses:', error)
      } else {
        setExpenses((data as unknown as ExpenseWithCreator[]) || [])
        setTotalCount(count || 0)
      }

      setLoading(false)
    }

    fetchExpenses()
  }, [search, category, status, page])

  // Update URL params
  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`/finance/expenses?${params.toString()}`)
  }

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const searchValue = formData.get('search') as string
    updateParams({ search: searchValue, page: '1' })
  }

  // Export to CSV
  const handleExport = async () => {
    startTransition(async () => {
      // Fetch all expenses (no pagination) for export
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })

      if (error || !data) {
        console.error('Export error:', error)
        return
      }

      const expenseData = data as unknown as Expense[]

      // Generate CSV
      const headers = ['Date', 'Description', 'Vendor', 'Category', 'Amount', 'Type', 'Status', 'Payment Method']
      const rows = expenseData.map((e) => [
        e.expense_date || '',
        e.description || '',
        e.vendor || '',
        CATEGORY_LABELS[e.category || 'other'] || e.category || '',
        e.amount.toString(),
        ALLOCATION_STYLES[e.allocation_type || 'direct']?.label || '',
        e.status || 'pending',
        e.payment_method || '',
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()
      URL.revokeObjectURL(url)
    })
  }

  // Close modal
  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    router.push(`/finance/expenses?${params.toString()}`)
  }

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search expenses..."
                className="h-10 w-64 rounded-lg border bg-white pl-9 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </form>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => updateParams({ category: e.target.value, page: '1' })}
              className="h-10 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
              className="h-10 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="reimbursed">Reimbursed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={isPending}
              className="flex items-center gap-2 h-10 px-4 rounded-lg border bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => updateParams({ new: 'true' })}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {expenses.length} of {totalCount} expenses
          </p>
        </div>

        {/* Expenses Table */}
        <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : expenses.length > 0 ? (
                  expenses.map((expense) => {
                    const allocationStyle = ALLOCATION_STYLES[expense.allocation_type || 'direct'] || ALLOCATION_STYLES.direct
                    const statusStyle = STATUS_STYLES[expense.status || 'pending'] || STATUS_STYLES.pending

                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                          {expense.expense_date
                            ? format(new Date(expense.expense_date), 'MMM d, yyyy')
                            : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {expense.description || 'No description'}
                          </p>
                          {expense.vendor && (
                            <p className="text-sm text-gray-500">{expense.vendor}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {CATEGORY_LABELS[expense.category || 'other'] || expense.category}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          ${expense.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${allocationStyle.bg} ${allocationStyle.text}`}
                          >
                            {allocationStyle.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded capitalize ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {expense.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {expense.receipt_url ? (
                            <a
                              href={expense.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {expense.creator?.full_name || '-'}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No expenses found</p>
                      <p className="text-sm text-gray-400">
                        Try adjusting your filters or add a new expense
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateParams({ page: String(page - 1) })}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={() => updateParams({ page: String(page + 1) })}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showNewModal && (
        <ExpenseForm
          onClose={closeModal}
          onSuccess={() => {
            closeModal()
            router.refresh()
          }}
        />
      )}
    </>
  )
}
