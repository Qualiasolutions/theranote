import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Plus, Target, FileText, Calendar, TrendingUp } from 'lucide-react'
import { GoalsList } from '@/components/goals/goals-list'
import { AddGoalDialog } from '@/components/goals/add-goal-dialog'

interface StudentPageProps {
  params: Promise<{ id: string }>
}

export default async function StudentPage({ params }: StudentPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get student details
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single() as { data: {
      id: string
      first_name: string
      last_name: string
      date_of_birth: string
      status: string
      external_id: string | null
    } | null }

  if (!student) {
    redirect('/students')
  }

  // Get goals for this student
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('student_id', id)
    .order('created_at', { ascending: false }) as { data: Array<{
      id: string
      student_id: string
      discipline: string
      domain: string | null
      description: string
      target_criteria: string | null
      baseline: string | null
      status: string
      start_date: string
      target_date: string | null
      created_at: string
    }> | null }

  // Get caseload info (discipline)
  const { data: caseload } = await supabase
    .from('caseloads')
    .select('discipline, frequency')
    .eq('student_id', id)
    .eq('therapist_id', user.id)
    .single() as { data: { discipline: string; frequency: string | null } | null }

  // Get recent sessions
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('student_id', id)
    .eq('therapist_id', user.id)
    .order('session_date', { ascending: false })
    .limit(5) as { data: Array<{
      id: string
      session_date: string
      status: string
      attendance_status: string
    }> | null }

  // Calculate age
  const birthDate = new Date(student.date_of_birth)
  const today = new Date()
  const ageYears = today.getFullYear() - birthDate.getFullYear()
  const ageMonths = today.getMonth() - birthDate.getMonth()
  const totalMonths = ageYears * 12 + ageMonths
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  // Goal stats
  const activeGoals = goals?.filter(g => g.status === 'in_progress').length || 0
  const metGoals = goals?.filter(g => g.status === 'met').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            {student.first_name} {student.last_name}
          </h2>
          <p className="text-muted-foreground">
            {years}y {months}m old | {caseload?.discipline || 'No discipline'} | {caseload?.frequency || 'No frequency set'}
          </p>
        </div>
        <Link href={`/sessions/new?student=${id}`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`px-2 py-1 text-sm rounded-full ${
              student.status === 'active'
                ? 'bg-green-100 text-green-700'
                : student.status === 'on_hold'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {student.status}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Goals Met</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metGoals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentSessions?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Goals Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>IEP/IFSP Goals</CardTitle>
                <CardDescription>Track progress on student goals</CardDescription>
              </div>
              <AddGoalDialog
                studentId={id}
                discipline={caseload?.discipline || 'speech'}
              />
            </CardHeader>
            <CardContent>
              <GoalsList goals={goals || []} studentId={id} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Latest documentation</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions && recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(session.session_date).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          session.status === 'signed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No sessions yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
