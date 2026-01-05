import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  // Build query
  let query = supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      start_time,
      end_time,
      duration_minutes,
      attendance_status,
      discipline,
      status,
      student:students(first_name, last_name),
      therapist:profiles(full_name)
    `)
    .eq('therapist_id', user.id)
    .order('session_date', { ascending: false })

  if (startDate) {
    query = query.gte('session_date', startDate)
  }
  if (endDate) {
    query = query.lte('session_date', endDate)
  }

  const { data: sessions, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Convert to CSV
  const headers = [
    'Date',
    'Student',
    'Therapist',
    'Start Time',
    'End Time',
    'Duration (min)',
    'Attendance',
    'Discipline',
    'Doc Status',
  ]

  const rows = (sessions || []).map((s: {
    session_date: string
    start_time: string
    end_time: string
    duration_minutes: number
    attendance_status: string
    discipline: string
    status: string
    student: { first_name: string; last_name: string } | null
    therapist: { full_name: string } | null
  }) => [
    s.session_date,
    s.student ? `${s.student.first_name} ${s.student.last_name}` : '',
    s.therapist?.full_name || '',
    s.start_time,
    s.end_time,
    s.duration_minutes?.toString() || '',
    s.attendance_status,
    s.discipline,
    s.status,
  ])

  const csv = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `attendance-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
