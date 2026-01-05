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

  // Get stats (placeholder queries - will need proper org filtering)
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  const { count: sessionCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user?.id || '')

  const { count: draftCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user?.id || '')
    .eq('status', 'draft')

  const { data: recentSessions } = await supabase
    .from('sessions')
    .select(`
      *,
      student:students(first_name, last_name)
    `)
    .eq('therapist_id', user?.id || '')
    .order('session_date', { ascending: false })
    .limit(5) as { data: Array<{
      id: string
      session_date: string
      discipline: string
      status: string
      student: { first_name: string; last_name: string } | null
    }> | null }

  // Get draft sessions for compliance check (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: draftSessions } = await supabase
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
    .gte('session_date', thirtyDaysAgo.toISOString()) as { data: Session[] | null }

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
