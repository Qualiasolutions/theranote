import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ContactCard } from '@/components/families/contact-card'
import Link from 'next/link'
import {
  Users2,
  MessageSquare,
  Phone,
  Mail,
  Plus,
  Search,
  AlertTriangle,
  User,
} from 'lucide-react'
import type { Student, FamilyContact, FamilyCommunication } from '@repo/database'

type StudentWithContacts = Student & {
  family_contacts: FamilyContact[]
}

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch students with their family contacts
  let query = supabase
    .from('students')
    .select(`
      *,
      family_contacts (*)
    `)
    .eq('status', 'active')
    .order('last_name')

  // Apply search filter
  if (params.search) {
    query = query.or(
      `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%`
    )
  }

  const { data: studentsData, error } = await query

  // Type assertion for the joined data
  const students = (studentsData as unknown as StudentWithContacts[]) || []

  // Filter by contact name if search includes it
  let filteredStudents = students
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filteredStudents = students.filter((student) => {
      const nameMatch =
        student.first_name.toLowerCase().includes(searchLower) ||
        student.last_name.toLowerCase().includes(searchLower)
      const contactMatch = student.family_contacts?.some((contact) =>
        contact.name.toLowerCase().includes(searchLower)
      )
      return nameMatch || contactMatch
    })
  }

  // Fetch recent communications count (this month)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: communicationsThisMonth } = await supabase
    .from('family_communications')
    .select('*', { count: 'exact', head: true })
    .gte('communication_date', startOfMonth.toISOString())

  // Fetch pending follow-ups
  const { count: pendingFollowUps } = await supabase
    .from('family_communications')
    .select('*', { count: 'exact', head: true })
    .eq('follow_up_required', true)
    .is('outcome', null)

  // Calculate stats
  const totalFamilies = students.length
  const totalContacts = students.reduce(
    (acc, s) => acc + (s.family_contacts?.length || 0),
    0
  )

  return (
    <>
      <Header
        title="Family Communication"
        subtitle="Manage parent contacts and communication logs"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="search"
              defaultValue={params.search}
              placeholder="Search by student or contact name..."
              className="h-10 w-full sm:w-80 rounded-lg border bg-white pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </form>
          <Link
            href="/families/log"
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Log Communication
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Users2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Students with Contacts</p>
                <p className="text-xl font-bold">{totalFamilies}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Contacts</p>
                <p className="text-xl font-bold">{totalContacts}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Communications (This Month)</p>
                <p className="text-xl font-bold">{communicationsThisMonth || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Phone className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Follow-ups</p>
                <p className="text-xl font-bold">{pendingFollowUps || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Students with Family Contacts */}
        {error ? (
          <div className="rounded-xl bg-red-50 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">Failed to load families</p>
            <p className="text-sm text-red-500">{error.message}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-12 text-center">
            <Users2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No families found
            </h3>
            <p className="text-sm text-gray-500">
              {params.search
                ? 'Try adjusting your search'
                : 'Add contacts to students to see them here'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="rounded-xl bg-white shadow-sm border overflow-hidden"
              >
                {/* Student Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-600">
                        {student.first_name[0]}
                        {student.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {student.family_contacts?.length || 0} contact
                        {student.family_contacts?.length !== 1 ? 's' : ''} on file
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/families/${student.id}`}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View Details
                  </Link>
                </div>

                {/* Contacts Grid */}
                <div className="p-6">
                  {student.family_contacts && student.family_contacts.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {student.family_contacts.map((contact) => (
                        <ContactCard key={contact.id} contact={contact} compact />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No contacts on file</p>
                      <Link
                        href={`/families/${student.id}`}
                        className="inline-flex items-center gap-1 mt-2 text-sm text-purple-600 hover:text-purple-700"
                      >
                        <Plus className="h-3 w-3" />
                        Add contact
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
