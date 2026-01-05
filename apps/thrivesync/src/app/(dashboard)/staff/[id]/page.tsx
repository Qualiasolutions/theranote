import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CredentialCard } from '@/components/staff/credential-card'
import { AddCredentialDialog } from '@/components/staff/add-credential-dialog'
import { AttendanceHistory } from '@/components/staff/attendance-history'
import { DocumentsList } from '@/components/staff/documents-list'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Clock,
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
  User,
} from 'lucide-react'
import type { Profile, StaffCredential, StaffAttendance, StaffDocument } from '@repo/database'
import { formatDate, getDaysUntil } from '@/lib/utils'

type ProfileWithRelations = Profile & {
  staff_credentials: StaffCredential[]
  staff_attendance: StaffAttendance[]
  staff_documents: StaffDocument[]
}

// Required credentials for compliance
const REQUIRED_CREDENTIALS = [
  { type: 'fingerprint', name: 'DOE Fingerprint Clearance' },
  { type: 'medical', name: 'Medical Clearance' },
  { type: 'scr', name: 'SCR Clearance' },
  { type: 'mandated_reporter', name: 'Mandated Reporter Training' },
  { type: 'cpr_first_aid', name: 'CPR/First Aid Certification' },
]

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch staff member with all related data
  const { data: staffData, error } = await supabase
    .from('profiles')
    .select(`
      *,
      staff_credentials (*),
      staff_attendance (*),
      staff_documents (*)
    `)
    .eq('id', id)
    .single()

  if (error || !staffData) {
    notFound()
  }

  const staff = staffData as unknown as ProfileWithRelations

  // Calculate credential status
  const credentials = staff.staff_credentials || []
  const credentialsByType = new Map(
    credentials.map((c) => [c.credential_type, c])
  )

  // Check required credentials status
  const requiredStatus = REQUIRED_CREDENTIALS.map((req) => {
    const cred = credentialsByType.get(req.type)
    if (!cred) {
      return { ...req, status: 'missing' as const, credential: null }
    }
    if (cred.expiration_date) {
      const daysUntil = getDaysUntil(cred.expiration_date)
      if (daysUntil < 0) {
        return { ...req, status: 'expired' as const, credential: cred }
      }
      if (daysUntil <= 30) {
        return { ...req, status: 'expiring' as const, credential: cred }
      }
    }
    return { ...req, status: 'active' as const, credential: cred }
  })

  const compliantCount = requiredStatus.filter((s) => s.status === 'active').length
  const isFullyCompliant = compliantCount === REQUIRED_CREDENTIALS.length

  // Get additional credentials (not in required list)
  const additionalCredentials = credentials.filter(
    (c) => !REQUIRED_CREDENTIALS.some((r) => r.type === c.credential_type)
  )

  // Recent attendance
  const attendance = (staff.staff_attendance || [])
    .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime())
    .slice(0, 10)

  // Documents
  const documents = staff.staff_documents || []

  return (
    <>
      <Header
        title={staff.full_name}
        subtitle={`${staff.role} ${staff.discipline ? `- ${staff.discipline}` : ''}`}
      />

      <div className="p-6 space-y-6">
        {/* Back link */}
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff
        </Link>

        {/* Profile Header */}
        <div className="rounded-xl bg-white shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">
                  {staff.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('') || '?'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{staff.full_name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1 capitalize">
                    <User className="h-4 w-4" />
                    {staff.role}
                  </span>
                  {staff.discipline && (
                    <span className="flex items-center gap-1 capitalize">
                      <Award className="h-4 w-4" />
                      {staff.discipline}
                    </span>
                  )}
                  {staff.license_number && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      License: {staff.license_number}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {staff.email}
                  </span>
                  {staff.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(staff.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isFullyCompliant ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Fully Compliant
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  {compliantCount}/{REQUIRED_CREDENTIALS.length} Compliant
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Credentials */}
          <div className="lg:col-span-2 space-y-6">
            {/* Required Credentials */}
            <div className="rounded-xl bg-white shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Required Credentials</h3>
                </div>
                <AddCredentialDialog staff={[staff]} defaultStaffId={staff.id} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {requiredStatus.map((item) => (
                  <div
                    key={item.type}
                    className={`rounded-lg border p-4 ${
                      item.status === 'active'
                        ? 'border-green-200 bg-green-50'
                        : item.status === 'expiring'
                        ? 'border-amber-200 bg-amber-50'
                        : item.status === 'expired'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.credential ? (
                          <>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.credential.credential_name}
                            </p>
                            {item.credential.expiration_date && (
                              <p className="text-xs text-gray-400 mt-1">
                                Expires: {formatDate(item.credential.expiration_date)}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-400 mt-1">Not on file</p>
                        )}
                      </div>
                      <div>
                        {item.status === 'active' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {item.status === 'expiring' && (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                        {item.status === 'expired' && (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                        {item.status === 'missing' && (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Credentials */}
            {additionalCredentials.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Additional Credentials</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {additionalCredentials.map((cred) => (
                    <CredentialCard key={cred.id} credential={cred} />
                  ))}
                </div>
              </div>
            )}

            {/* All Credentials */}
            {credentials.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">All Credentials</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {credentials.map((cred) => (
                    <CredentialCard key={cred.id} credential={cred} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Attendance & Documents */}
          <div className="space-y-6">
            {/* Attendance History */}
            <div className="rounded-xl bg-white shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Recent Attendance</h3>
              </div>
              <AttendanceHistory attendance={attendance} />
            </div>

            {/* Documents */}
            <div className="rounded-xl bg-white shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">HR Documents</h3>
              </div>
              <DocumentsList documents={documents} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
