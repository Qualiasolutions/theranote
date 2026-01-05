import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// NYC DOE Service Type Codes
const DOE_SERVICE_CODES: Record<string, string> = {
  speech: '01', // Speech-Language Therapy
  ot: '02', // Occupational Therapy
  pt: '03', // Physical Therapy
  counseling: '04', // Counseling
  aba: '05', // Applied Behavior Analysis
  seit: '06', // Special Education Itinerant Teacher
  scis: '07', // Special Class Integrated Setting
}

// Attendance codes for DOE format
const DOE_ATTENDANCE_CODES: Record<string, string> = {
  present: 'P',
  absent: 'A',
  makeup: 'M',
  cancelled: 'C',
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

  // Default to current month if no dates provided
  const defaultStart = new Date()
  defaultStart.setDate(1)
  defaultStart.setHours(0, 0, 0, 0)

  const defaultEnd = new Date()

  const start = startDate || defaultStart.toISOString().split('T')[0]
  const end = endDate || defaultEnd.toISOString().split('T')[0]

  // Get sessions with student and related info
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
      signed_at,
      student:students(
        id,
        first_name,
        last_name,
        date_of_birth,
        service_type,
        grade_level,
        osis_number
      )
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
        signed_at: string | null
        student: {
          id: string
          first_name: string
          last_name: string
          date_of_birth: string
          service_type: string
          grade_level: string | null
          osis_number: string | null
        } | null
      }> | null
      error: Error | null
    }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get therapist info including NPI
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, license_number, discipline')
    .eq('id', user.id)
    .single() as { data: { full_name: string; license_number: string | null; discipline: string | null } | null }

  // NYC DOE Service Log Headers
  const headers = [
    'OSIS Number',
    'Student Last Name',
    'Student First Name',
    'DOB',
    'Grade',
    'Service Date',
    'Service Type Code',
    'Service Type',
    'Start Time',
    'End Time',
    'Duration (Min)',
    'Units (15 min)',
    'Attendance Code',
    'Attendance Status',
    'Provider Name',
    'Provider License',
    'Provider NPI',
    'Discipline',
    'Session Type',
    'Signature Status',
    'Signature Date',
    'Location',
  ]

  // Calculate units (15-minute increments, rounded up)
  const calculateUnits = (minutes: number): number => {
    return Math.ceil(minutes / 15)
  }

  const rows = (sessions || []).map((s) => {
    const units = calculateUnits(s.duration_minutes || 0)
    const signatureDate = s.signed_at ? new Date(s.signed_at).toISOString().split('T')[0] : ''

    return [
      s.student?.osis_number || '',
      s.student?.last_name || '',
      s.student?.first_name || '',
      s.student?.date_of_birth || '',
      s.student?.grade_level || 'PK',
      s.session_date,
      DOE_SERVICE_CODES[s.discipline.toLowerCase()] || '99',
      s.discipline.toUpperCase(),
      s.start_time,
      s.end_time,
      s.duration_minutes?.toString() || '',
      units.toString(),
      DOE_ATTENDANCE_CODES[s.attendance_status] || 'P',
      s.attendance_status.charAt(0).toUpperCase() + s.attendance_status.slice(1),
      profile?.full_name || '',
      profile?.license_number || '',
      '', // NPI - would need to add to profiles
      profile?.discipline?.toUpperCase() || s.discipline.toUpperCase(),
      'Individual', // Default session type
      s.status === 'signed' ? 'Signed' : 'Draft',
      signatureDate,
      'School Site', // Default location
    ]
  })

  // Summary Section
  const totalMinutes = (sessions || []).reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  const totalUnits = calculateUnits(totalMinutes)
  const totalSessions = (sessions || []).length
  const signedSessions = (sessions || []).filter(s => s.status === 'signed').length
  const presentSessions = (sessions || []).filter(s => s.attendance_status === 'present').length
  const absentSessions = (sessions || []).filter(s => s.attendance_status === 'absent').length
  const makeupSessions = (sessions || []).filter(s => s.attendance_status === 'makeup').length

  rows.push([]) // Empty row
  rows.push(['NYC DOE SERVICE LOG SUMMARY', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Report Period:', `${start} to ${end}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Provider:', profile?.full_name || '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Total Sessions:', totalSessions.toString(), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Present Sessions:', presentSessions.toString(), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Absent Sessions:', absentSessions.toString(), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Makeup Sessions:', makeupSessions.toString(), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Signed Sessions:', signedSessions.toString(), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Unsigned Sessions:', (totalSessions - signedSessions).toString(), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Total Minutes:', totalMinutes.toString(), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Total Units (15-min):', totalUnits.toString(), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Total Hours:', (totalMinutes / 60).toFixed(2), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `doe-service-log-${start}-to-${end}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
