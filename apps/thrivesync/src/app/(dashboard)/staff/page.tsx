import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CredentialCard } from '@/components/staff/credential-card'
import { AddCredentialDialog } from '@/components/staff/add-credential-dialog'
import { StaffFilters } from '@/components/staff/staff-filters'
import Link from 'next/link'
import { Plus, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { Profile, StaffCredential } from '@repo/database'
import { getDaysUntil } from '@/lib/utils'

type ProfileWithCredentials = Profile & {
  staff_credentials: StaffCredential[]
}

// Required credentials for compliance
const REQUIRED_CREDENTIALS = [
  'fingerprint',
  'medical',
  'scr',
  'mandated_reporter',
  'cpr_first_aid',
]

function getCredentialStatus(credentials: StaffCredential[]) {
  const now = new Date()
  let expired = 0
  let expiringSoon = 0 // within 30 days
  let active = 0

  credentials.forEach((cred) => {
    if (!cred.expiration_date) {
      active++
      return
    }

    const expirationDate = new Date(cred.expiration_date)
    const daysUntil = getDaysUntil(cred.expiration_date)

    if (expirationDate < now) {
      expired++
    } else if (daysUntil <= 30) {
      expiringSoon++
    } else {
      active++
    }
  })

  return { expired, expiringSoon, active, total: credentials.length }
}

function getOverallStatus(credentials: StaffCredential[]) {
  const { expired, expiringSoon, total } = getCredentialStatus(credentials)
  const requiredMet = REQUIRED_CREDENTIALS.filter((type) =>
    credentials.some((c) => c.credential_type === type && c.status === 'active')
  ).length

  if (expired > 0 || requiredMet < REQUIRED_CREDENTIALS.length) {
    return 'incomplete'
  }
  if (expiringSoon > 0) {
    return 'expiring'
  }
  return 'compliant'
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; role?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch profiles with their credentials
  let query = supabase
    .from('profiles')
    .select(`
      *,
      staff_credentials (*)
    `)
    .order('full_name')

  // Apply search filter
  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  // Apply role filter
  if (params.role && params.role !== 'all') {
    query = query.eq('role', params.role)
  }

  const { data: staffData, error } = await query

  // Type assertion for the joined data
  const staff = (staffData as unknown as ProfileWithCredentials[]) || []

  // Filter by credential status if specified
  let filteredStaff = staff
  if (params.status && params.status !== 'all') {
    filteredStaff = staff.filter((member) => {
      const status = getOverallStatus(member.staff_credentials || [])
      return status === params.status
    })
  }

  // Calculate stats
  const totalStaff = staff.length
  const compliantCount = staff.filter(
    (s) => getOverallStatus(s.staff_credentials || []) === 'compliant'
  ).length
  const needsAttentionCount = staff.filter((s) => {
    const status = getOverallStatus(s.staff_credentials || [])
    return status === 'incomplete' || status === 'expiring'
  }).length

  // Get expiring credentials across all staff
  const allCredentials = staff.flatMap((s) => s.staff_credentials || [])
  const expiringCredentials = allCredentials.filter((c) => {
    if (!c.expiration_date) return false
    const daysUntil = getDaysUntil(c.expiration_date)
    return daysUntil > 0 && daysUntil <= 30
  })

  return (
    <>
      <Header
        title="Staff Management"
        subtitle="Manage team members, credentials, and attendance"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <StaffFilters />
          <AddCredentialDialog staff={staff} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-xl font-bold">{totalStaff}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fully Compliant</p>
                <p className="text-xl font-bold">{compliantCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Needs Attention</p>
                <p className="text-xl font-bold">{needsAttentionCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-xl font-bold">{expiringCredentials.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credential Alerts */}
        {expiringCredentials.length > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">
                Credentials Expiring Within 30 Days
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {expiringCredentials.slice(0, 6).map((cred) => {
                const staffMember = staff.find((s) =>
                  s.staff_credentials?.some((c) => c.id === cred.id)
                )
                return (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {cred.credential_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {staffMember?.full_name}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                      {getDaysUntil(cred.expiration_date!)} days
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Staff Table */}
        <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Discipline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Credentials
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStaff.map((member) => {
                const credentials = member.staff_credentials || []
                const { active, expired, expiringSoon } = getCredentialStatus(credentials)
                const status = getOverallStatus(credentials)
                const requiredMet = REQUIRED_CREDENTIALS.filter((type) =>
                  credentials.some(
                    (c) => c.credential_type === type && c.status === 'active'
                  )
                ).length

                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {member.full_name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('') || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.full_name}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-gray-900">{member.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">
                        {member.discipline ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                            {member.discipline}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {requiredMet}/{REQUIRED_CREDENTIALS.length}
                        </span>
                        <span className="text-sm text-gray-500">required</span>
                        {expired > 0 && (
                          <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            {expired} expired
                          </span>
                        )}
                        {expiringSoon > 0 && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            {expiringSoon} expiring
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {status === 'compliant' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Compliant
                        </span>
                      )}
                      {status === 'expiring' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock className="h-3 w-3" />
                          Expiring Soon
                        </span>
                      )}
                      {status === 'incomplete' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          Incomplete
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/staff/${member.id}`}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No staff members found</p>
                    <p className="text-sm text-gray-400">
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  )
}
