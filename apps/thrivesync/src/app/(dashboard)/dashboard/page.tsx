import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import {
  Users,
  Building,
  AlertCircle,
  Check,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
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

  const stats = [
    { name: 'Total Staff', value: staffCount || 0, icon: Users, change: 'Team members' },
    { name: 'Active Students', value: studentCount || 0, icon: Building, change: 'Enrolled' },
    { name: 'Compliance', value: `${complianceScore}%`, icon: TrendingUp, change: complianceScore >= 90 ? 'On track' : 'Needs attention' },
    { name: 'Alerts', value: alertCount || 0, icon: AlertCircle, change: (alertCount || 0) > 0 ? 'Action needed' : 'All clear' },
  ]

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

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="stat-card group transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-semibold tracking-tight mt-1">{stat.value}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credential Alerts */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Credential Status</h3>
              <Link href="/staff" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {credentialAlerts.expired.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {credentialAlerts.expired.length} expired
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {credentialAlerts.expired.slice(0, 2).map(c => c.staffName).join(', ')}
                      {credentialAlerts.expired.length > 2 ? ` +${credentialAlerts.expired.length - 2}` : ''}
                    </p>
                  </div>
                  <span className="badge-premium badge-error">Critical</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div>
                    <p className="text-sm font-medium text-emerald-800">No expired credentials</p>
                    <p className="text-xs text-emerald-600 mt-0.5">All credentials current</p>
                  </div>
                  <Check className="h-4 w-4 text-emerald-500" />
                </div>
              )}

              {credentialAlerts.expiringSoon.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {credentialAlerts.expiringSoon.length} expiring in 30 days
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {credentialAlerts.expiringSoon.slice(0, 2).map(c => c.staffName).join(', ')}
                    </p>
                  </div>
                  <span className="badge-premium badge-warning">Warning</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-black/[0.04]">
                  <div>
                    <p className="text-sm font-medium text-foreground">No upcoming expirations</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Next 30 days clear</p>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {credentialAlerts.expiringLater.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-black/[0.04]">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {credentialAlerts.expiringLater.length} expiring in 90 days
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {credentialAlerts.expiringLater.slice(0, 2).map(c => c.staffName).join(', ')}
                    </p>
                  </div>
                  <span className="badge-premium badge-neutral">Info</span>
                </div>
              )}
            </div>
          </div>

          {/* Classroom Ratios */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Classroom Ratios</h3>
              <Link href="/classrooms" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {classroomStatus.length > 0 ? (
                classroomStatus.map((room) => (
                  <div key={room.id} className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">{room.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({room.roomType})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${room.ratioMet ? 'text-foreground' : 'text-amber-600'}`}>
                        {room.ratio}
                      </span>
                      {room.ratioMet ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Building className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No active classrooms</p>
                  <Link href="/classrooms" className="text-xs text-primary hover:underline mt-1 inline-block">
                    Add Classroom
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compliance Overview */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Compliance by Category</h3>
            <Link href="/compliance" className="text-xs text-primary hover:underline flex items-center gap-1">
              View details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categoryStats.map((cat) => (
              <Link
                key={cat.category}
                href={`/compliance/${cat.category}`}
                className={`text-center p-4 rounded-lg transition-colors border ${
                  cat.score >= 90
                    ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                    : cat.score >= 70
                      ? 'bg-amber-50 border-amber-100 hover:bg-amber-100'
                      : 'bg-red-50 border-red-100 hover:bg-red-100'
                }`}
              >
                <p className={`text-2xl font-semibold ${
                  cat.score >= 90
                    ? 'text-emerald-700'
                    : cat.score >= 70
                      ? 'text-amber-700'
                      : 'text-red-700'
                }`}>
                  {cat.score}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
