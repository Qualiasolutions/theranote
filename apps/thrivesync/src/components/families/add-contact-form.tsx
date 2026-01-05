'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Loader2, User, Phone, Mail, Users } from 'lucide-react'

interface AddContactFormProps {
  studentId: string
}

const RELATIONSHIP_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'stepparent', label: 'Stepparent' },
  { value: 'foster_parent', label: 'Foster Parent' },
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'other', label: 'Other' },
]

const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'text', label: 'Text Message' },
  { value: 'email', label: 'Email' },
  { value: 'app', label: 'Parent App' },
]

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Mandarin', label: 'Mandarin' },
  { value: 'Cantonese', label: 'Cantonese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Haitian Creole', label: 'Haitian Creole' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Other', label: 'Other' },
]

export function AddContactForm({ studentId }: AddContactFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    is_primary: false,
    is_emergency_contact: false,
    can_pickup: false,
    preferred_contact_method: 'phone',
    preferred_language: 'English',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      is_primary: false,
      is_emergency_contact: false,
      can_pickup: false,
      preferred_contact_method: 'phone',
      preferred_language: 'English',
      notes: '',
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name || !formData.relationship) {
      setError('Please fill in name and relationship')
      return
    }

    if (!formData.phone && !formData.email) {
      setError('Please provide at least a phone number or email')
      return
    }

    startTransition(async () => {
      try {
        const { error: insertError } = await supabase
          .from('family_contacts')
          .insert({
            student_id: studentId,
            name: formData.name,
            relationship: formData.relationship,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            is_primary: formData.is_primary,
            is_emergency_contact: formData.is_emergency_contact,
            can_pickup: formData.can_pickup,
            preferred_contact_method: formData.preferred_contact_method,
            preferred_language: formData.preferred_language,
            notes: formData.notes || null,
          } as never)

        if (insertError) {
          console.error('Error adding contact:', insertError)
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
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Contact
      </button>

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
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Add Family Contact</h2>
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
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="inline h-3.5 w-3.5 mr-1" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Maria Garcia"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Select relationship...</option>
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Info Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="inline h-3.5 w-3.5 mr-1" />
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(555) 123-4567"
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="inline h-3.5 w-3.5 mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address, city, state, zip"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Preferences Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Contact Method
                    </label>
                    <select
                      name="preferred_contact_method"
                      value={formData.preferred_contact_method}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {CONTACT_METHODS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Language
                    </label>
                    <select
                      name="preferred_language"
                      value={formData.preferred_language}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {LANGUAGES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_primary"
                      checked={formData.is_primary}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Primary Contact
                      </span>
                      <p className="text-xs text-gray-500">
                        Main contact for daily communications
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_emergency_contact"
                      checked={formData.is_emergency_contact}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Emergency Contact
                      </span>
                      <p className="text-xs text-gray-500">
                        Contact in case of emergency
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="can_pickup"
                      checked={formData.can_pickup}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Authorized for Pickup
                      </span>
                      <p className="text-xs text-gray-500">
                        Can pick up child from program
                      </p>
                    </div>
                  </label>
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
                    placeholder="Any additional notes about this contact..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
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
                      Add Contact
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
