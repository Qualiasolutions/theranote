'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2, Calendar, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface EvidenceUploadFormProps {
  itemId: string
  itemName: string
}

export function EvidenceUploadForm({ itemId, itemName }: EvidenceUploadFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const documentUrl = formData.get('document_url') as string
    const evidenceDate = formData.get('evidence_date') as string
    const expirationDate = formData.get('expiration_date') as string
    const notes = formData.get('notes') as string

    if (!documentUrl && !notes) {
      setError('Please provide either a document URL or notes')
      return
    }

    startTransition(async () => {
      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('You must be logged in to upload evidence')
          return
        }

        // Get user profile for org_id
        const { data: profileData } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        const profile = profileData as { organization_id: string | null } | null

        // Create evidence record - use type assertion for insert
        const insertData = {
          compliance_item_id: itemId,
          org_id: profile?.organization_id || null,
          document_url: documentUrl || null,
          evidence_date: evidenceDate || new Date().toISOString().split('T')[0],
          expiration_date: expirationDate || null,
          notes: notes || null,
          status: 'pending',
          uploaded_by: user.id,
        }

        const { error: insertError } = await supabase
          .from('compliance_evidence')
          .insert(insertData as never)

        if (insertError) {
          console.error('Insert error:', insertError)
          setError(insertError.message)
          return
        }

        // Close modal and refresh
        setIsOpen(false)
        router.refresh()
      } catch (err) {
        console.error('Upload error:', err)
        setError('An unexpected error occurred')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
      >
        <Upload className="h-4 w-4" />
        Upload
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Upload Evidence</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Item name */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Compliance Item</p>
                <p className="font-medium text-gray-900">{itemName}</p>
              </div>

              {/* Document URL */}
              <div>
                <label
                  htmlFor="document_url"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  <FileText className="h-4 w-4 inline mr-1" />
                  Document URL
                </label>
                <input
                  type="url"
                  id="document_url"
                  name="document_url"
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link to document in Google Drive, Dropbox, etc.
                </p>
              </div>

              {/* Evidence Date */}
              <div>
                <label
                  htmlFor="evidence_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Evidence Date
                </label>
                <input
                  type="date"
                  id="evidence_date"
                  name="evidence_date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label
                  htmlFor="expiration_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Expiration Date (if applicable)
                </label>
                <input
                  type="date"
                  id="expiration_date"
                  name="expiration_date"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Additional notes about this evidence..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Evidence
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
