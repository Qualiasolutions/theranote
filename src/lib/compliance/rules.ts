/**
 * Compliance Rules Engine for TheraNote
 *
 * Enforces NYC DOE and NYSED regulations for special education documentation:
 * - 7-day signing requirement
 * - Session frequency compliance
 * - Required SOAP fields
 * - IEP/IFSP goal documentation
 */

export interface ComplianceViolation {
  id: string
  type: 'critical' | 'warning' | 'info'
  rule: string
  message: string
  sessionId?: string
  studentId?: string
  studentName?: string
  dueDate?: string
  daysOverdue?: number
}

export interface Session {
  id: string
  session_date: string
  status: string
  signed_at: string | null
  student_id: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  attendance_status: string
  student?: {
    first_name: string
    last_name: string
  } | null
}

export interface Goal {
  id: string
  student_id: string
  status: string
  description: string
}

export interface SessionGoal {
  session_id: string
  goal_id: string
  progress_value: number | null
}

// NYC DOE requires notes to be signed within 7 calendar days
const SIGNING_DEADLINE_DAYS = 7

/**
 * Check for unsigned sessions approaching or past deadline
 */
export function checkSigningCompliance(sessions: Session[]): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const session of sessions) {
    if (session.status !== 'draft') continue

    const sessionDate = new Date(session.session_date)
    sessionDate.setHours(0, 0, 0, 0)

    const deadline = new Date(sessionDate)
    deadline.setDate(deadline.getDate() + SIGNING_DEADLINE_DAYS)

    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const studentName = session.student
      ? `${session.student.first_name} ${session.student.last_name}`
      : 'Unknown Student'

    if (daysUntilDeadline < 0) {
      // Past deadline - critical
      violations.push({
        id: `sign-overdue-${session.id}`,
        type: 'critical',
        rule: '7-day signing requirement',
        message: `Session note for ${studentName} (${session.session_date}) is ${Math.abs(daysUntilDeadline)} days overdue for signature`,
        sessionId: session.id,
        studentId: session.student_id,
        studentName,
        dueDate: deadline.toISOString().split('T')[0],
        daysOverdue: Math.abs(daysUntilDeadline),
      })
    } else if (daysUntilDeadline <= 2) {
      // Due soon - warning
      violations.push({
        id: `sign-soon-${session.id}`,
        type: 'warning',
        rule: '7-day signing requirement',
        message: `Session note for ${studentName} (${session.session_date}) needs signature ${daysUntilDeadline === 0 ? 'today' : `in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`}`,
        sessionId: session.id,
        studentId: session.student_id,
        studentName,
        dueDate: deadline.toISOString().split('T')[0],
      })
    }
  }

  return violations
}

/**
 * Check for incomplete SOAP sections
 */
export function checkSOAPCompleteness(sessions: Session[]): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []

  for (const session of sessions) {
    if (session.status !== 'draft') continue
    if (session.attendance_status !== 'present') continue

    const studentName = session.student
      ? `${session.student.first_name} ${session.student.last_name}`
      : 'Unknown Student'

    const missingSections: string[] = []
    if (!session.subjective) missingSections.push('Subjective')
    if (!session.objective) missingSections.push('Objective')
    if (!session.assessment) missingSections.push('Assessment')
    if (!session.plan) missingSections.push('Plan')

    if (missingSections.length > 0) {
      violations.push({
        id: `soap-incomplete-${session.id}`,
        type: 'warning',
        rule: 'Complete SOAP documentation',
        message: `Session for ${studentName} (${session.session_date}) is missing: ${missingSections.join(', ')}`,
        sessionId: session.id,
        studentId: session.student_id,
        studentName,
      })
    }
  }

  return violations
}

/**
 * Check for sessions without goal progress documentation
 */
export function checkGoalProgressDocumentation(
  sessions: Session[],
  sessionGoals: SessionGoal[],
  goals: Goal[]
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []

  for (const session of sessions) {
    if (session.status !== 'signed') continue
    if (session.attendance_status !== 'present') continue

    const studentName = session.student
      ? `${session.student.first_name} ${session.student.last_name}`
      : 'Unknown Student'

    // Get active goals for this student
    const studentGoals = goals.filter(
      g => g.student_id === session.student_id && (g.status === 'in_progress' || g.status === 'baseline')
    )

    if (studentGoals.length === 0) continue

    // Check if any goals have progress documented
    const sessionProgress = sessionGoals.filter(sg => sg.session_id === session.id)
    const documentedGoals = sessionProgress.filter(sg => sg.progress_value !== null).length

    if (documentedGoals === 0 && studentGoals.length > 0) {
      violations.push({
        id: `goal-progress-${session.id}`,
        type: 'info',
        rule: 'Goal progress tracking',
        message: `Session for ${studentName} (${session.session_date}) has no goal progress data recorded`,
        sessionId: session.id,
        studentId: session.student_id,
        studentName,
      })
    }
  }

  return violations
}

interface CaseloadWithSessions {
  student_id: string
  student_name: string
  weekly_frequency: number
  sessions_this_week: number
  sessions_this_month: number
  expected_sessions_month: number
}

/**
 * Check session frequency compliance against IEP mandates
 */
export function checkFrequencyCompliance(caseloads: CaseloadWithSessions[]): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []

  for (const caseload of caseloads) {
    const complianceRate = caseload.expected_sessions_month > 0
      ? (caseload.sessions_this_month / caseload.expected_sessions_month) * 100
      : 100

    if (complianceRate < 80) {
      violations.push({
        id: `frequency-${caseload.student_id}`,
        type: complianceRate < 60 ? 'critical' : 'warning',
        rule: 'IEP service frequency',
        message: `${caseload.student_name} has received ${caseload.sessions_this_month} of ${caseload.expected_sessions_month} required sessions this month (${Math.round(complianceRate)}%)`,
        studentId: caseload.student_id,
        studentName: caseload.student_name,
      })
    }
  }

  return violations
}

/**
 * Pre-sign validation - checks if a session is ready to be signed
 */
export function validateBeforeSign(session: Session): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // For present sessions, all SOAP sections are required
  if (session.attendance_status === 'present') {
    if (!session.subjective?.trim()) errors.push('Subjective section is required')
    if (!session.objective?.trim()) errors.push('Objective section is required')
    if (!session.assessment?.trim()) errors.push('Assessment section is required')
    if (!session.plan?.trim()) errors.push('Plan section is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get all compliance violations for a therapist
 */
export function getComplianceViolations(
  sessions: Session[],
  sessionGoals: SessionGoal[],
  goals: Goal[],
  caseloads: CaseloadWithSessions[]
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = []

  // Check all compliance rules
  violations.push(...checkSigningCompliance(sessions))
  violations.push(...checkSOAPCompleteness(sessions))
  violations.push(...checkGoalProgressDocumentation(sessions, sessionGoals, goals))
  violations.push(...checkFrequencyCompliance(caseloads))

  // Sort by severity and due date
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  violations.sort((a, b) => {
    const severityDiff = severityOrder[a.type] - severityOrder[b.type]
    if (severityDiff !== 0) return severityDiff

    // Sort by days overdue for signing issues
    if (a.daysOverdue !== undefined && b.daysOverdue !== undefined) {
      return b.daysOverdue - a.daysOverdue
    }

    return 0
  })

  return violations
}

/**
 * Get compliance summary statistics
 */
export function getComplianceSummary(violations: ComplianceViolation[]): {
  critical: number
  warning: number
  info: number
  total: number
  complianceScore: number
} {
  const critical = violations.filter(v => v.type === 'critical').length
  const warning = violations.filter(v => v.type === 'warning').length
  const info = violations.filter(v => v.type === 'info').length
  const total = violations.length

  // Calculate compliance score (100 = perfect, weighted by severity)
  const maxDeductions = 100
  const criticalWeight = 20 // Each critical issue deducts 20 points
  const warningWeight = 5 // Each warning deducts 5 points
  const infoWeight = 1 // Each info deducts 1 point

  const deductions = Math.min(
    maxDeductions,
    critical * criticalWeight + warning * warningWeight + info * infoWeight
  )

  return {
    critical,
    warning,
    info,
    total,
    complianceScore: Math.max(0, 100 - deductions),
  }
}
