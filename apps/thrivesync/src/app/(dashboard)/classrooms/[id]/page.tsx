import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  School,
  Users,
  UserCheck,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Thermometer,
  Shield,
  Heart,
  ClipboardList,
} from 'lucide-react'
import { RatioIndicator } from '@/components/classrooms/ratio-indicator'
import { ClassroomActions } from './classroom-actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClassroomDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch classroom with students and staff
  const { data: classroom, error } = await supabase
    .from('classrooms')
    .select(`
      *,
      classroom_assignments(
        id,
        start_date,
        end_date,
        student:students(id, first_name, last_name, date_of_birth, status)
      ),
      classroom_staff(
        id,
        role,
        start_date,
        profile:profiles(id, full_name, email, discipline)
      )
    `)
    .eq('id', id)
    .single() as {
      data: {
        id: string
        name: string
        site_id: string | null
        org_id: string | null
        capacity: number | null
        ratio_requirement: string | null
        room_type: string | null
        square_footage: number | null
        status: string | null
        created_at: string | null
        updated_at: string | null
        classroom_assignments?: Array<{
          id: string
          start_date: string | null
          end_date: string | null
          student: {
            id: string
            first_name: string
            last_name: string
            date_of_birth: string | null
            status: string
          } | null
        }>
        classroom_staff?: Array<{
          id: string
          role: string | null
          start_date: string | null
          profile: {
            id: string
            full_name: string
            email: string
            discipline: string | null
          } | null
        }>
      } | null
      error: Error | null
    }

  if (error || !classroom) {
    notFound()
  }

  // Fetch daily logs for this classroom (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: dailyLogs } = await supabase
    .from('daily_logs')
    .select(`
      *,
      created_by_profile:profiles!daily_logs_created_by_fkey(full_name)
    `)
    .eq('classroom_id', id)
    .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('log_date', { ascending: false })
    .limit(30) as {
      data: Array<{
        id: string
        log_date: string
        student_count: number | null
        staff_count: number | null
        health_safety_check: boolean | null
        ratio_met: boolean | null
        notes: string | null
        created_by: string | null
        created_by_profile: { full_name: string } | null
      }> | null
    }

  const students = classroom.classroom_assignments
    ?.map((a: any) => a.student)
    .filter((s: any) => s !== null) || []

  const staff = classroom.classroom_staff
    ?.map((s: any) => ({ ...s.profile, role: s.role }))
    .filter((s: any) => s !== null) || []

  const studentCount = students.length
  const staffCount = staff.length

  // Calculate ratio met status
  function calculateRatioMet(): boolean {
    if (!classroom || !classroom.ratio_requirement || staffCount === 0) return false
    const parts = classroom.ratio_requirement.split(':')
    if (parts.length !== 2) return false
    const staffRequired = parseInt(parts[0], 10)
    const studentsPerStaff = parseInt(parts[1], 10)
    if (isNaN(staffRequired) || isNaN(studentsPerStaff)) return false
    const maxStudents = staffCount * (studentsPerStaff / staffRequired)
    return studentCount <= maxStudents
  }

  const ratioMet = calculateRatioMet()

  // Check if today's log exists
  const today = new Date().toISOString().split('T')[0]
  const todayLog = dailyLogs?.find(log => log.log_date === today)

  return (
    <>
      <Header
        title={classroom.name}
        subtitle={`${classroom.room_type || 'Classroom'} - Capacity: ${classroom.capacity || 'Not set'}`}
      />

      <div className="p-6 space-y-6">
        {/* Back link */}
        <Link
          href="/classrooms"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classrooms
        </Link>

        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Students</p>
                <p className="text-xl font-bold">{studentCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Staff</p>
                <p className="text-xl font-bold">{staffCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${ratioMet ? 'bg-green-100' : 'bg-red-100'}`}>
                {ratioMet ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Ratio</p>
                <RatioIndicator
                  staffCount={staffCount}
                  studentCount={studentCount}
                  ratioRequirement={classroom.ratio_requirement}
                  showLabel={false}
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${todayLog ? 'bg-green-100' : 'bg-amber-100'}`}>
                <ClipboardList className={`h-5 w-5 ${todayLog ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Log</p>
                <p className={`text-sm font-medium ${todayLog ? 'text-green-600' : 'text-amber-600'}`}>
                  {todayLog ? 'Completed' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <ClassroomActions
          classroomId={classroom.id}
          classroomName={classroom.name}
          ratioRequirement={classroom.ratio_requirement}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Students List */}
          <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Enrolled Students ({studentCount})
              </h2>
            </div>
            {students.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No students assigned</p>
              </div>
            ) : (
              <ul className="divide-y">
                {students.map((student: any) => (
                  <li key={student.id} className="px-6 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            DOB: {new Date(student.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {student.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Staff List */}
          <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Assigned Staff ({staffCount})
              </h2>
            </div>
            {staff.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <UserCheck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No staff assigned</p>
              </div>
            ) : (
              <ul className="divide-y">
                {staff.map((member: any) => (
                  <li key={member.id} className="px-6 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {member.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {member.discipline || member.role || 'Staff'}
                          </p>
                        </div>
                      </div>
                      {member.role && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {member.role}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Daily Logs History */}
        <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Daily Logs History
            </h2>
          </div>
          {!dailyLogs || dailyLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No daily logs recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Headcount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ratio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Checks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Logged By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dailyLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(log.log_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{log.headcount ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{log.staff_count ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            log.ratio_met
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {log.ratio_met ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {log.staff_count}:{log.headcount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            title="Health Check"
                            className={`p-1 rounded ${
                              log.health_check_completed
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Heart className="h-3.5 w-3.5" />
                          </span>
                          <span
                            title="Safety Check"
                            className={`p-1 rounded ${
                              log.safety_check_completed
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Shield className="h-3.5 w-3.5" />
                          </span>
                          <span
                            title="Temperature Logged"
                            className={`p-1 rounded ${
                              log.temperature_logged
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Thermometer className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {log.created_by_profile?.full_name || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export const dynamic = 'force-dynamic'
