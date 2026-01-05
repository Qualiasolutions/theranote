'use client'

import { useState } from 'react'
import Link from 'next/link'
import { School, Users, CheckCircle, AlertTriangle, ClipboardList, Check } from 'lucide-react'
import { DailyLogForm } from '@/components/classrooms/daily-log-form'
import type { Classroom, DailyLog } from '@repo/database'

interface ProcessedClassroom extends Classroom {
  studentCount: number
  staffCount: number
  ratioMet: boolean
  hasTodayLog: boolean
  todayLog?: DailyLog
}

interface ClassroomCardProps {
  classroom: ProcessedClassroom
}

export function ClassroomCard({ classroom }: ClassroomCardProps) {
  const [showDailyLogForm, setShowDailyLogForm] = useState(false)

  const capacityPercentage = classroom.capacity
    ? Math.min(100, (classroom.studentCount / classroom.capacity) * 100)
    : 0

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <School className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{classroom.name}</h3>
              <p className="text-sm text-gray-500">{classroom.room_type || 'General'}</p>
            </div>
          </div>
          {classroom.ratioMet ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Students with capacity bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Students</span>
              <span className="text-sm font-medium">
                {classroom.studentCount} / {classroom.capacity || '?'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
          </div>

          {/* Staff count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Staff</span>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{classroom.staffCount}</span>
            </div>
          </div>

          {/* Current Ratio */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Ratio</span>
            <span
              className={`text-sm font-medium ${
                classroom.ratioMet ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {classroom.staffCount > 0
                ? `${classroom.staffCount}:${classroom.studentCount}`
                : 'N/A'}
              {classroom.ratio_requirement && (
                <span className="text-gray-400 font-normal ml-1">
                  (req: {classroom.ratio_requirement})
                </span>
              )}
            </span>
          </div>

          {/* Today's Log Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Today&apos;s Log</span>
            {classroom.hasTodayLog ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                <Check className="h-3 w-3" />
                Completed
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                Pending
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex gap-2">
          <Link
            href={`/classrooms/${classroom.id}`}
            className="flex-1 text-center text-sm text-purple-600 hover:text-purple-700 font-medium py-2 hover:bg-purple-50 rounded-lg transition-colors"
          >
            View Roster
          </Link>
          <button
            onClick={() => setShowDailyLogForm(true)}
            className="flex-1 text-center text-sm text-gray-600 hover:text-gray-700 font-medium py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <ClipboardList className="h-4 w-4" />
            Daily Log
          </button>
        </div>
      </div>

      {/* Daily Log Modal */}
      {showDailyLogForm && (
        <DailyLogForm
          classroomId={classroom.id}
          classroomName={classroom.name}
          ratioRequirement={classroom.ratio_requirement}
          onClose={() => setShowDailyLogForm(false)}
        />
      )}
    </>
  )
}
