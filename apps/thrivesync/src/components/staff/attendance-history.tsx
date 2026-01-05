'use client'

import { formatDate } from '@/lib/utils'
import type { StaffAttendance } from '@repo/database'
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react'

interface AttendanceHistoryProps {
  attendance: StaffAttendance[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  present: { label: 'Present', icon: CheckCircle, color: 'text-green-600' },
  absent: { label: 'Absent', icon: XCircle, color: 'text-red-600' },
  late: { label: 'Late', icon: AlertCircle, color: 'text-amber-600' },
  early_departure: { label: 'Early Leave', icon: Clock, color: 'text-orange-600' },
}

function formatTime(time: string | null) {
  if (!time) return '-'
  try {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  } catch {
    return time
  }
}

export function AttendanceHistory({ attendance }: AttendanceHistoryProps) {
  if (attendance.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No attendance records</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {attendance.map((record) => {
        const status = record.status || 'present'
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.present
        const Icon = config.icon

        return (
          <div
            key={record.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border"
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(record.attendance_date)}
                </p>
                <p className="text-xs text-gray-500">
                  {record.clock_in && record.clock_out
                    ? `${formatTime(record.clock_in)} - ${formatTime(record.clock_out)}`
                    : record.clock_in
                    ? `In: ${formatTime(record.clock_in)}`
                    : 'No time recorded'}
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                status === 'present'
                  ? 'bg-green-100 text-green-700'
                  : status === 'absent'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {config.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
