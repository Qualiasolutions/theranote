'use client'

import { AlertTriangle, Clock, FileText, CheckCircle, X } from 'lucide-react'
import { cn, formatRelative, getDaysUntil, formatDate } from '@/lib/utils'
import type { ComplianceAlert } from '@repo/database/types'

interface AlertCardProps {
  alert: ComplianceAlert & {
    compliance_item?: { item_name: string; category: string } | null
  }
  onResolve?: (id: string) => void
  onDismiss?: (id: string) => void
  className?: string
}

export function AlertCard({ alert, onResolve, onDismiss, className }: AlertCardProps) {
  const severity = alert.severity || 'info'

  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      badge: 'bg-red-100 text-red-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: Clock,
      iconColor: 'text-amber-500',
      badge: 'bg-amber-100 text-amber-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: FileText,
      iconColor: 'text-blue-500',
      badge: 'bg-blue-100 text-blue-700',
    },
  }

  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.info
  const Icon = config.icon

  // Calculate due date display
  const getDueDateDisplay = () => {
    if (!alert.due_date) return null
    const days = getDaysUntil(alert.due_date)
    if (days < 0) return `Expired ${Math.abs(days)} days ago`
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  const dueDateDisplay = getDueDateDisplay()

  return (
    <div
      className={cn(
        'flex items-start justify-between p-4 rounded-lg border transition-all',
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconColor)} />
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{alert.title}</p>
          {alert.description && (
            <p className="text-sm text-gray-600 mt-0.5">{alert.description}</p>
          )}
          {alert.compliance_item && (
            <p className="text-xs text-gray-500 mt-1">
              {alert.compliance_item.category} - {alert.compliance_item.item_name}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {dueDateDisplay && (
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded',
                  config.badge
                )}
              >
                {dueDateDisplay}
              </span>
            )}
            {alert.created_at && (
              <span className="text-xs text-gray-400">
                Created {formatRelative(alert.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
        {onResolve && !alert.resolved && (
          <button
            onClick={() => onResolve(alert.id)}
            className="p-1.5 rounded-md text-green-600 hover:bg-green-100 transition-colors"
            title="Mark as resolved"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Compact version for lists
export function AlertCardCompact({
  alert,
  className,
}: {
  alert: ComplianceAlert
  className?: string
}) {
  const severity = alert.severity || 'info'

  const severityConfig = {
    critical: { dot: 'bg-red-500', text: 'text-red-700' },
    warning: { dot: 'bg-amber-500', text: 'text-amber-700' },
    info: { dot: 'bg-blue-500', text: 'text-blue-700' },
  }

  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.info

  return (
    <div className={cn('flex items-center gap-3 py-2', className)}>
      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', config.dot)} />
      <span className={cn('text-sm font-medium', config.text)}>{alert.title}</span>
      {alert.due_date && (
        <span className="text-xs text-gray-400 ml-auto">
          {formatDate(alert.due_date)}
        </span>
      )}
    </div>
  )
}
