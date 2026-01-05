'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FamilyContact, FamilyCommunication, Profile } from '@repo/database'
import { formatDate, formatRelative } from '@/lib/utils'
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Plus,
  X,
  Loader2,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-react'

type CommunicationWithRelations = FamilyCommunication & {
  family_contacts: FamilyContact | null
  profiles: Profile | null
}

interface CommunicationLogProps {
  communications: CommunicationWithRelations[]
  studentId: string
}

const COMMUNICATION_TYPES = [
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'In-Person Meeting', icon: Users },
  { value: 'note', label: 'Internal Note', icon: FileText },
  { value: 'text', label: 'Text Message', icon: MessageSquare },
]

const DIRECTION_OPTIONS = [
  { value: 'outbound', label: 'Outbound (We contacted them)' },
  { value: 'inbound', label: 'Inbound (They contacted us)' },
]

function getCommunicationIcon(type: string | null) {
  const commType = COMMUNICATION_TYPES.find((t) => t.value === type)
  return commType?.icon || MessageSquare
}

function getCommunicationLabel(type: string | null) {
  const commType = COMMUNICATION_TYPES.find((t) => t.value === type)
  return commType?.label || type || 'Communication'
}

export function CommunicationLog({ communications, studentId }: CommunicationLogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    communication_type: 'phone',
    direction: 'outbound',
    subject: '',
    content: '',
    outcome: '',
    follow_up_required: false,
    follow_up_date: '',
  })

  const resetForm = () => {
    setFormData({
      communication_type: 'phone',
      direction: 'outbound',
      subject: '',
      content: '',
      outcome: '',
      follow_up_required: false,
      follow_up_date: '',
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.subject || !formData.content) {
      setError('Please fill in subject and content')
      return
    }

    startTransition(async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        const { error: insertError } = await supabase
          .from('family_communications')
          .insert({
            student_id: studentId,
            communication_type: formData.communication_type,
            direction: formData.direction,
            subject: formData.subject,
            content: formData.content,
            outcome: formData.outcome || null,
            follow_up_required: formData.follow_up_required,
            follow_up_date: formData.follow_up_date || null,
            communication_date: new Date().toISOString(),
            logged_by: user?.id || null,
          } as never)

        if (insertError) {
          console.error('Error logging communication:', insertError)
          setError(insertError.message)
          return
        }

        // Reset form and close dialog
        resetForm()
        setIsOpen(false)
        router.refresh()
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
      }
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <div className="space-y-4">
      {/* Add Communication Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-purple-400 hover:text-purple-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Log Communication
      </button>

      {/* Communications List */}
      {communications.length > 0 ? (
        <div className="space-y-3">
          {communications.map((comm) => {
            const Icon = getCommunicationIcon(comm.communication_type)
            return (
              <div
                key={comm.id}
                className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white p-2 border shadow-sm">
                    <Icon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {comm.subject || getCommunicationLabel(comm.communication_type)}
                      </p>
                      {comm.follow_up_required && !comm.outcome && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock className="h-3 w-3" />
                          Follow-up
                        </span>
                      )}
                      {comm.outcome && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </span>
                      )}
                    </div>
                    {comm.content && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {comm.content}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {comm.communication_date
                          ? formatRelative(comm.communication_date)
                          : 'Unknown date'}
                      </span>
                      {comm.profiles && (
                        <span>by {comm.profiles.full_name}</span>
                      )}
                      <span className="capitalize">{comm.direction}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No communications logged</p>
          <p className="text-xs text-gray-400 mt-1">
            Log a call, email, or meeting
          </p>
        </div>
      )}

      {/* Add Communication Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              resetForm()
              setIsOpen(false)
            }}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Log Communication
                </h2>
              </div>
              <button
                onClick={() => {
                  resetForm()
                  setIsOpen(false)
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Type and Direction Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="communication_type"
                    value={formData.communication_type}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {COMMUNICATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direction <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="direction"
                    value={formData.direction}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {DIRECTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Attendance follow-up"
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Describe the communication..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outcome / Resolution
                </label>
                <input
                  type="text"
                  name="outcome"
                  value={formData.outcome}
                  onChange={handleChange}
                  placeholder="e.g., Parent agreed to schedule meeting"
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Follow-up */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="follow_up_required"
                    checked={formData.follow_up_required}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Follow-up required
                  </span>
                </label>

                {formData.follow_up_required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="inline h-3.5 w-3.5 mr-1" />
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      name="follow_up_date"
                      value={formData.follow_up_date}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setIsOpen(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Log Communication
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
