'use client'

import { useState } from 'react'
import { ClipboardList, Plus, Settings } from 'lucide-react'
import { DailyLogForm } from '@/components/classrooms/daily-log-form'

interface ClassroomActionsProps {
  classroomId: string
  classroomName: string
  ratioRequirement: string | null
}

export function ClassroomActions({
  classroomId,
  classroomName,
  ratioRequirement,
}: ClassroomActionsProps) {
  const [showDailyLogForm, setShowDailyLogForm] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowDailyLogForm(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
        >
          <ClipboardList className="h-4 w-4" />
          Add Daily Log
        </button>
        <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border bg-white text-gray-700 text-sm font-medium hover:bg-gray-50">
          <Plus className="h-4 w-4" />
          Assign Student
        </button>
        <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border bg-white text-gray-700 text-sm font-medium hover:bg-gray-50">
          <Plus className="h-4 w-4" />
          Assign Staff
        </button>
        <button className="ml-auto inline-flex items-center gap-2 h-10 px-4 rounded-lg border bg-white text-gray-700 text-sm font-medium hover:bg-gray-50">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {showDailyLogForm && (
        <DailyLogForm
          classroomId={classroomId}
          classroomName={classroomName}
          ratioRequirement={ratioRequirement}
          onClose={() => setShowDailyLogForm(false)}
        />
      )}
    </>
  )
}
