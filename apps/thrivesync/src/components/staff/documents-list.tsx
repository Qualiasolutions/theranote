'use client'

import { formatDate } from '@/lib/utils'
import type { StaffDocument } from '@repo/database'
import { FileText, ExternalLink, Download, FolderOpen } from 'lucide-react'

interface DocumentsListProps {
  documents: StaffDocument[]
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  offer_letter: 'Offer Letter',
  contract: 'Employment Contract',
  handbook_acknowledgment: 'Handbook Acknowledgment',
  w4: 'W-4 Form',
  i9: 'I-9 Form',
  direct_deposit: 'Direct Deposit',
  emergency_contact: 'Emergency Contact',
  confidentiality: 'Confidentiality Agreement',
  background_consent: 'Background Check Consent',
  policy_acknowledgment: 'Policy Acknowledgment',
  performance_review: 'Performance Review',
  disciplinary: 'Disciplinary Action',
  other: 'Other Document',
}

const DOCUMENT_TYPE_COLORS: Record<string, string> = {
  offer_letter: 'bg-blue-100 text-blue-700',
  contract: 'bg-purple-100 text-purple-700',
  handbook_acknowledgment: 'bg-green-100 text-green-700',
  w4: 'bg-gray-100 text-gray-700',
  i9: 'bg-gray-100 text-gray-700',
  performance_review: 'bg-amber-100 text-amber-700',
  disciplinary: 'bg-red-100 text-red-700',
}

export function DocumentsList({ documents }: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FolderOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No documents on file</p>
        <p className="text-xs text-gray-400 mt-1">Upload HR documents to track here</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const typeLabel = DOCUMENT_TYPE_LABELS[doc.document_type || 'other'] || doc.document_type || 'Document'
        const typeColor = DOCUMENT_TYPE_COLORS[doc.document_type || ''] || 'bg-gray-100 text-gray-700'

        return (
          <div
            key={doc.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border hover:bg-gray-100 transition-colors"
          >
            <div className="rounded-lg bg-purple-100 p-2">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeColor}`}>
                  {typeLabel}
                </span>
                {doc.created_at && (
                  <span className="text-xs text-gray-400">
                    {formatDate(doc.created_at)}
                  </span>
                )}
              </div>
            </div>
            {doc.document_url && (
              <a
                href={doc.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                title="View document"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
