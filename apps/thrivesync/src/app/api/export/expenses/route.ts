import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ExpenseWithRelations {
  id: string
  expense_date: string | null
  amount: number
  category: string | null
  allocation_type: string | null
  description: string | null
  vendor: string | null
  payment_method: string | null
  cost_center: string | null
  status: string | null
  receipt_url: string | null
  created_by_profile: { full_name: string } | null
  approved_by_profile: { full_name: string } | null
  site: { name: string } | null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get query params for date range
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  // Default to current month if no dates provided
  const defaultStart = new Date()
  defaultStart.setDate(1)
  defaultStart.setHours(0, 0, 0, 0)

  const defaultEnd = new Date()

  const start = startDate || defaultStart.toISOString().split('T')[0]
  const end = endDate || defaultEnd.toISOString().split('T')[0]

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single() as { data: { organization_id: string | null } | null }

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Get expenses for the organization
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select(`
      id,
      expense_date,
      amount,
      category,
      allocation_type,
      description,
      vendor,
      payment_method,
      cost_center,
      status,
      receipt_url,
      created_by_profile:profiles!expenses_created_by_fkey(full_name),
      approved_by_profile:profiles!expenses_approved_by_fkey(full_name),
      site:sites(name)
    `)
    .eq('org_id', profile.organization_id)
    .gte('expense_date', start)
    .lte('expense_date', end)
    .order('expense_date', { ascending: false }) as { data: ExpenseWithRelations[] | null; error: Error | null }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // CSV headers
  const headers = [
    'Date',
    'Description',
    'Category',
    'Allocation Type',
    'Amount',
    'Vendor',
    'Payment Method',
    'Cost Center',
    'Site',
    'Status',
    'Created By',
    'Approved By',
    'Has Receipt',
  ]

  // Build rows
  const rows = (expenses || []).map((e: ExpenseWithRelations) => [
    e.expense_date || '',
    e.description || '',
    e.category || '',
    e.allocation_type || '',
    e.amount.toFixed(2),
    e.vendor || '',
    e.payment_method || '',
    e.cost_center || '',
    e.site?.name || '',
    e.status || '',
    e.created_by_profile?.full_name || '',
    e.approved_by_profile?.full_name || '',
    e.receipt_url ? 'Yes' : 'No',
  ])

  // Calculate summary stats
  const totalAmount = (expenses || []).reduce((acc: number, e: ExpenseWithRelations) => acc + e.amount, 0)

  const categoryTotals = (expenses || []).reduce((acc: Record<string, number>, e: ExpenseWithRelations) => {
    const cat = e.category || 'Uncategorized'
    acc[cat] = (acc[cat] || 0) + e.amount
    return acc
  }, {})

  const allocationTotals = (expenses || []).reduce((acc: Record<string, number>, e: ExpenseWithRelations) => {
    const alloc = e.allocation_type || 'Unallocated'
    acc[alloc] = (acc[alloc] || 0) + e.amount
    return acc
  }, {})

  const statusCounts = (expenses || []).reduce((acc: Record<string, number>, e: ExpenseWithRelations) => {
    const status = e.status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  rows.push([]) // Empty row
  rows.push(['SUMMARY', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Date Range:', `${start} to ${end}`, '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Total Expenses:', (expenses || []).length.toString(), '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Total Amount:', `$${totalAmount.toFixed(2)}`, '', '', '', '', '', '', '', '', '', '', ''])

  rows.push([]) // Empty row
  rows.push(['BY CATEGORY', '', '', '', '', '', '', '', '', '', '', '', ''])
  Object.entries(categoryTotals).forEach(([cat, amount]) => {
    rows.push([cat, `$${amount.toFixed(2)}`, '', '', '', '', '', '', '', '', '', '', ''])
  })

  rows.push([]) // Empty row
  rows.push(['BY ALLOCATION TYPE', '', '', '', '', '', '', '', '', '', '', '', ''])
  Object.entries(allocationTotals).forEach(([alloc, amount]) => {
    rows.push([alloc, `$${amount.toFixed(2)}`, '', '', '', '', '', '', '', '', '', '', ''])
  })

  rows.push([]) // Empty row
  rows.push(['BY STATUS', '', '', '', '', '', '', '', '', '', '', '', ''])
  Object.entries(statusCounts).forEach(([status, count]) => {
    rows.push([status, count.toString(), '', '', '', '', '', '', '', '', '', '', ''])
  })

  // Convert to CSV
  const csv = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `expenses-${start}-to-${end}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
