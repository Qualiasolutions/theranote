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

  // Default to current month if no dates provided
  const defaultStart = new Date()
  defaultStart.setDate(1)
  defaultStart.setHours(0, 0, 0, 0)

  const defaultEnd = new Date()

  const start = startDate || defaultStart.toISOString().split('T')[0]
  const end = endDate || defaultEnd.toISOString().split('T')[0]

  // Get sessions with student info
  const { data: sessions, error } = await supabase
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
      student:students(first_name, last_name, date_of_birth, service_type)
    `)
    .eq('therapist_id', user.id)
    .gte('session_date', start)
    .lte('session_date', end)
    .order('session_date', { ascending: true }) as {
      data: Array<{
        id: string
        session_date: string
        start_time: string
        end_time: string
        duration_minutes: number
        attendance_status: string
        discipline: string
        status: string
        student: { first_name: string; last_name: string; date_of_birth: string; service_type: string } | null
      }> | null
      error: Error | null
    }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get therapist name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, license_number')
    .eq('id', user.id)
    .single() as { data: { full_name: string; license_number: string | null } | null }

  // NYC DOE Service Log Format
  const headers = [
    'Date of Service',
    'Student Name',
    'Student DOB',
    'Service Type',
    'Start Time',
    'End Time',
    'Duration (min)',
    'Attendance',
    'Provider Name',
    'Provider License #',
    'Discipline',
    'Signed',
  ]

  const rows = (sessions || []).map((s) => [
    s.session_date,
    s.student ? `${s.student.last_name}, ${s.student.first_name}` : '',
    s.student?.date_of_birth || '',
    s.student?.service_type || '',
    s.start_time,
    s.end_time,
    s.duration_minutes?.toString() || '',
    s.attendance_status,
    profile?.full_name || '',
    profile?.license_number || '',
    s.discipline.toUpperCase(),
    s.status === 'signed' ? 'Yes' : 'No',
  ])

  // Add summary row
  const totalMinutes = (sessions || []).reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const totalSessions = (sessions || []).length
  const signedSessions = (sessions || []).filter(s => s.status === 'signed').length

  rows.push([]) // Empty row
  rows.push(['SUMMARY', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Total Sessions:', totalSessions.toString(), '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Signed Sessions:', signedSessions.toString(), '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Total Service Time:', `${totalMinutes} minutes (${(totalMinutes / 60).toFixed(1)} hours)`, '', '', '', '', '', '', '', '', '', ''])

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `service-log-${start}-to-${end}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
