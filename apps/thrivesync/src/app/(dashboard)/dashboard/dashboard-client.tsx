'use client'

import Link from 'next/link'
import { motion } from '@/components/ui/motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  Users,
  Building,
  AlertCircle,
  Check,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface StatItem {
  name: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: LucideIcon
}

interface CredentialAlert {
  staffName: string
  credentialType: string
  daysOverdue?: number
  daysUntil?: number
}

interface ClassroomStatus {
  id: string
  name: string
  roomType: string
  ratio: string
  ratioMet: boolean
}

interface CategoryStat {
  category: string
  name: string
  score: number
}

interface DashboardClientProps {
  staffCount: number
  studentCount: number
  complianceScore: number
  alertCount: number
  credentialAlerts: {
    expired: CredentialAlert[]
    expiringSoon: CredentialAlert[]
    expiringLater: CredentialAlert[]
  }
  classroomStatus: ClassroomStatus[]
  categoryStats: CategoryStat[]
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const Icon = stat.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="stat-card group transition-all duration-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-muted-foreground">{stat.name}</p>
            <p className="text-2xl font-semibold tracking-tight mt-1">{stat.value}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          {stat.trend === 'up' ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          ) : stat.trend === 'down' ? (
            <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
          ) : null}
          <span className={cn(
            'text-xs font-medium',
            stat.trend === 'up' ? 'text-emerald-600' : stat.trend === 'down' ? 'text-amber-600' : 'text-muted-foreground'
          )}>
            {stat.change}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function DashboardClient({
  staffCount,
  studentCount,
  complianceScore,
  alertCount,
  credentialAlerts,
  classroomStatus,
  categoryStats,
}: DashboardClientProps) {
  const stats: StatItem[] = [
    {
      name: 'Total Staff',
      value: staffCount,
      change: 'Team members',
      trend: 'neutral',
      icon: Users,
    },
    {
      name: 'Active Students',
      value: studentCount,
      change: 'Enrolled',
      trend: 'neutral',
      icon: Building,
    },
    {
      name: 'Compliance',
      value: `${complianceScore}%`,
      change: complianceScore >= 90 ? 'On track' : 'Needs attention',
      trend: complianceScore >= 90 ? 'up' : 'down',
      icon: TrendingUp,
    },
    {
      name: 'Alerts',
      value: alertCount,
      change: alertCount > 0 ? 'Action needed' : 'All clear',
      trend: alertCount > 0 ? 'down' : 'neutral',
      icon: AlertCircle,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={stat.name} stat={stat} index={index} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credential Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Credential Status</h3>
            <Link href="/staff" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {credentialAlerts.expired.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {credentialAlerts.expired.length} expired
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {credentialAlerts.expired.slice(0, 2).map(c => c.staffName).join(', ')}
                    {credentialAlerts.expired.length > 2 ? ` +${credentialAlerts.expired.length - 2}` : ''}
                  </p>
                </div>
                <span className="badge-premium badge-error">Critical</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100"
              >
                <div>
                  <p className="text-sm font-medium text-emerald-800">No expired credentials</p>
                  <p className="text-xs text-emerald-600 mt-0.5">All credentials current</p>
                </div>
                <Check className="h-4 w-4 text-emerald-500" />
              </motion.div>
            )}

            {credentialAlerts.expiringSoon.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
              >
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {credentialAlerts.expiringSoon.length} expiring in 30 days
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {credentialAlerts.expiringSoon.slice(0, 2).map(c => c.staffName).join(', ')}
                  </p>
                </div>
                <span className="badge-premium badge-warning">Warning</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-black/[0.04]"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">No upcoming expirations</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Next 30 days clear</p>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            )}

            {credentialAlerts.expiringLater.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-black/[0.04]"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {credentialAlerts.expiringLater.length} expiring in 90 days
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {credentialAlerts.expiringLater.slice(0, 2).map(c => c.staffName).join(', ')}
                  </p>
                </div>
                <span className="badge-premium badge-neutral">Info</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Classroom Ratios */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Classroom Ratios</h3>
            <Link href="/classrooms" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {classroomStatus.length > 0 ? (
              classroomStatus.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.03 }}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">{room.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({room.roomType})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      room.ratioMet ? 'text-foreground' : 'text-amber-600'
                    )}>
                      {room.ratio}
                    </span>
                    {room.ratioMet ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Building className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No active classrooms</p>
                <Link href="/classrooms" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Add Classroom
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Compliance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="stat-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Compliance by Category</h3>
          <Link href="/compliance" className="text-xs text-primary hover:underline flex items-center gap-1">
            View details <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categoryStats.map((cat, index) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + index * 0.05 }}
            >
              <Link
                href={`/compliance/${cat.category}`}
                className={cn(
                  "block text-center p-4 rounded-lg transition-all duration-200 border hover-lift",
                  cat.score >= 90
                    ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                    : cat.score >= 70
                      ? 'bg-amber-50 border-amber-100 hover:bg-amber-100'
                      : 'bg-red-50 border-red-100 hover:bg-red-100'
                )}
              >
                <p className={cn(
                  "text-2xl font-semibold",
                  cat.score >= 90
                    ? 'text-emerald-700'
                    : cat.score >= 70
                      ? 'text-amber-700'
                      : 'text-red-700'
                )}>
                  {cat.score}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">{cat.name}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
