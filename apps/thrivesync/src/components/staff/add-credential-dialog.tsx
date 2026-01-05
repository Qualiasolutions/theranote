'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@repo/database'
import { Plus, X, Loader2, Upload, Calendar, FileText } from 'lucide-react'

interface AddCredentialDialogProps {
  staff: Profile[]
  defaultStaffId?: string
}

const CREDENTIAL_TYPES = [
  { value: 'fingerprint', label: 'DOE Fingerprint Clearance' },
  { value: 'medical', label: 'Medical Clearance' },
  { value: 'scr', label: 'SCR Clearance' },
  { value: 'mandated_reporter', label: 'Mandated Reporter Training' },
  { value: 'cpr_first_aid', label: 'CPR/First Aid Certification' },
  { value: 'license', label: 'Professional License' },
  { value: 'certification', label: 'Certification' },
  { value: 'training', label: 'Training Certificate' },
  { value: 'background_check', label: 'Background Check' },
  { value: 'other', label: 'Other' },
]

export function AddCredentialDialog({ staff, defaultStaffId }: AddCredentialDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    profile_id: defaultStaffId || '',
    credential_type: '',
    credential_name: '',
    issued_date: '',
    expiration_date: '',
    notes: '',
    document_url: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.profile_id || !formData.credential_type || !formData.credential_name) {
      setError('Please fill in all required fields')
      return
    }

    startTransition(async () => {
      try {
        const { error: insertError } = await supabase
          .from('staff_credentials')
          .insert({
            profile_id: formData.profile_id,
            credential_type: formData.credential_type,
            credential_name: formData.credential_name,
            issued_date: formData.issued_date || null,
            expiration_date: formData.expiration_date || null,
            notes: formData.notes || null,
            document_url: formData.document_url || null,
            status: 'active',
          } as never)

        if (insertError) {
          console.error('Error adding credential:', insertError)
          setError(insertError.message)
          return
        }

        // Reset form and close dialog
        setFormData({
          profile_id: defaultStaffId || '',
          credential_type: '',
          credential_name: '',
          issued_date: '',
          expiration_date: '',
          notes: '',
          document_url: '',
        })
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
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Auto-populate credential name based on type
    if (name === 'credential_type' && !formData.credential_name) {
      const type = CREDENTIAL_TYPES.find((t) => t.value === value)
      if (type) {
        setFormData((prev) => ({ ...prev, credential_name: type.label }))
      }
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Credential
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Add Credential</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
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

              {/* Staff Member (only if not pre-selected) */}
              {!defaultStaffId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="profile_id"
                    value={formData.profile_id}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Select staff member...</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Credential Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credential Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="credential_type"
                  value={formData.credential_type}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select type...</option>
                  {CREDENTIAL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Credential Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credential Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="credential_name"
                  value={formData.credential_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., NYS Teaching License"
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline h-3.5 w-3.5 mr-1" />
                    Issue Date
                  </label>
                  <input
                    type="date"
                    name="issued_date"
                    value={formData.issued_date}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline h-3.5 w-3.5 mr-1" />
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Document URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Upload className="inline h-3.5 w-3.5 mr-1" />
                  Document URL
                </label>
                <input
                  type="url"
                  name="document_url"
                  value={formData.document_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Link to the scanned credential document
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Additional notes about this credential..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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
                      Add Credential
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
