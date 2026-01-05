'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  ChevronRight,
  Users,
  Clock,
  AlertCircle,
  BarChart3,
} from 'lucide-react'
import { motion } from '@/components/ui/motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { ComplianceAlerts } from '@/components/compliance/compliance-alerts'
import type { ComplianceViolation } from '@/lib/compliance/rules'

interface Session {
  id: string
  session_date: string
  discipline: string
  status: string
  student: { first_name: string; last_name: string } | null
}

interface DashboardClientProps {
  studentCount: number
  sessionCount: number
  draftCount: number
  recentSessions: Session[]
  complianceViolations?: ComplianceViolation[]
  complianceScore?: number
}

interface StatItem {
  name: string
  value: number
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: LucideIcon
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

function SessionRow({ session, index }: { session: Session; index: number }) {
  const statusStyles = {
    signed: 'badge-success',
    draft: 'badge-warning',
    pending: 'badge-neutral',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link href={`/sessions/${session.id}`}>
        <div className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-muted-foreground">
                {session.student?.first_name?.charAt(0)}
                {session.student?.last_name?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {session.student?.first_name} {session.student?.last_name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {new Date(session.session_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground uppercase">{session.discipline}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn('badge-premium capitalize', statusStyles[session.status as keyof typeof statusStyles] || 'badge-neutral')}>
              {session.status}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function DashboardClient({
  studentCount,
  sessionCount,
  draftCount,
  recentSessions,
  complianceViolations = [],
  complianceScore = 100,
}: DashboardClientProps) {
  const stats: StatItem[] = [
    {
      name: 'My Students',
      value: studentCount,
      change: 'Active caseload',
      trend: 'neutral',
      icon: Users,
    },
    {
      name: 'Sessions',
      value: sessionCount,
      change: '+12% this month',
      trend: 'up',
      icon: FileText,
    },
    {
      name: 'Drafts',
      value: draftCount,
      change: draftCount > 0 ? 'Pending signature' : 'All signed',
      trend: draftCount > 0 ? 'down' : 'neutral',
      icon: Clock,
    },
    {
      name: 'Overdue',
      value: 0,
      change: 'All clear',
      trend: 'neutral',
      icon: AlertCircle,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Your clinical documentation overview</p>
        </div>
        <Link href="/sessions/new">
          <Button className="gap-2 h-9 rounded-lg shadow-sm">
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={stat.name} stat={stat} index={index} />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Link href="/sessions/new" className="block">
          <div className="stat-card bg-foreground text-background hover:bg-foreground/90 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Start Session</p>
                <p className="text-sm text-background/60 mt-0.5">Document therapy session</p>
              </div>
              <ArrowRight className="h-4 w-4 text-background/40 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        <Link href="/students/new" className="block">
          <div className="stat-card hover:border-black/10 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Add Student</p>
                <p className="text-sm text-muted-foreground mt-0.5">Register to caseload</p>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        </Link>

        <Link href="/reports" className="block">
          <div className="stat-card hover:border-black/10 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-muted-foreground mt-0.5">Attendance & compliance</p>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Compliance Alerts */}
      {complianceViolations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <ComplianceAlerts
            violations={complianceViolations}
            complianceScore={complianceScore}
          />
        </motion.div>
      )}

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-black/[0.04] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
              <CardDescription className="text-xs">Latest documentation</CardDescription>
            </div>
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs text-muted-foreground hover:text-foreground">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {recentSessions && recentSessions.length > 0 ? (
              <div className="space-y-0.5">
                {recentSessions.map((session, index) => (
                  <SessionRow key={session.id} session={session} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No sessions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first session note</p>
                <Link href="/sessions/new" className="mt-4 inline-block">
                  <Button size="sm" className="gap-1.5 h-8 rounded-lg">
                    <Plus className="h-3.5 w-3.5" />
                    Create Session
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
