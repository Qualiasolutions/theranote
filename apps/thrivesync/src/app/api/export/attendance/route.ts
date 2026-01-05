import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AttendanceWithProfile {
  id: string
  attendance_date: string
  clock_in: string | null
  clock_out: string | null
  status: string | null
  notes: string | null
  profile: { full_name: string; email: string } | null
  site: { name: string } | null
}

function calculateHoursWorked(clockIn: string | null, clockOut: string | null): string {
  if (!clockIn || !clockOut) return ''

  const start = new Date(`1970-01-01T${clockIn}`)
  const end = new Date(`1970-01-01T${clockOut}`)
  const diffMs = end.getTime() - start.getTime()
  const hours = diffMs / (1000 * 60 * 60)

  return hours.toFixed(2)
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

  // Get attendance records for the organization
  const { data: attendance, error } = await supabase
    .from('staff_attendance')
    .select(`
      id,
      attendance_date,
      clock_in,
      clock_out,
      status,
      notes,
      profile:profiles(full_name, email),
      site:sites(name)
    `)
    .eq('org_id', profile.organization_id)
    .gte('attendance_date', start)
    .lte('attendance_date', end)
    .order('attendance_date', { ascending: false }) as { data: AttendanceWithProfile[] | null; error: Error | null }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // CSV headers
  const headers = [
    'Date',
    'Staff Name',
    'Staff Email',
    'Site',
    'Clock In',
    'Clock Out',
    'Hours Worked',
    'Status',
    'Notes',
  ]

  // Build rows
  const rows = (attendance || []).map((a: AttendanceWithProfile) => [
    a.attendance_date,
    a.profile?.full_name || '',
    a.profile?.email || '',
    a.site?.name || '',
    a.clock_in || '',
    a.clock_out || '',
    calculateHoursWorked(a.clock_in, a.clock_out),
    a.status || '',
    a.notes || '',
  ])

  // Calculate summary stats
  const totalHours = (attendance || []).reduce((acc: number, a: AttendanceWithProfile) => {
    const hours = parseFloat(calculateHoursWorked(a.clock_in, a.clock_out)) || 0
    return acc + hours
  }, 0)

  const statusCounts = (attendance || []).reduce((acc: Record<string, number>, a: AttendanceWithProfile) => {
    const status = a.status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  rows.push([]) // Empty row
  rows.push(['SUMMARY', '', '', '', '', '', '', '', ''])
  rows.push(['Date Range:', `${start} to ${end}`, '', '', '', '', '', '', ''])
  rows.push(['Total Records:', (attendance || []).length.toString(), '', '', '', '', '', '', ''])
  rows.push(['Total Hours:', totalHours.toFixed(2), '', '', '', '', '', '', ''])
  Object.entries(statusCounts).forEach(([status, count]) => {
    rows.push([`${status}:`, count.toString(), '', '', '', '', '', '', ''])
  })

  // Convert to CSV
  const csv = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `staff-attendance-${start}-to-${end}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
