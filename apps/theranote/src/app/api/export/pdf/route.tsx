import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import React from 'react'

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2px solid #3B82F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    backgroundColor: '#eff6ff',
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    flex: 1,
    color: '#4b5563',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 15,
  },
  infoColumn: {
    flex: 1,
  },
  goalCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    borderLeft: '4px solid #3B82F6',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalDomain: {
    fontSize: 10,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#4b5563',
  },
  goalStatus: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusMet: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusInProgress: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  statusOther: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  goalDescription: {
    fontSize: 11,
    marginBottom: 8,
    color: '#1f2937',
  },
  goalStats: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  trendImproving: {
    color: '#16a34a',
  },
  trendDeclining: {
    color: '#dc2626',
  },
  trendStable: {
    color: '#6b7280',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  tableCellSmall: {
    width: 60,
    fontSize: 10,
  },
  tableCellMedium: {
    width: 80,
    fontSize: 10,
  },
  attendancePresent: {
    color: '#16a34a',
  },
  attendanceAbsent: {
    color: '#dc2626',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  signature: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureLine: {
    width: 200,
    borderBottom: '1px solid #1f2937',
    marginBottom: 5,
    height: 30,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 9,
    color: '#9ca3af',
  },
})

interface Student {
  first_name: string
  last_name: string
  date_of_birth: string | null
  grade: string | null
  iep_start_date: string | null
  iep_end_date: string | null
  discipline: string | null
}

interface Profile {
  full_name: string
  discipline: string | null
  license_number: string | null
}

interface GoalStat {
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

interface Session {
  id: string
  session_date: string
  duration_minutes: number
  attendance_status: string
  objective: string | null
  assessment: string | null
}

interface ProgressReportData {
  student: Student
  provider: Profile | null
  dateRange: { start: string; end: string }
  totalSessions: number
  totalMinutes: number
  attendanceRate: number
  goalStats: GoalStat[]
  sessions: Session[]
}

// PDF Document Component
function ProgressReportPDF({ data }: { data: ProgressReportData }) {
  const reportDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const calculateAge = (dob: string | null) => {
    if (!dob) return 'N/A'
    const birthDate = new Date(dob)
    const today = new Date()
    const years = today.getFullYear() - birthDate.getFullYear()
    const months = today.getMonth() - birthDate.getMonth()
    const totalMonths = years * 12 + months
    return `${Math.floor(totalMonths / 12)}y ${Math.abs(totalMonths % 12)}m`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusStyle = (status: string) => {
    if (status === 'met') return styles.statusMet
    if (status === 'in_progress') return styles.statusInProgress
    return styles.statusOther
  }

  const getTrendStyle = (trend: string) => {
    if (trend === 'Improving') return styles.trendImproving
    if (trend === 'Declining') return styles.trendDeclining
    return styles.trendStable
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress Report</Text>
          <Text style={styles.subtitle}>
            {formatDate(data.dateRange.start)} - {formatDate(data.dateRange.end)}
          </Text>
        </View>

        {/* Student & Provider Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Student Information</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>
                  {data.student.first_name} {data.student.last_name}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date of Birth:</Text>
                <Text style={styles.value}>{formatDate(data.student.date_of_birth)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Age:</Text>
                <Text style={styles.value}>{calculateAge(data.student.date_of_birth)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Service:</Text>
                <Text style={styles.value}>
                  {data.student.discipline?.toUpperCase() || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Provider Information</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Therapist:</Text>
                <Text style={styles.value}>{data.provider?.full_name || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Discipline:</Text>
                <Text style={styles.value}>
                  {data.provider?.discipline?.toUpperCase() || 'N/A'}
                </Text>
              </View>
              {data.provider?.license_number && (
                <View style={styles.row}>
                  <Text style={styles.label}>License:</Text>
                  <Text style={styles.value}>{data.provider.license_number}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Sessions:</Text>
                <Text style={styles.value}>{data.totalSessions}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Time:</Text>
                <Text style={styles.value}>{data.totalMinutes} minutes</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Attendance:</Text>
                <Text style={styles.value}>{data.attendanceRate}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Goal Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal Progress Summary</Text>

          {data.goalStats.length === 0 ? (
            <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>
              No goals documented for this student.
            </Text>
          ) : (
            data.goalStats.map((goal, index) => (
              <View key={goal.goal_id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={styles.goalDomain}>{goal.domain}</Text>
                    <Text style={[styles.goalStatus, getStatusStyle(goal.status)]}>
                      {goal.status.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#6b7280' }}>
                    Goal {index + 1}
                  </Text>
                </View>

                <Text style={styles.goalDescription}>{goal.description}</Text>

                <View style={styles.goalStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{goal.avg_progress}%</Text>
                    <Text style={styles.statLabel}>Average</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{goal.latest_progress}%</Text>
                    <Text style={styles.statLabel}>Latest</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, getTrendStyle(goal.trend)]}>
                      {goal.trend}
                    </Text>
                    <Text style={styles.statLabel}>Trend</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{goal.data_points}</Text>
                    <Text style={styles.statLabel}>Data Points</Text>
                  </View>
                </View>

                {(goal.baseline !== 'N/A' || goal.target !== 'N/A') && (
                  <View style={{ marginTop: 8, flexDirection: 'row', gap: 20 }}>
                    <Text style={{ fontSize: 9, color: '#6b7280' }}>
                      Baseline: {goal.baseline}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#6b7280' }}>
                      Target: {goal.target}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>

      {/* Session Summary Page */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Summary</Text>

          {data.sessions.length === 0 ? (
            <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>
              No sessions documented during this period.
            </Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellMedium}>Date</Text>
                <Text style={styles.tableCellSmall}>Duration</Text>
                <Text style={styles.tableCellMedium}>Attendance</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>Notes</Text>
              </View>

              {data.sessions.slice(0, 20).map((session) => (
                <View key={session.id} style={styles.tableRow}>
                  <Text style={styles.tableCellMedium}>
                    {formatDate(session.session_date)}
                  </Text>
                  <Text style={styles.tableCellSmall}>
                    {session.duration_minutes}m
                  </Text>
                  <Text
                    style={[
                      styles.tableCellMedium,
                      session.attendance_status === 'present'
                        ? styles.attendancePresent
                        : styles.attendanceAbsent,
                    ]}
                  >
                    {session.attendance_status}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {(session.assessment || session.objective || 'No notes')
                      .substring(0, 80)}
                    {(session.assessment || session.objective || '').length > 80
                      ? '...'
                      : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {data.sessions.length > 20 && (
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 8 }}>
              Showing 20 of {data.sessions.length} sessions
            </Text>
          )}
        </View>

        {/* Signature Section */}
        <View style={styles.footer}>
          <View style={styles.signature}>
            <View>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Therapist Signature</Text>
              <Text style={{ fontSize: 9, color: '#9ca3af' }}>
                {data.provider?.full_name}
              </Text>
            </View>
            <View>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>

          <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 15 }}>
            Generated: {reportDate} | TheraNote by Qualia Solutions
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  )
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
        id: string
        first_name: string
        last_name: string
        date_of_birth: string | null
        grade: string | null
        iep_start_date: string | null
        iep_end_date: string | null
        discipline: string | null
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
    .single() as {
      data: {
        full_name: string
        discipline: string | null
        license_number: string | null
      } | null
    }

  // Get goals for student
  const { data: goals } = await supabase
    .from('goals')
    .select('id, description, domain, status, baseline, target_criteria')
    .eq('student_id', studentId)
    .order('domain') as {
      data: Array<{
        id: string
        description: string
        domain: string | null
        status: string
        baseline: string | null
        target_criteria: string | null
      }> | null
    }

  // Get sessions
  let sessionsQuery = supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      duration_minutes,
      attendance_status,
      objective,
      assessment
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
      duration_minutes: number | null
      attendance_status: string | null
      objective: string | null
      assessment: string | null
    }> | null
  }

  // Get goal progress data
  const sessionIds = (sessions || []).map((s) => s.id)
  const { data: progressData } =
    sessionIds.length > 0
      ? await supabase
          .from('session_goals')
          .select('session_id, goal_id, progress_value, progress_unit, notes')
          .in('session_id', sessionIds)
      : { data: [] }

  // Calculate goal statistics
  const goalStats: GoalStat[] = (goals || []).map((goal) => {
    const goalProgress = (progressData || [])
      .filter((p: { goal_id: string }) => p.goal_id === goal.id)
      .map((p: { progress_value: number | null }) => p.progress_value)
      .filter((v: number | null): v is number => v !== null)

    const avgProgress =
      goalProgress.length > 0
        ? goalProgress.reduce((a: number, b: number) => a + b, 0) / goalProgress.length
        : 0

    const latestProgress =
      goalProgress.length > 0 ? goalProgress[goalProgress.length - 1] : 0

    let trend = 'No data'
    if (goalProgress.length >= 2) {
      const firstHalf = goalProgress.slice(0, Math.floor(goalProgress.length / 2))
      const secondHalf = goalProgress.slice(Math.floor(goalProgress.length / 2))
      const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length
      const secondAvg =
        secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length

      if (secondAvg > firstAvg + 5) trend = 'Improving'
      else if (secondAvg < firstAvg - 5) trend = 'Declining'
      else trend = 'Stable'
    }

    return {
      goal_id: goal.id,
      description: goal.description,
      domain: goal.domain || 'General',
      status: goal.status,
      baseline: goal.baseline || 'N/A',
      target: goal.target_criteria || 'N/A',
      data_points: goalProgress.length,
      avg_progress: Math.round(avgProgress),
      latest_progress: latestProgress,
      trend,
    }
  })

  // Calculate attendance rate
  const presentCount = (sessions || []).filter(
    (s) => s.attendance_status === 'present'
  ).length
  const attendanceRate =
    sessions && sessions.length > 0
      ? Math.round((presentCount / sessions.length) * 100)
      : 0

  // Build report data
  const reportData: ProgressReportData = {
    student: {
      first_name: student.first_name,
      last_name: student.last_name,
      date_of_birth: student.date_of_birth,
      grade: student.grade,
      iep_start_date: student.iep_start_date,
      iep_end_date: student.iep_end_date,
      discipline: student.discipline,
    },
    provider: profile
      ? {
          full_name: profile.full_name,
          discipline: profile.discipline,
          license_number: profile.license_number,
        }
      : null,
    dateRange: {
      start: startDate || 'All time',
      end: endDate || 'Present',
    },
    totalSessions: (sessions || []).length,
    totalMinutes: (sessions || []).reduce(
      (acc, s) => acc + (s.duration_minutes || 0),
      0
    ),
    attendanceRate,
    goalStats,
    sessions: (sessions || []) as Session[],
  }

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    <ProgressReportPDF data={reportData} />
  )

  // Return PDF response
  const filename = `progress-report-${student.last_name}-${student.first_name}-${new Date().toISOString().split('T')[0]}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
