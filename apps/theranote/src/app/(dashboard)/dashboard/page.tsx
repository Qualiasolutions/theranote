import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import {
  checkSigningCompliance,
  checkSOAPCompleteness,
  getComplianceSummary,
  type Session,
} from '@/lib/compliance/rules'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get draft sessions date filter
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Run all queries in parallel to eliminate waterfall
  const [
    { count: studentCount },
    { count: sessionCount },
    { count: draftCount },
    { data: recentSessions },
    { data: draftSessions }
  ] = await Promise.all([
    // Query 1: Student count
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true }),

    // Query 2: Total session count
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user?.id || ''),

    // Query 3: Draft count
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user?.id || '')
      .eq('status', 'draft'),

    // Query 4: Recent sessions (only needed fields)
    supabase
      .from('sessions')
      .select(`
        id,
        session_date,
        discipline,
        status,
        student:students(first_name, last_name)
      `)
      .eq('therapist_id', user?.id || '')
      .order('session_date', { ascending: false })
      .limit(5) as Promise<{ data: Array<{
        id: string
        session_date: string
        discipline: string
        status: string
        student: { first_name: string; last_name: string } | null
      }> | null }>,

    // Query 5: Draft sessions for compliance (only needed fields)
    supabase
      .from('sessions')
      .select(`
        id,
        session_date,
        status,
        signed_at,
        student_id,
        subjective,
        objective,
        assessment,
        plan,
        attendance_status,
        student:students(first_name, last_name)
      `)
      .eq('therapist_id', user?.id || '')
      .eq('status', 'draft')
      .gte('session_date', thirtyDaysAgo.toISOString()) as Promise<{ data: Session[] | null }>
  ])

  // Check compliance
  const signingViolations = checkSigningCompliance(draftSessions || [])
  const soapViolations = checkSOAPCompleteness(draftSessions || [])
  const allViolations = [...signingViolations, ...soapViolations]
  const complianceSummary = getComplianceSummary(allViolations)

  // Convert violations to serializable format
  const serializedViolations = allViolations.map(v => ({
    id: v.id,
    type: v.type,
    rule: v.rule,
    message: v.message,
    sessionId: v.sessionId,
    studentId: v.studentId,
    studentName: v.studentName,
    dueDate: v.dueDate,
    daysOverdue: v.daysOverdue,
  }))

  return (
    <DashboardClient
      studentCount={studentCount || 0}
      sessionCount={sessionCount || 0}
      draftCount={draftCount || 0}
      recentSessions={recentSessions || []}
      complianceViolations={serializedViolations}
      complianceScore={complianceSummary.complianceScore}
    />
  )
}
