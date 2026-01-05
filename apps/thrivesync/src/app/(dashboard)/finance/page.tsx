import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { BudgetChart } from '@/components/finance/budget-chart'
import { DollarSign, TrendingUp, PieChart, Wallet, Plus, Filter, Calendar, Download } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Expense, BudgetItem } from '@repo/database'

// Type for expense with approver info
type ExpenseWithApprover = Expense & {
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

export default async function FinanceDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    start?: string
    end?: string
    category?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Calculate date range (default to current month)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const startDate = params.start || startOfMonth.toISOString().split('T')[0]
  const endDate = params.end || endOfMonth.toISOString().split('T')[0]

  // Fetch expenses with optional filters
  let expenseQuery = supabase
    .from('expenses')
    .select(`
      *,
      approver:approved_by(full_name)
    `)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
    .order('expense_date', { ascending: false })
    .limit(10)

  if (params.category && params.category !== 'all') {
    expenseQuery = expenseQuery.eq('category', params.category)
  }

  const { data: expensesData, error: expenseError } = await expenseQuery

  const expenses = (expensesData as unknown as ExpenseWithApprover[]) || []

  // Fetch all expenses for the period (for totals)
  const { data: allExpenses } = await supabase
    .from('expenses')
    .select('amount, allocation_type, category')
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)

  const allExpensesList = (allExpenses as unknown as Pick<Expense, 'amount' | 'allocation_type' | 'category'>[]) || []

  // Calculate totals
  const totalExpenses = allExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0)
  const directExpenses = allExpensesList
    .filter(e => e.allocation_type === 'direct')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const nonDirectExpenses = allExpensesList
    .filter(e => e.allocation_type === 'non_direct' || e.allocation_type === 'shared' || e.allocation_type === 'admin')
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  const directPercentage = totalExpenses > 0 ? Math.round((directExpenses / totalExpenses) * 100) : 0
  const nonDirectPercentage = totalExpenses > 0 ? Math.round((nonDirectExpenses / totalExpenses) * 100) : 0

  // Fetch budget items for current fiscal year
  const currentFiscalYear = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear()

  const { data: budgetData } = await supabase
    .from('budget_items')
    .select('*')
    .eq('fiscal_year', currentFiscalYear)

  const budgetItems = (budgetData as unknown as BudgetItem[]) || []

  // Calculate budget vs actual by category
  const categorySpend = allExpensesList.reduce((acc, expense) => {
    const cat = expense.category || 'other'
    acc[cat] = (acc[cat] || 0) + (expense.amount || 0)
    return acc
  }, {} as Record<string, number>)

  const budgetComparison = budgetItems.map(item => ({
    category: item.category,
    budgeted: item.budgeted_amount,
    actual: categorySpend[item.category] || 0,
  }))

  // Calculate total budget
  const totalBudget = budgetItems.reduce((sum, b) => sum + b.budgeted_amount, 0)
  const budgetRemaining = totalBudget - totalExpenses

  return (
    <>
      <Header
        title="Finance Dashboard"
        subtitle="Cost allocation, expenses, and budget tracking"
      />

      <div className="p-6 space-y-6">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between">
          <form className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                name="start"
                defaultValue={startDate}
                className="h-9 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                name="end"
                defaultValue={endDate}
                className="h-9 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <select
              name="category"
              defaultValue={params.category || 'all'}
              className="h-9 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-gray-100 text-sm font-medium hover:bg-gray-200"
            >
              <Filter className="h-4 w-4" />
              Apply
            </button>
          </form>
          <div className="flex items-center gap-3">
            <Link
              href="/finance/expenses"
              className="flex items-center gap-2 h-10 px-4 rounded-lg border bg-white text-sm font-medium hover:bg-gray-50"
            >
              View All Expenses
            </Link>
            <Link
              href="/finance/expenses?new=true"
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget Remaining</p>
                <p className={`text-2xl font-bold ${budgetRemaining < 0 ? 'text-red-600' : ''}`}>
                  ${budgetRemaining.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Direct Costs</p>
                <p className="text-2xl font-bold">{directPercentage}%</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <PieChart className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Non-Direct Costs</p>
                <p className="text-2xl font-bold">{nonDirectPercentage}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Expenses Table */}
          <div className="lg:col-span-2 rounded-xl bg-white shadow-sm border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Recent Expenses</h3>
              <Link
                href="/finance/expenses"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View All
              </Link>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
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
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((expense) => {
                  const allocationStyle = ALLOCATION_STYLES[expense.allocation_type || 'direct'] || ALLOCATION_STYLES.direct
                  const statusStyle = STATUS_STYLES[expense.status || 'pending'] || STATUS_STYLES.pending

                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{expense.description || 'No description'}</p>
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
                        <span className={`px-2 py-1 text-xs font-medium rounded ${allocationStyle.bg} ${allocationStyle.text}`}>
                          {allocationStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${statusStyle.bg} ${statusStyle.text}`}>
                          {expense.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {expense.expense_date ? formatDate(expense.expense_date) : '-'}
                      </td>
                    </tr>
                  )
                })}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No expenses found for this period</p>
                      <p className="text-sm text-gray-400">
                        Try adjusting the date range or add a new expense
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Budget vs Actual Chart */}
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Budget vs Actual</h3>
              <span className="text-sm text-gray-500">FY {currentFiscalYear}</span>
            </div>
            {budgetComparison.length > 0 ? (
              <BudgetChart data={budgetComparison} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PieChart className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No budget items configured</p>
                <p className="text-sm text-gray-400">
                  Add budget items to see comparison
                </p>
              </div>
            )}

            {/* Cost Allocation Summary */}
            <div className="mt-6 pt-4 border-t space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Cost Allocation</h4>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Direct Costs</span>
                  <span className="font-medium">${directExpenses.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${directPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Non-Direct Costs</span>
                  <span className="font-medium">${nonDirectExpenses.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${nonDirectPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
