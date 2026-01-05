import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ContactCard } from '@/components/families/contact-card'
import { AddContactForm } from '@/components/families/add-contact-form'
import { CommunicationLog } from '@/components/families/communication-log'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Users2,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertTriangle,
  User,
} from 'lucide-react'
import type { Student, FamilyContact, FamilyCommunication, Profile } from '@repo/database'
import { formatDate } from '@/lib/utils'

type StudentWithContacts = Student & {
  family_contacts: FamilyContact[]
}

type CommunicationWithRelations = FamilyCommunication & {
  family_contacts: FamilyContact | null
  profiles: Profile | null
}

export default async function StudentFamilyPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const supabase = await createClient()

  // Fetch student with family contacts
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      family_contacts (*)
    `)
    .eq('id', studentId)
    .single()

  if (studentError || !studentData) {
    notFound()
  }

  const student = studentData as unknown as StudentWithContacts
  const contacts = student.family_contacts || []

  // Fetch communication history for this student
  const { data: communicationsData } = await supabase
    .from('family_communications')
    .select(`
      *,
      family_contacts (*),
      profiles:logged_by (*)
    `)
    .eq('student_id', studentId)
    .order('communication_date', { ascending: false })
    .limit(20)

  const communications = (communicationsData as unknown as CommunicationWithRelations[]) || []

  // Calculate stats
  const primaryContact = contacts.find((c) => c.is_primary)
  const emergencyContacts = contacts.filter((c) => c.is_emergency_contact)
  const totalCommunications = communications.length
  const pendingFollowUps = communications.filter(
    (c) => c.follow_up_required && !c.outcome
  ).length

  return (
    <>
      <Header
        title={`${student.first_name} ${student.last_name}`}
        subtitle="Family contacts and communication history"
      />

      <div className="p-6 space-y-6">
        {/* Back link */}
        <Link
          href="/families"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Families
        </Link>

        {/* Student Info Card */}
        <div className="rounded-xl bg-white shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">
                  {student.first_name[0]}
                  {student.last_name[0]}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {student.first_name} {student.last_name}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    DOB: {formatDate(student.date_of_birth)}
                  </span>
                  {student.external_id && (
                    <span className="flex items-center gap-1">
                      ID: {student.external_id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users2 className="h-4 w-4" />
                    {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {totalCommunications} communication
                    {totalCommunications !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {primaryContact && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <User className="h-4 w-4" />
                  Primary: {primaryContact.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contacts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Family Contacts */}
            <div className="rounded-xl bg-white shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Family Contacts</h3>
                </div>
                <AddContactForm studentId={studentId} />
              </div>

              {contacts.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {contacts.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No contacts on file</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add a family contact to get started
                  </p>
                </div>
              )}
            </div>

            {/* Quick Contact Summary */}
            {emergencyContacts.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">
                    Emergency Contacts
                  </h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {emergencyContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {contact.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {contact.relationship}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Communication History */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="rounded-xl bg-white shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Communication Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Communications</span>
                  <span className="font-semibold">{totalCommunications}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Pending Follow-ups</span>
                  <span
                    className={`font-semibold ${
                      pendingFollowUps > 0 ? 'text-amber-600' : 'text-green-600'
                    }`}
                  >
                    {pendingFollowUps}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Emergency Contacts</span>
                  <span className="font-semibold">{emergencyContacts.length}</span>
                </div>
              </div>
            </div>

            {/* Communication Log */}
            <div className="rounded-xl bg-white shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Recent Communications</h3>
              </div>
              <CommunicationLog
                communications={communications}
                studentId={studentId}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
