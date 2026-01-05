import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  allocation_type: string
  cost_center: string | null
  expense_date: string
  status: string
  vendor: string | null
}

interface SalaryAllocation {
  id: string
  profile_id: string
  direct_percentage: number
  non_direct_percentage: number
  admin_percentage: number
  period_start: string
  period_end: string | null
  profile: { full_name: string; role: string } | null
}

const allocationTypeLabels: Record<string, string> = {
  direct: 'Direct Service',
  non_direct: 'Non-Direct/Indirect',
  shared: 'Shared/Allocated',
  admin: 'Administrative',
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get query params for date range
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // Default to current fiscal year (July 1 - June 30)
  const today = new Date()
  const fiscalYearStart = today.getMonth() >= 6
    ? new Date(today.getFullYear(), 6, 1)
    : new Date(today.getFullYear() - 1, 6, 1)

  const start = startDate || fiscalYearStart.toISOString().split('T')[0]
  const end = endDate || today.toISOString().split('T')[0]

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single() as { data: { organization_id: string | null } | null }

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Fetch expenses in date range
  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select('*')
    .eq('org_id', profile.organization_id)
    .gte('expense_date', start)
    .lte('expense_date', end)
    .order('expense_date', { ascending: true })

  const expenses = (expensesRaw || []) as Expense[]

  // Fetch salary allocations
  const { data: salaryAllocationsRaw } = await supabase
    .from('salary_allocations')
    .select(`
      *,
      profile:profiles(full_name, role)
    `)
    .order('period_start', { ascending: false })

  const salaryAllocations = (salaryAllocationsRaw || []) as SalaryAllocation[]

  // Calculate totals by allocation type
  const allocationTotals: Record<string, number> = {
    direct: 0,
    non_direct: 0,
    shared: 0,
    admin: 0,
  }

  const categoryTotals: Record<string, Record<string, number>> = {}

  expenses.forEach((expense) => {
    const allocType = expense.allocation_type || 'shared'
    allocationTotals[allocType] = (allocationTotals[allocType] || 0) + expense.amount

    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = { direct: 0, non_direct: 0, shared: 0, admin: 0 }
    }
    categoryTotals[expense.category][allocType] = (categoryTotals[expense.category][allocType] || 0) + expense.amount
  })

  const totalExpenses = Object.values(allocationTotals).reduce((sum, val) => sum + val, 0)

  // Build CSV
  const headers = [
    'Category',
    'Direct Service',
    'Non-Direct',
    'Shared',
    'Administrative',
    'Total',
    'Direct %',
    'Non-Direct %',
  ]

  const rows: string[][] = []

  // Category breakdown
  Object.entries(categoryTotals).forEach(([category, allocations]) => {
    const categoryTotal = Object.values(allocations).reduce((sum, val) => sum + val, 0)
    const directPct = categoryTotal > 0 ? ((allocations.direct / categoryTotal) * 100).toFixed(1) : '0.0'
    const nonDirectPct = categoryTotal > 0 ? (((allocations.non_direct + allocations.admin) / categoryTotal) * 100).toFixed(1) : '0.0'

    rows.push([
      category,
      `$${allocations.direct.toFixed(2)}`,
      `$${allocations.non_direct.toFixed(2)}`,
      `$${allocations.shared.toFixed(2)}`,
      `$${allocations.admin.toFixed(2)}`,
      `$${categoryTotal.toFixed(2)}`,
      `${directPct}%`,
      `${nonDirectPct}%`,
    ])
  })

  // Totals row
  rows.push([])
  rows.push([
    'TOTALS',
    `$${allocationTotals.direct.toFixed(2)}`,
    `$${allocationTotals.non_direct.toFixed(2)}`,
    `$${allocationTotals.shared.toFixed(2)}`,
    `$${allocationTotals.admin.toFixed(2)}`,
    `$${totalExpenses.toFixed(2)}`,
    totalExpenses > 0 ? `${((allocationTotals.direct / totalExpenses) * 100).toFixed(1)}%` : '0.0%',
    totalExpenses > 0 ? `${(((allocationTotals.non_direct + allocationTotals.admin) / totalExpenses) * 100).toFixed(1)}%` : '0.0%',
  ])

  // Add summary section
  rows.push([])
  rows.push(['COST ALLOCATION REPORT', '', '', '', '', '', '', ''])
  rows.push(['Report Period:', `${start} to ${end}`, '', '', '', '', '', ''])
  rows.push(['Generated:', new Date().toISOString().split('T')[0], '', '', '', '', '', ''])
  rows.push([])
  rows.push(['ALLOCATION SUMMARY', '', '', '', '', '', '', ''])
  rows.push(['Direct Service Costs:', `$${allocationTotals.direct.toFixed(2)}`, totalExpenses > 0 ? `${((allocationTotals.direct / totalExpenses) * 100).toFixed(1)}%` : '0%', '', '', '', '', ''])
  rows.push(['Non-Direct Costs:', `$${allocationTotals.non_direct.toFixed(2)}`, totalExpenses > 0 ? `${((allocationTotals.non_direct / totalExpenses) * 100).toFixed(1)}%` : '0%', '', '', '', '', ''])
  rows.push(['Shared/Allocated:', `$${allocationTotals.shared.toFixed(2)}`, totalExpenses > 0 ? `${((allocationTotals.shared / totalExpenses) * 100).toFixed(1)}%` : '0%', '', '', '', '', ''])
  rows.push(['Administrative:', `$${allocationTotals.admin.toFixed(2)}`, totalExpenses > 0 ? `${((allocationTotals.admin / totalExpenses) * 100).toFixed(1)}%` : '0%', '', '', '', '', ''])
  rows.push(['Total Expenses:', `$${totalExpenses.toFixed(2)}`, '100%', '', '', '', '', ''])

  // Salary allocations section
  if (salaryAllocations.length > 0) {
    rows.push([])
    rows.push(['STAFF SALARY ALLOCATIONS', '', '', '', '', '', '', ''])
    rows.push(['Staff Name', 'Role', 'Direct %', 'Non-Direct %', 'Admin %', 'Period Start', 'Period End', ''])

    salaryAllocations.forEach((sa) => {
      rows.push([
        sa.profile?.full_name || '',
        sa.profile?.role || '',
        `${sa.direct_percentage}%`,
        `${sa.non_direct_percentage}%`,
        `${sa.admin_percentage}%`,
        sa.period_start,
        sa.period_end || 'Current',
        '',
      ])
    })
  }

  // CFR compliance note
  rows.push([])
  rows.push(['Note: This report is formatted for NYS CFR (Consolidated Fiscal Report) requirements.', '', '', '', '', '', '', ''])
  rows.push(['Direct Service costs include therapy services, SEIT, and related service delivery.', '', '', '', '', '', '', ''])
  rows.push(['Non-Direct costs include supervision, training, and program support.', '', '', '', '', '', '', ''])

  // Convert to CSV
  const csv = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `cost-allocation-${start}-to-${end}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
