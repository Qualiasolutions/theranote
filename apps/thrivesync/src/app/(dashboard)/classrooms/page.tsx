import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { School, AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { ClassroomCard } from './classroom-card'
import { AddClassroomDialog } from '@/components/classrooms/add-classroom-dialog'

// Calculate if ratio is met
function calculateRatioMet(
  staffCount: number,
  studentCount: number,
  ratioRequirement: string | null
): boolean {
  if (!ratioRequirement || staffCount === 0) return false
  const parts = ratioRequirement.split(':')
  if (parts.length !== 2) return false
  const staffRequired = parseInt(parts[0], 10)
  const studentsPerStaff = parseInt(parts[1], 10)
  if (isNaN(staffRequired) || isNaN(studentsPerStaff)) return false
  const maxStudents = staffCount * (studentsPerStaff / staffRequired)
  return studentCount <= maxStudents
}

export default async function ClassroomsPage() {
  const supabase = await createClient()

  // Fetch classrooms with related counts
  const { data: classrooms, error } = await supabase
    .from('classrooms')
    .select(`
      *,
      classroom_assignments!left(id, student_id),
      classroom_staff!left(id, profile_id)
    `)
    .eq('status', 'active')
    .order('name') as {
      data: Array<{
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
        classroom_assignments?: Array<{ id: string; student_id: string }>
        classroom_staff?: Array<{ id: string; profile_id: string }>
      }> | null
      error: Error | null
    }

  // Get today's date for fetching latest logs
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's logs for all classrooms
  const { data: todayLogs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('log_date', today) as {
      data: Array<{
        id: string
        classroom_id: string | null
        log_date: string
        headcount: number | null
        staff_count: number | null
        health_check_completed: boolean | null
        safety_check_completed: boolean | null
        temperature_logged: boolean | null
        ratio_met: boolean | null
        notes: string | null
        org_id: string | null
        created_at: string | null
        created_by: string | null
        updated_at: string | null
      }> | null
    }

  // Create a map of classroom_id to today's log
  const logsMap = new Map(todayLogs?.map(log => [log.classroom_id, log]) || [])

  // Process classrooms with counts and ratio status
  const processedClassrooms = classrooms?.map(classroom => {
    const studentCount = classroom.classroom_assignments?.length || 0
    const staffCount = classroom.classroom_staff?.length || 0
    const todayLog = logsMap.get(classroom.id)
    const ratioMet = calculateRatioMet(staffCount, studentCount, classroom.ratio_requirement)

    return {
      ...classroom,
      studentCount,
      staffCount,
      ratioMet,
      hasTodayLog: !!todayLog,
      todayLog,
    }
  }) || []

  // Calculate stats
  const totalClassrooms = processedClassrooms.length
  const classroomsWithRatioMet = processedClassrooms.filter(c => c.ratioMet).length
  const classroomsWithLogs = processedClassrooms.filter(c => c.hasTodayLog).length

  // Get unique room types for filter buttons
  const roomTypes = [...new Set(processedClassrooms.map(c => c.room_type).filter(Boolean))]

  return (
    <>
      <Header
        title="Classrooms"
        subtitle="Manage classroom rosters, ratios, and daily operations"
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/classrooms"
              className="flex items-center gap-2 h-10 px-4 rounded-lg border bg-purple-50 border-purple-200 text-purple-700 text-sm font-medium"
            >
              All Rooms
            </Link>
            {roomTypes.map(type => (
              <button
                key={type}
                className="flex items-center gap-2 h-10 px-4 rounded-lg border bg-white text-sm hover:bg-gray-50"
              >
                {type}
              </button>
            ))}
          </div>
          <AddClassroomDialog />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <School className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Classrooms</p>
                <p className="text-xl font-bold">{totalClassrooms}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ratios Met</p>
                <p className="text-xl font-bold">
                  {classroomsWithRatioMet} / {totalClassrooms}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Daily Logs Today</p>
                <p className="text-xl font-bold">
                  {classroomsWithLogs} / {totalClassrooms}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Classroom Grid */}
        {error ? (
          <div className="rounded-xl bg-red-50 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">Failed to load classrooms</p>
            <p className="text-sm text-red-500">{error.message}</p>
          </div>
        ) : processedClassrooms.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-12 text-center">
            <School className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No classrooms yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Get started by adding your first classroom
            </p>
            <AddClassroomDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {processedClassrooms.map((room) => (
              <ClassroomCard
                key={room.id}
                classroom={room}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
