'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Plus,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Sparkles,
  ChevronRight,
  Users,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { motion, HoverCard } from '@/components/ui/motion'
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
  description: string
  icon: LucideIcon
  trend: string
  trendUp: boolean
  color: string
  bgColor: string
  textColor: string
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const Icon = stat.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <HoverCard>
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          {/* Gradient accent */}
          <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', stat.color)} />

          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.name}
            </CardTitle>
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className={cn('p-2 rounded-xl', stat.bgColor)}
            >
              <Icon className={cn('h-5 w-5', stat.textColor)} />
            </motion.div>
          </CardHeader>

          <CardContent>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
              className="text-3xl font-bold tracking-tight"
            >
              {stat.value}
            </motion.div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                stat.trendUp ? 'text-emerald-600' : 'text-amber-600'
              )}>
                {stat.trendUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{stat.trend}</span>
              </div>
            </div>
          </CardContent>

          {/* Hover glow effect */}
          <div className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
            'bg-gradient-to-br from-transparent via-transparent to-primary/5'
          )} />
        </Card>
      </HoverCard>
    </motion.div>
  )
}

function SessionRow({ session, index }: { session: Session; index: number }) {
  const statusColors = {
    signed: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20',
    draft: 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20',
    pending: 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ x: 4 }}
    >
      <Link href={`/sessions/${session.id}`}>
        <div className="group flex items-center justify-between p-4 rounded-xl bg-white/50 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {session.student?.first_name?.charAt(0)}
                {session.student?.last_name?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                {session.student?.first_name} {session.student?.last_name}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(session.session_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="uppercase text-xs font-medium">{session.discipline}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full capitalize',
              statusColors[session.status as keyof typeof statusColors] || statusColors.pending
            )}>
              {session.status}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
      description: 'Active caseload',
      icon: Users,
      trend: '+2 this week',
      trendUp: true,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      name: 'Sessions This Month',
      value: sessionCount,
      description: 'Documented sessions',
      icon: FileText,
      trend: '+12%',
      trendUp: true,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      name: 'Draft Notes',
      value: draftCount,
      description: 'Pending signature',
      icon: Clock,
      trend: 'Action needed',
      trendUp: false,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      name: 'Missing Docs',
      value: 0,
      description: 'Overdue documentation',
      icon: AlertTriangle,
      trend: 'All clear',
      trendUp: true,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Your clinical documentation overview</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link href="/sessions/new">
            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
              <Plus className="h-4 w-4" />
              <span>New Session Note</span>
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={stat.name} stat={stat} index={index} />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <HoverCard>
          <Link href="/sessions/new" className="block">
            <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary to-blue-600 text-white overflow-hidden group">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Start New Session</p>
                  <p className="text-sm text-white/80 mt-1">Document your next therapy session</p>
                </div>
                <motion.div
                  whileHover={{ rotate: 45 }}
                  className="p-3 bg-white/20 rounded-xl"
                >
                  <ArrowUpRight className="h-6 w-6" />
                </motion.div>
              </CardContent>
            </Card>
          </Link>
        </HoverCard>

        <HoverCard>
          <Link href="/students/new" className="block">
            <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm overflow-hidden group">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Add Student</p>
                  <p className="text-sm text-muted-foreground mt-1">Register a new student to your caseload</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                  <Plus className="h-6 w-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </HoverCard>

        <HoverCard>
          <Link href="/reports" className="block">
            <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm overflow-hidden group">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">View Reports</p>
                  <p className="text-sm text-muted-foreground mt-1">Attendance, progress, and compliance</p>
                </div>
                <div className="p-3 bg-violet-50 rounded-xl group-hover:bg-violet-100 transition-colors">
                  <Sparkles className="h-6 w-6 text-violet-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </HoverCard>
      </motion.div>

      {/* Compliance Alerts */}
      {complianceViolations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <ComplianceAlerts
            violations={complianceViolations}
            complianceScore={complianceScore}
          />
        </motion.div>
      )}

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Sessions</CardTitle>
              <CardDescription>Your latest session documentation</CardDescription>
            </div>
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
                View all
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentSessions && recentSessions.length > 0 ? (
              <div className="space-y-2">
                {recentSessions.map((session, index) => (
                  <SessionRow key={session.id} session={session} index={index} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center mb-4"
                >
                  <FileText className="h-8 w-8 text-primary/50" />
                </motion.div>
                <p className="font-medium text-foreground">No sessions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start by creating your first session note</p>
                <Link href="/sessions/new" className="mt-4 inline-block">
                  <Button className="gap-2 rounded-xl">
                    <Plus className="h-4 w-4" />
                    Create Session Note
                  </Button>
                </Link>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
