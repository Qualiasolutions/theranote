import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get query params
  const searchParams = request.nextUrl.searchParams
  const studentId = searchParams.get('studentId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!studentId) {
    return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
  }

  // Get student info
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single() as {
      data: {
        first_name: string
        last_name: string
        date_of_birth: string | null
        grade: string | null
        iep_start_date: string | null
        iep_end_date: string | null
        service_type: string | null
      } | null
      error: Error | null
    }

  if (studentError || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Get therapist info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, discipline, license_number')
    .eq('id', user.id)
    .single() as { data: { full_name: string; discipline: string; license_number: string | null } | null }

  // Get goals for student
  const { data: goals } = await supabase
    .from('goals')
    .select('id, description, domain, status, baseline_value, target_criteria')
    .eq('student_id', studentId)
    .order('domain') as {
      data: Array<{
        id: string
        description: string
        domain: string | null
        status: string
        baseline_value: string | null
        target_criteria: string | null
      }> | null
    }

  // Get sessions with goal progress
  let sessionsQuery = supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      duration_minutes,
      attendance_status,
      subjective,
      objective,
      assessment,
      plan,
      status
    `)
    .eq('student_id', studentId)
    .eq('therapist_id', user.id)
    .order('session_date', { ascending: true })

  if (startDate) {
    sessionsQuery = sessionsQuery.gte('session_date', startDate)
  }
  if (endDate) {
    sessionsQuery = sessionsQuery.lte('session_date', endDate)
  }

  const { data: sessions } = await sessionsQuery as {
    data: Array<{
      id: string
      session_date: string
      duration_minutes: number
      attendance_status: string
      subjective: string | null
      objective: string | null
      assessment: string | null
      plan: string | null
      status: string
    }> | null
  }

  // Get goal progress data
  const sessionIds = (sessions || []).map(s => s.id)
  const { data: progressData } = sessionIds.length > 0
    ? await supabase
        .from('session_goals')
        .select('session_id, goal_id, progress_value, progress_unit, notes')
        .in('session_id', sessionIds)
    : { data: [] }

  // Calculate progress statistics for each goal
  interface GoalStats {
    goal_id: string
    description: string
    domain: string
    status: string
    baseline: string
    target: string
    data_points: number
    avg_progress: number
    latest_progress: number
    trend: string
  }

  const goalStats: GoalStats[] = (goals || []).map(goal => {
    const goalProgress = (progressData || [])
      .filter((p: { goal_id: string }) => p.goal_id === goal.id)
      .map((p: { progress_value: number | null }) => p.progress_value)
      .filter((v: number | null): v is number => v !== null)

    const avgProgress = goalProgress.length > 0
      ? goalProgress.reduce((a: number, b: number) => a + b, 0) / goalProgress.length
      : 0

    const latestProgress = goalProgress.length > 0 ? goalProgress[goalProgress.length - 1] : 0

    // Calculate trend
    let trend = 'No data'
    if (goalProgress.length >= 2) {
      const firstHalf = goalProgress.slice(0, Math.floor(goalProgress.length / 2))
      const secondHalf = goalProgress.slice(Math.floor(goalProgress.length / 2))
      const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length

      if (secondAvg > firstAvg + 5) trend = 'Improving'
      else if (secondAvg < firstAvg - 5) trend = 'Declining'
      else trend = 'Stable'
    }

    return {
      goal_id: goal.id,
      description: goal.description,
      domain: goal.domain || 'General',
      status: goal.status,
      baseline: goal.baseline_value || 'N/A',
      target: goal.target_criteria || 'N/A',
      data_points: goalProgress.length,
      avg_progress: Math.round(avgProgress),
      latest_progress: latestProgress,
      trend,
    }
  })

  // Build CSV report
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const dateRange = startDate && endDate
    ? `${startDate} to ${endDate}`
    : 'All Sessions'

  const csvLines: string[] = []

  // Header section
  csvLines.push('PROGRESS REPORT')
  csvLines.push(`Generated: ${reportDate}`)
  csvLines.push('')
  csvLines.push('STUDENT INFORMATION')
  csvLines.push(`Name,${student.last_name}${student.first_name ? ', ' + student.first_name : ''}`)
  csvLines.push(`Date of Birth,${student.date_of_birth || 'N/A'}`)
  csvLines.push(`Grade,${student.grade || 'N/A'}`)
  csvLines.push(`Service Type,${student.service_type || 'N/A'}`)
  csvLines.push(`IEP Period,${student.iep_start_date || 'N/A'} to ${student.iep_end_date || 'N/A'}`)
  csvLines.push('')
  csvLines.push('PROVIDER INFORMATION')
  csvLines.push(`Provider,${profile?.full_name || 'N/A'}`)
  csvLines.push(`Discipline,${profile?.discipline?.toUpperCase() || 'N/A'}`)
  csvLines.push(`License #,${profile?.license_number || 'N/A'}`)
  csvLines.push('')
  csvLines.push('REPORT PERIOD')
  csvLines.push(`Date Range,${dateRange}`)
  csvLines.push(`Total Sessions,${(sessions || []).length}`)
  csvLines.push(`Total Service Time,${(sessions || []).reduce((acc, s) => acc + (s.duration_minutes || 0), 0)} minutes`)
  csvLines.push('')

  // Goals section
  csvLines.push('GOAL PROGRESS SUMMARY')
  csvLines.push('Domain,Goal Description,Status,Baseline,Target,Data Points,Avg Progress,Latest,Trend')

  goalStats.forEach(g => {
    csvLines.push([
      `"${g.domain}"`,
      `"${g.description.replace(/"/g, '""')}"`,
      g.status,
      `"${g.baseline}"`,
      `"${g.target}"`,
      g.data_points.toString(),
      `${g.avg_progress}%`,
      `${g.latest_progress}%`,
      g.trend,
    ].join(','))
  })

  csvLines.push('')

  // Session details
  csvLines.push('SESSION DETAILS')
  csvLines.push('Date,Duration,Attendance,Status,Objective Notes')

  ;(sessions || []).forEach(s => {
    const objective = s.objective || ''
    const truncated = objective.length > 100 ? objective.substring(0, 100) + '...' : objective
    csvLines.push([
      s.session_date,
      `${s.duration_minutes} min`,
      s.attendance_status,
      s.status,
      `"${truncated.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ].join(','))
  })

  const csv = csvLines.join('\n')
  const filename = `progress-report-${student.last_name}-${student.first_name}-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
