import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, FileText, Clock, AlertTriangle, Plus, ArrowUpRight, TrendingUp, Calendar, Sparkles } from 'lucide-react'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get stats (placeholder queries - will need proper org filtering)
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  const { count: sessionCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user?.id || '')

  const { count: draftCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user?.id || '')
    .eq('status', 'draft')

  const { data: recentSessions } = await supabase
    .from('sessions')
    .select(`
      *,
      student:students(first_name, last_name)
    `)
    .eq('therapist_id', user?.id || '')
    .order('session_date', { ascending: false })
    .limit(5) as { data: Array<{
      id: string
      session_date: string
      discipline: string
      status: string
      student: { first_name: string; last_name: string } | null
    }> | null }

  const stats = [
    {
      name: 'My Students',
      value: studentCount || 0,
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
      value: sessionCount || 0,
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
      value: draftCount || 0,
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
    <DashboardClient stats={stats} recentSessions={recentSessions || []} />
  )
}
