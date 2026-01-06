import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { DashboardClient } from './dashboard-client'
import type { Profile, StaffCredential, ComplianceItem, ComplianceEvidence } from '@repo/database'
import { getDaysUntil } from '@/lib/utils'

const complianceCategories = ['hr', 'article_47', 'dohmh', 'nysed'] as const

function calculateRatioMet(
  staffCount: number,
  studentCount: number,
  ratioRequirement: string | null
): { met: boolean; ratio: string } {
  if (!ratioRequirement || staffCount === 0) {
    return { met: false, ratio: `${staffCount}:${studentCount}` }
  }
  const parts = ratioRequirement.split(':')
  if (parts.length !== 2) {
    return { met: false, ratio: `${staffCount}:${studentCount}` }
  }
  const staffRequired = parseInt(parts[0], 10)
  const studentsPerStaff = parseInt(parts[1], 10)
  if (isNaN(staffRequired) || isNaN(studentsPerStaff)) {
    return { met: false, ratio: `${staffCount}:${studentCount}` }
  }
  const maxStudents = staffCount * (studentsPerStaff / staffRequired)
  return {
    met: studentCount <= maxStudents,
    ratio: `${staffCount}:${studentCount}`,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Run all queries in parallel for optimal performance
  const [
    { count: staffCount },
    { count: studentCount },
    { data: complianceItemsRaw },
    { data: evidenceRaw },
    { count: alertCount },
    { data: staffWithCredentialsRaw },
    { data: classroomsRaw }
  ] = await Promise.all([
    // Query 1: Staff count
    supabase.from('profiles').select('*', { count: 'exact', head: true }),

    // Query 2: Active student count
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),

    // Query 3: Compliance items (only needed fields)
    supabase.from('compliance_items').select('id, category'),

    // Query 4: Approved evidence (only needed fields)
    supabase.from('compliance_evidence').select('id, compliance_item_id, expiration_date, status').eq('status', 'approved'),

    // Query 5: Alert count
    supabase.from('compliance_alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),

    // Query 6: Staff with credentials (only needed fields)
    supabase.from('profiles').select(`id, full_name, staff_credentials (id, credential_name, expiration_date)`),

    // Query 7: Classrooms with counts
    supabase.from('classrooms')
      .select(`id, name, room_type, ratio_requirement, classroom_assignments!left(id), classroom_staff!left(id)`)
      .eq('status', 'active')
      .order('name')
      .limit(6)
  ])

  const complianceItems = (complianceItemsRaw || []) as ComplianceItem[]
  const evidence = (evidenceRaw || []) as ComplianceEvidence[]

  // Build evidence lookup map for O(1) access instead of O(n) find()
  const evidenceByItemId = new Map<string, ComplianceEvidence>()
  evidence.forEach(e => {
    if (!e.compliance_item_id) return
    if (!evidenceByItemId.has(e.compliance_item_id) ||
        (e.expiration_date && new Date(e.expiration_date) > new Date())) {
      evidenceByItemId.set(e.compliance_item_id, e)
    }
  })

  const now = new Date()
  const totalItems = complianceItems.length
  const compliantItems = complianceItems.filter((item) => {
    const itemEvidence = evidenceByItemId.get(item.id)
    if (!itemEvidence) return false
    if (itemEvidence.expiration_date) {
      return new Date(itemEvidence.expiration_date) > now
    }
    return true
  }).length
  const complianceScore = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100

  type ProfileWithCredentials = Profile & { staff_credentials: StaffCredential[] }
  const staffWithCredentials = (staffWithCredentialsRaw as unknown as ProfileWithCredentials[]) || []

  const credentialAlerts: {
    expired: { staffName: string; credentialType: string; daysOverdue: number }[]
    expiringSoon: { staffName: string; credentialType: string; daysUntil: number }[]
    expiringLater: { staffName: string; credentialType: string; daysUntil: number }[]
  } = {
    expired: [],
    expiringSoon: [],
    expiringLater: [],
  }

  // Process credentials efficiently
  staffWithCredentials.forEach((staff) => {
    const credentials = staff.staff_credentials || []
    credentials.forEach((cred) => {
      if (!cred.expiration_date) return

      const expirationDate = new Date(cred.expiration_date)
      const daysUntil = getDaysUntil(cred.expiration_date)

      if (expirationDate < now) {
        credentialAlerts.expired.push({
          staffName: staff.full_name || 'Unknown',
          credentialType: cred.credential_name,
          daysOverdue: Math.abs(daysUntil),
        })
      } else if (daysUntil <= 30) {
        credentialAlerts.expiringSoon.push({
          staffName: staff.full_name || 'Unknown',
          credentialType: cred.credential_name,
          daysUntil,
        })
      } else if (daysUntil <= 90) {
        credentialAlerts.expiringLater.push({
          staffName: staff.full_name || 'Unknown',
          credentialType: cred.credential_name,
          daysUntil,
        })
      }
    })
  })

  credentialAlerts.expired.sort((a, b) => b.daysOverdue - a.daysOverdue)
  credentialAlerts.expiringSoon.sort((a, b) => a.daysUntil - b.daysUntil)
  credentialAlerts.expiringLater.sort((a, b) => a.daysUntil - b.daysUntil)

  type ClassroomWithCounts = {
    id: string
    name: string
    room_type: string | null
    ratio_requirement: string | null
    classroom_assignments?: { id: string; student_id: string }[]
    classroom_staff?: { id: string; profile_id: string }[]
  }

  const classrooms = (classroomsRaw as unknown as ClassroomWithCounts[]) || []

  const classroomStatus = classrooms.map((room) => {
    const studentCount = room.classroom_assignments?.length || 0
    const staffCount = room.classroom_staff?.length || 0
    const { met, ratio } = calculateRatioMet(staffCount, studentCount, room.ratio_requirement)
    return {
      id: room.id,
      name: room.name,
      roomType: room.room_type || 'General',
      ratio,
      ratioMet: met,
    }
  })

  const categoryStats = complianceCategories.map((category) => {
    const categoryItems = complianceItems.filter((item) => item.category === category)
    const categoryTotal = categoryItems.length
    const categoryCompliant = categoryItems.filter((item) => {
      const itemEvidence = evidence.find(
        (e) => e.compliance_item_id === item.id && e.status === 'approved'
      )
      if (!itemEvidence) return false
      if (itemEvidence.expiration_date) {
        return new Date(itemEvidence.expiration_date) > new Date()
      }
      return true
    }).length

    const score = categoryTotal > 0 ? Math.round((categoryCompliant / categoryTotal) * 100) : 100

    const displayNames: Record<string, string> = {
      hr: 'Staff HR',
      article_47: 'Article 47',
      dohmh: 'DOHMH',
      nysed: 'NYSED',
    }

    return {
      category,
      name: displayNames[category] || category,
      score,
    }
  })

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Operations overview"
      />

      <DashboardClient
        staffCount={staffCount || 0}
        studentCount={studentCount || 0}
        complianceScore={complianceScore}
        alertCount={alertCount || 0}
        credentialAlerts={credentialAlerts}
        classroomStatus={classroomStatus}
        categoryStats={categoryStats}
      />
    </>
  )
}
export const dynamic = 'force-dynamic'
