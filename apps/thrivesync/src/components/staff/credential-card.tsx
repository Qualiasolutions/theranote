'use client'

import { formatDate, getDaysUntil } from '@/lib/utils'
import type { StaffCredential } from '@repo/database'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ExternalLink,
} from 'lucide-react'

interface CredentialCardProps {
  credential: StaffCredential
  compact?: boolean
}

const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
  fingerprint: 'Fingerprint Clearance',
  medical: 'Medical Clearance',
  scr: 'SCR Clearance',
  mandated_reporter: 'Mandated Reporter',
  cpr_first_aid: 'CPR/First Aid',
  license: 'Professional License',
  certification: 'Certification',
  training: 'Training',
  background_check: 'Background Check',
  other: 'Other',
}

function getCredentialStatusInfo(credential: StaffCredential) {
  const { status, expiration_date } = credential

  // Check if explicitly set to expired or inactive
  if (status === 'expired' || status === 'inactive') {
    return {
      label: status === 'expired' ? 'Expired' : 'Inactive',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      icon: status === 'expired' ? AlertTriangle : XCircle,
    }
  }

  // Check expiration date
  if (expiration_date) {
    const daysUntil = getDaysUntil(expiration_date)

    if (daysUntil < 0) {
      return {
        label: 'Expired',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: AlertTriangle,
        daysUntil,
      }
    }

    if (daysUntil <= 30) {
      return {
        label: `Expires in ${daysUntil} days`,
        color: 'amber',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        icon: Clock,
        daysUntil,
      }
    }

    if (daysUntil <= 90) {
      return {
        label: `Expires in ${daysUntil} days`,
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        icon: Clock,
        daysUntil,
      }
    }
  }

  // Active
  return {
    label: 'Active',
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    icon: CheckCircle,
  }
}

export function CredentialCard({ credential, compact = false }: CredentialCardProps) {
  const statusInfo = getCredentialStatusInfo(credential)
  const Icon = statusInfo.icon
  const typeLabel = CREDENTIAL_TYPE_LABELS[credential.credential_type] || credential.credential_type

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between rounded-lg border p-3 ${statusInfo.bgColor} ${statusInfo.borderColor}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${statusInfo.textColor}`} />
          <span className="text-sm font-medium text-gray-900">
            {credential.credential_name}
          </span>
        </div>
        <span className={`text-xs font-medium ${statusInfo.textColor}`}>
          {statusInfo.label}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg border p-4 transition-all hover:shadow-md ${statusInfo.bgColor} ${statusInfo.borderColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {typeLabel}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 mt-1">
            {credential.credential_name}
          </h4>

          <div className="mt-3 space-y-1">
            {credential.issued_date && (
              <p className="text-xs text-gray-500">
                Issued: {formatDate(credential.issued_date)}
              </p>
            )}
            {credential.expiration_date && (
              <p className="text-xs text-gray-500">
                Expires: {formatDate(credential.expiration_date)}
              </p>
            )}
          </div>

          {credential.notes && (
            <p className="mt-2 text-xs text-gray-500 line-clamp-2">
              {credential.notes}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}
          >
            <Icon className="h-3 w-3" />
            {statusInfo.label}
          </div>

          {credential.document_url && (
            <a
              href={credential.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
            >
              <FileText className="h-3 w-3" />
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// Status badge component for use in tables
export function CredentialStatusBadge({ credential }: { credential: StaffCredential }) {
  const statusInfo = getCredentialStatusInfo(credential)
  const Icon = statusInfo.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}
    >
      <Icon className="h-3 w-3" />
      {statusInfo.label}
    </span>
  )
}
