'use client'

import { AlertCircle, AlertTriangle, Info, ChevronRight, Shield, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from '@/components/ui/motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { ComplianceViolation } from '@/lib/compliance/rules'

interface ComplianceAlertsProps {
  violations: ComplianceViolation[]
  complianceScore: number
  showAll?: boolean
}

const typeConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-500',
  },
}

function ComplianceScoreBadge({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-green-600'
    if (score >= 70) return 'from-amber-500 to-yellow-600'
    return 'from-red-500 to-rose-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Needs Attention'
    return 'Critical'
  }

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'relative w-16 h-16 rounded-full bg-gradient-to-br p-[3px]',
        getScoreColor(score)
      )}>
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <span className="text-xl font-bold">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
        <p className={cn(
          'font-semibold',
          score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-red-600'
        )}>
          {getScoreLabel(score)}
        </p>
      </div>
    </div>
  )
}

function ViolationItem({ violation, index }: { violation: ComplianceViolation; index: number }) {
  const config = typeConfig[violation.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', config.textColor)}>
          {violation.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {violation.rule}
        </p>
      </div>
      {violation.sessionId && (
        <Link href={`/sessions/${violation.sessionId}`}>
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </motion.div>
  )
}

export function ComplianceAlerts({ violations, complianceScore, showAll = false }: ComplianceAlertsProps) {
  const displayViolations = showAll ? violations : violations.slice(0, 5)
  const hasMore = violations.length > 5 && !showAll

  const criticalCount = violations.filter(v => v.type === 'critical').length
  const warningCount = violations.filter(v => v.type === 'warning').length

  if (violations.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">All Clear!</p>
              <p className="text-sm text-emerald-700">
                No compliance issues detected. Keep up the great work!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Compliance Alerts</CardTitle>
          </div>
          <ComplianceScoreBadge score={complianceScore} />
        </div>
        <CardDescription className="flex items-center gap-4 mt-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {warningCount} warnings
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayViolations.map((violation, index) => (
          <ViolationItem key={violation.id} violation={violation} index={index} />
        ))}

        {hasMore && (
          <Link href="/admin/compliance">
            <Button variant="ghost" className="w-full mt-2">
              View all {violations.length} alerts
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact version for sidebar or header
 */
export function ComplianceStatusBadge({
  criticalCount,
  warningCount,
}: {
  criticalCount: number
  warningCount: number
}) {
  if (criticalCount === 0 && warningCount === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
        <CheckCircle2 className="h-3 w-3" />
        Compliant
      </div>
    )
  }

  if (criticalCount > 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
        <AlertCircle className="h-3 w-3" />
        {criticalCount} Critical
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
      <AlertTriangle className="h-3 w-3" />
      {warningCount} Warning{warningCount > 1 ? 's' : ''}
    </div>
  )
}
