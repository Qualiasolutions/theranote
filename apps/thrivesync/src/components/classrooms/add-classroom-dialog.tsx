'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X } from 'lucide-react'

const ROOM_TYPES = [
  { value: 'acs', label: 'ACS' },
  { value: 'private', label: 'Private' },
  { value: '4410', label: '4410' },
  { value: 'early_intervention', label: 'Early Intervention' },
  { value: 'cpse', label: 'CPSE' },
  { value: 'general', label: 'General' },
]

const RATIO_OPTIONS = [
  { value: '1:5', label: '1:5 (One staff per 5 children)' },
  { value: '1:6', label: '1:6 (One staff per 6 children)' },
  { value: '1:8', label: '1:8 (One staff per 8 children)' },
  { value: '1:10', label: '1:10 (One staff per 10 children)' },
  { value: '2:12', label: '2:12 (Two staff per 12 children)' },
]

interface AddClassroomDialogProps {
  orgId?: string
}

export function AddClassroomDialog({ orgId }: AddClassroomDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [roomType, setRoomType] = useState('general')
  const [capacity, setCapacity] = useState('')
  const [ratioRequirement, setRatioRequirement] = useState('1:6')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Classroom name is required')
      return
    }

    setLoading(true)

    try {
      const { error: insertError } = await supabase
        .from('classrooms')
        .insert({
          name: name.trim(),
          room_type: roomType,
          capacity: capacity ? parseInt(capacity, 10) : null,
          ratio_requirement: ratioRequirement,
          org_id: orgId || null,
          status: 'active',
        } as never)

      if (insertError) throw insertError

      setOpen(false)
      setName('')
      setRoomType('general')
      setCapacity('')
      setRatioRequirement('1:6')
      router.refresh()
    } catch (err) {
      console.error('Error creating classroom:', err)
      setError('Failed to create classroom. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700"
      >
        <Plus className="h-4 w-4" />
        Add Classroom
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-50 w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Classroom</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classroom Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Room 101, Butterfly Class"
                  className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {ROOM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g., 12"
                    min="1"
                    className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff:Student Ratio
                  </label>
                  <select
                    value={ratioRequirement}
                    onChange={(e) => setRatioRequirement(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {RATIO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
