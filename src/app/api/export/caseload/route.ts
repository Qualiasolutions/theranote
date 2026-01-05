import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get therapist profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, discipline, organization_id')
    .eq('id', user.id)
    .single() as { data: { full_name: string; discipline: string; organization_id: string } | null }

  // Get caseload assignments with student details
  const { data: caseloads, error } = await supabase
    .from('caseloads')
    .select(`
      id,
      status,
      weekly_frequency,
      session_duration,
      start_date,
      end_date,
      student:students(
        id,
        first_name,
        last_name,
        date_of_birth,
        grade,
        service_type,
        iep_start_date,
        iep_end_date
      )
    `)
    .eq('therapist_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string
        status: string
        weekly_frequency: number | null
        session_duration: number | null
        start_date: string | null
        end_date: string | null
        student: {
          id: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          grade: string | null
          service_type: string | null
          iep_start_date: string | null
          iep_end_date: string | null
        } | null
      }> | null
      error: Error | null
    }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get goal counts for each student
  const studentIds = (caseloads || []).map(c => c.student?.id).filter(Boolean)

  interface GoalCount {
    student_id: string
    total_goals: number
    active_goals: number
    met_goals: number
  }

  let goalCounts: GoalCount[] = []
  if (studentIds.length > 0) {
    const { data: goals } = await supabase
      .from('goals')
      .select('student_id, status')
      .in('student_id', studentIds as string[])

    // Count goals by student
    goalCounts = studentIds.map(studentId => {
      const studentGoals = (goals || []).filter(g => g.student_id === studentId)
      return {
        student_id: studentId as string,
        total_goals: studentGoals.length,
        active_goals: studentGoals.filter(g => g.status === 'in_progress' || g.status === 'baseline').length,
        met_goals: studentGoals.filter(g => g.status === 'met').length,
      }
    })
  }

  // Get session counts for the current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  interface SessionStat {
    student_id: string
    sessions_this_month: number
    total_minutes: number
    last_session: string | null
  }

  let sessionStats: SessionStat[] = []
  if (studentIds.length > 0) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('student_id, duration_minutes, session_date')
      .eq('therapist_id', user.id)
      .in('student_id', studentIds as string[])
      .gte('session_date', startOfMonth.toISOString())

    sessionStats = studentIds.map(studentId => {
      const studentSessions = (sessions || []).filter(s => s.student_id === studentId)
      const lastSession = studentSessions.length > 0
        ? studentSessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0]?.session_date
        : null
      return {
        student_id: studentId as string,
        sessions_this_month: studentSessions.length,
        total_minutes: studentSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0),
        last_session: lastSession,
      }
    })
  }

  // Build CSV
  const headers = [
    'Student Name',
    'Date of Birth',
    'Grade',
    'Service Type',
    'Weekly Frequency',
    'Session Duration (min)',
    'IEP Start',
    'IEP End',
    'Caseload Start',
    'Caseload End',
    'Active Goals',
    'Goals Met',
    'Sessions This Month',
    'Minutes This Month',
    'Last Session',
  ]

  const rows = (caseloads || []).map((c) => {
    const goalData = goalCounts.find(g => g.student_id === c.student?.id)
    const sessionData = sessionStats.find(s => s.student_id === c.student?.id)

    return [
      c.student ? `${c.student.last_name}, ${c.student.first_name}` : '',
      c.student?.date_of_birth || '',
      c.student?.grade || '',
      c.student?.service_type || '',
      c.weekly_frequency?.toString() || '',
      c.session_duration?.toString() || '',
      c.student?.iep_start_date || '',
      c.student?.iep_end_date || '',
      c.start_date || '',
      c.end_date || '',
      goalData?.active_goals?.toString() || '0',
      goalData?.met_goals?.toString() || '0',
      sessionData?.sessions_this_month?.toString() || '0',
      sessionData?.total_minutes?.toString() || '0',
      sessionData?.last_session || '',
    ]
  })

  // Add summary
  const totalStudents = (caseloads || []).length
  const totalActiveGoals = goalCounts.reduce((acc, g) => acc + g.active_goals, 0)
  const totalSessionsMonth = sessionStats.reduce((acc, s) => acc + s.sessions_this_month, 0)
  const totalMinutesMonth = sessionStats.reduce((acc, s) => acc + s.total_minutes, 0)

  rows.push([])
  rows.push(['CASELOAD SUMMARY', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push([`Provider: ${profile?.full_name || ''}`, '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push([`Discipline: ${profile?.discipline?.toUpperCase() || ''}`, '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push([`Total Students: ${totalStudents}`, '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push([`Total Active Goals: ${totalActiveGoals}`, '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push([`Sessions This Month: ${totalSessionsMonth}`, '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  rows.push([`Service Time This Month: ${totalMinutesMonth} min (${(totalMinutesMonth / 60).toFixed(1)} hrs)`, '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `caseload-summary-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
