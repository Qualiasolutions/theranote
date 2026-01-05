import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import {
  Users,
  School,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import type { Profile, StaffCredential, ComplianceItem, ComplianceEvidence } from '@repo/database'
import { getDaysUntil } from '@/lib/utils'

// Category definitions for compliance scores
const complianceCategories = ['hr', 'article_47', 'dohmh', 'nysed'] as const

// Calculate if ratio is met
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

  // ========== STATS CARDS ==========

  // Total Staff: Count profiles (all roles are staff in ThriveSync context)
  const { count: staffCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Active Students
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Compliance Score: Calculate from compliance_items and compliance_evidence
  const { data: complianceItemsRaw } = await supabase
    .from('compliance_items')
    .select('*')

  const complianceItems = (complianceItemsRaw || []) as ComplianceItem[]

  const { data: evidenceRaw } = await supabase
    .from('compliance_evidence')
    .select('*')
    .eq('status', 'approved')

  const evidence = (evidenceRaw || []) as ComplianceEvidence[]

  // Calculate overall compliance score
  const totalItems = complianceItems.length
  const compliantItems = complianceItems.filter((item) => {
    const itemEvidence = evidence.find(
      (e) => e.compliance_item_id === item.id && e.status === 'approved'
    )
    if (!itemEvidence) return false
    if (itemEvidence.expiration_date) {
      return new Date(itemEvidence.expiration_date) > new Date()
    }
    return true
  }).length
  const complianceScore = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100

  // Pending Alerts: Count from compliance_alerts where not resolved
  const { count: alertCount } = await supabase
    .from('compliance_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('resolved', false)

  const stats = [
    { name: 'Total Staff', value: staffCount || 0, icon: Users, color: 'bg-blue-500' },
    { name: 'Active Students', value: studentCount || 0, icon: School, color: 'bg-green-500' },
    { name: 'Compliance Score', value: `${complianceScore}%`, icon: CheckCircle, color: 'bg-purple-500' },
    { name: 'Pending Alerts', value: alertCount || 0, icon: AlertTriangle, color: 'bg-amber-500' },
  ]

  // ========== CREDENTIAL ALERTS ==========

  // Fetch all staff with their credentials
  const { data: staffWithCredentialsRaw } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      staff_credentials (*)
    `)

  type ProfileWithCredentials = Profile & { staff_credentials: StaffCredential[] }
  const staffWithCredentials = (staffWithCredentialsRaw as unknown as ProfileWithCredentials[]) || []

  // Categorize credentials by status
  const now = new Date()
  const credentialAlerts: {
    expired: { staffName: string; credentialType: string; daysOverdue: number }[]
    expiringSoon: { staffName: string; credentialType: string; daysUntil: number }[]
    expiringLater: { staffName: string; credentialType: string; daysUntil: number }[]
  } = {
    expired: [],
    expiringSoon: [], // within 30 days
    expiringLater: [], // 30-90 days
  }

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

  // Sort by urgency
  credentialAlerts.expired.sort((a, b) => b.daysOverdue - a.daysOverdue)
  credentialAlerts.expiringSoon.sort((a, b) => a.daysUntil - b.daysUntil)
  credentialAlerts.expiringLater.sort((a, b) => a.daysUntil - b.daysUntil)

  // ========== CLASSROOM STATUS ==========

  // Fetch classrooms with assignments and staff
  const { data: classroomsRaw } = await supabase
    .from('classrooms')
    .select(`
      *,
      classroom_assignments!left(id, student_id),
      classroom_staff!left(id, profile_id)
    `)
    .eq('status', 'active')
    .order('name')
    .limit(6)

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

  // ========== COMPLIANCE BY CATEGORY ==========

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
        subtitle="Operations & Compliance Overview"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg ${stat.color} p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Credential Alerts */}
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Credential Alerts</h3>
              <Link href="/staff" className="text-sm text-purple-600 hover:text-purple-700">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {credentialAlerts.expired.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="font-medium text-red-800">
                      {credentialAlerts.expired.length} credential{credentialAlerts.expired.length !== 1 ? 's' : ''} expired
                    </p>
                    <p className="text-sm text-red-600">
                      {credentialAlerts.expired.slice(0, 2).map(c => c.staffName).join(', ')}
                      {credentialAlerts.expired.length > 2 ? ` +${credentialAlerts.expired.length - 2} more` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">Critical</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div>
                    <p className="font-medium text-green-800">No expired credentials</p>
                    <p className="text-sm text-green-600">All credentials are current</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}

              {credentialAlerts.expiringSoon.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <p className="font-medium text-amber-800">
                      {credentialAlerts.expiringSoon.length} expiring in 30 days
                    </p>
                    <p className="text-sm text-amber-600">
                      {credentialAlerts.expiringSoon.slice(0, 2).map(c => c.staffName).join(', ')}
                      {credentialAlerts.expiringSoon.length > 2 ? ` +${credentialAlerts.expiringSoon.length - 2} more` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">Warning</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-700">No credentials expiring soon</p>
                    <p className="text-sm text-gray-500">Nothing due in the next 30 days</p>
                  </div>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
              )}

              {credentialAlerts.expiringLater.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                    <p className="font-medium text-blue-800">
                      {credentialAlerts.expiringLater.length} expiring in 90 days
                    </p>
                    <p className="text-sm text-blue-600">
                      {credentialAlerts.expiringLater.slice(0, 2).map(c => c.staffName).join(', ')}
                      {credentialAlerts.expiringLater.length > 2 ? ` +${credentialAlerts.expiringLater.length - 2} more` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">Info</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-700">No upcoming expirations</p>
                    <p className="text-sm text-gray-500">Nothing due in the next 90 days</p>
                  </div>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Ratio Status */}
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Classroom Ratios</h3>
              <Link href="/classrooms" className="text-sm text-purple-600 hover:text-purple-700">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {classroomStatus.length > 0 ? (
                classroomStatus.map((room) => (
                  <div key={room.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {room.name} ({room.roomType})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${room.ratioMet ? 'text-gray-900' : 'text-amber-600'}`}>
                        {room.ratio}
                      </span>
                      {room.ratioMet ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <School className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No active classrooms</p>
                  <Link href="/classrooms" className="text-sm text-purple-600 hover:text-purple-700">
                    Add Classroom
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compliance Overview */}
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Compliance Overview</h3>
            <Link href="/compliance" className="text-sm text-purple-600 hover:text-purple-700">
              View Details
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryStats.map((cat) => (
              <Link
                key={cat.category}
                href={`/compliance/${cat.category}`}
                className={`text-center p-4 rounded-lg transition-colors ${
                  cat.score >= 90
                    ? 'bg-green-50 hover:bg-green-100'
                    : cat.score >= 70
                      ? 'bg-amber-50 hover:bg-amber-100'
                      : 'bg-red-50 hover:bg-red-100'
                }`}
              >
                <p className={`text-3xl font-bold ${
                  cat.score >= 90
                    ? 'text-green-600'
                    : cat.score >= 70
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}>
                  {cat.score}%
                </p>
                <p className="text-sm text-gray-600">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
