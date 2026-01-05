import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { ExpensesContent } from './expenses-content'
import { Receipt, Loader2 } from 'lucide-react'

// Loading component for Suspense fallback
function ExpensesLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Filters skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
        </div>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  return (
    <>
      <Header
        title="Expenses"
        subtitle="Track and manage all expenses"
      />
      <Suspense fallback={<ExpensesLoading />}>
        <ExpensesContent />
      </Suspense>
    </>
  )
}
