'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Check, AlertCircle, Loader2 } from 'lucide-react'

interface DailyLogFormProps {
  classroomId: string
  classroomName: string
  ratioRequirement: string | null
  onClose: () => void
  onSuccess?: () => void
}

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

export function DailyLogForm({
  classroomId,
  classroomName,
  ratioRequirement,
  onClose,
  onSuccess,
}: DailyLogFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [headcount, setHeadcount] = useState<number>(0)
  const [staffCount, setStaffCount] = useState<number>(0)
  const [healthCheckCompleted, setHealthCheckCompleted] = useState(false)
  const [safetyCheckCompleted, setSafetyCheckCompleted] = useState(false)
  const [temperatureLogged, setTemperatureLogged] = useState(false)
  const [notes, setNotes] = useState('')

  const ratioMet = calculateRatioMet(staffCount, headcount, ratioRequirement)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError('You must be logged in to submit a daily log')
          return
        }

        const { error: insertError } = await supabase
          .from('daily_logs')
          .insert({
            classroom_id: classroomId,
            log_date: new Date().toISOString().split('T')[0],
            headcount,
            staff_count: staffCount,
            ratio_met: ratioMet,
            health_check_completed: healthCheckCompleted,
            safety_check_completed: safetyCheckCompleted,
            temperature_logged: temperatureLogged,
            notes: notes || null,
            created_by: user.id,
          } as never)

        if (insertError) {
          console.error('Insert error:', insertError)
          setError(insertError.message)
          return
        }

        router.refresh()
        onSuccess?.()
        onClose()
      } catch (err) {
        console.error('Submit error:', err)
        setError('Failed to submit daily log')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Daily Log</h2>
            <p className="text-sm text-gray-500">{classroomName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Headcount and Staff Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Headcount
              </label>
              <input
                type="number"
                min="0"
                value={headcount}
                onChange={(e) => setHeadcount(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff Count
              </label>
              <input
                type="number"
                min="0"
                value={staffCount}
                onChange={(e) => setStaffCount(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          {/* Ratio Status */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Current Ratio</p>
                <p className="text-xs text-gray-500">Required: {ratioRequirement || 'Not set'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {staffCount > 0 ? `${staffCount}:${headcount}` : 'N/A'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    ratioMet
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {ratioMet ? (
                    <>
                      <Check className="h-3 w-3" /> Met
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" /> Not Met
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Health & Safety Checks */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Health & Safety Checks</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={healthCheckCompleted}
                onChange={(e) => setHealthCheckCompleted(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Health screenings completed</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={safetyCheckCompleted}
                onChange={(e) => setSafetyCheckCompleted(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Safety inspection completed</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={temperatureLogged}
                onChange={(e) => setTemperatureLogged(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Temperatures logged</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              placeholder="Any additional notes about today..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Daily Log'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
