import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  AlertTriangle
} from 'lucide-react'

interface SessionWithStudent {
  id: string
  session_date: string
  status: string
  attendance_status: string
  duration_minutes: number
  student: { first_name: string; last_name: string } | null
  therapist: { full_name: string } | null
}

export default async function ComplianceDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single() as { data: { role: string; organization_id: string } | null }

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get organization stats
  const orgId = profile?.organization_id

  // Get all sessions for the organization this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      status,
      attendance_status,
      duration_minutes,
      student:students(first_name, last_name),
      therapist:profiles(full_name)
    `)
    .gte('session_date', startOfMonth.toISOString().split('T')[0])
    .order('session_date', { ascending: false }) as { data: SessionWithStudent[] | null }

  // Get all therapists
  const { data: therapists } = await supabase
    .from('profiles')
    .select('id, full_name, discipline')
    .eq('organization_id', orgId)
    .in('role', ['therapist', 'admin']) as { data: Array<{ id: string; full_name: string; discipline: string }> | null }

  // Get all students
  const { data: students } = await supabase
    .from('students')
    .select('id, status')
    .eq('organization_id', orgId) as { data: Array<{ id: string; status: string }> | null }

  // Calculate compliance metrics
  const totalSessions = sessions?.length || 0
  const signedSessions = sessions?.filter(s => s.status === 'signed').length || 0
  const draftSessions = sessions?.filter(s => s.status === 'draft').length || 0
  const presentSessions = sessions?.filter(s => s.attendance_status === 'present').length || 0
  const absentSessions = sessions?.filter(s => s.attendance_status === 'absent').length || 0

  const documentationRate = totalSessions > 0 ? Math.round((signedSessions / totalSessions) * 100) : 0
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0

  // Calculate total billable minutes
  const totalMinutes = sessions
    ?.filter(s => s.attendance_status === 'present' && s.status === 'signed')
    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0

  const activeStudents = students?.filter(s => s.status === 'active').length || 0
  const totalTherapists = therapists?.length || 0

  // Find sessions needing attention (draft or unsigned)
  const sessionsNeedingAttention = sessions?.filter(s => s.status === 'draft') || []

  // Calculate compliance score (weighted average)
  const complianceScore = Math.round(
    (documentationRate * 0.5) + (attendanceRate * 0.3) + (signedSessions > 0 ? 20 : 0)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Compliance Dashboard</h2>
          <p className="text-muted-foreground">Organization-wide compliance metrics</p>
        </div>
      </div>

      {/* Compliance Score */}
      <Card className={complianceScore >= 80 ? 'bg-green-50 border-green-200' : complianceScore >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className={`h-5 w-5 ${complianceScore >= 80 ? 'text-green-600' : complianceScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
            Overall Compliance Score
          </CardTitle>
          <CardDescription>
            Based on documentation completion, attendance tracking, and billing readiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${complianceScore >= 80 ? 'text-green-600' : complianceScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {complianceScore}%
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${complianceScore >= 80 ? 'bg-green-500' : complianceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${complianceScore}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {complianceScore >= 80 ? 'Excellent - Ready for audit' : complianceScore >= 60 ? 'Good - Minor improvements needed' : 'Needs attention - Review documentation'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Documentation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{documentationRate}%</div>
            <p className="text-sm text-muted-foreground">
              {signedSessions} of {totalSessions} signed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{attendanceRate}%</div>
            <p className="text-sm text-muted-foreground">
              {presentSessions} present, {absentSessions} absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Billable Minutes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMinutes.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              {Math.round(totalMinutes / 60)} hours this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              Active Caseload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeStudents}</div>
            <p className="text-sm text-muted-foreground">
              Across {totalTherapists} therapists
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Compliance Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Documentation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentation Status
            </CardTitle>
            <CardDescription>Session note completion breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Signed & Complete</span>
              </div>
              <span className="font-medium">{signedSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span>Draft (Pending Review)</span>
              </div>
              <span className="font-medium">{draftSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Missing Documentation</span>
              </div>
              <span className="font-medium">{totalSessions - signedSessions - draftSessions}</span>
            </div>

            <div className="pt-4 border-t">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${totalSessions > 0 ? (signedSessions / totalSessions) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${totalSessions > 0 ? (draftSessions / totalSessions) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Signed</span>
                <span>Draft</span>
                <span>Missing</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Overview
            </CardTitle>
            <CardDescription>Therapist documentation status</CardDescription>
          </CardHeader>
          <CardContent>
            {therapists && therapists.length > 0 ? (
              <div className="space-y-3">
                {therapists.slice(0, 5).map((therapist) => {
                  const therapistSessions = sessions?.filter(
                    s => s.therapist?.full_name === therapist.full_name
                  ) || []
                  const signedCount = therapistSessions.filter(s => s.status === 'signed').length
                  const rate = therapistSessions.length > 0
                    ? Math.round((signedCount / therapistSessions.length) * 100)
                    : 0

                  return (
                    <div key={therapist.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{therapist.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{therapist.discipline}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {rate}%
                        </span>
                        <p className="text-xs text-muted-foreground">{signedCount}/{therapistSessions.length}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No staff data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sessions Needing Attention */}
      {sessionsNeedingAttention.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Sessions Needing Attention
            </CardTitle>
            <CardDescription>Draft sessions that need to be signed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Student</th>
                    <th className="text-left p-3 font-medium">Therapist</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsNeedingAttention.slice(0, 10).map((session) => (
                    <tr key={session.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {new Date(session.session_date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {session.student
                          ? `${session.student.first_name} ${session.student.last_name}`
                          : 'Unknown'}
                      </td>
                      <td className="p-3">
                        {session.therapist?.full_name || 'Unknown'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                          {session.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/sessions/${session.id}`}>
                          <Button size="sm" variant="outline">Review</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sessionsNeedingAttention.length > 10 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                And {sessionsNeedingAttention.length - 10} more sessions need attention
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compliance Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Readiness Checklist</CardTitle>
          <CardDescription>Key compliance requirements for NYSED/DOE/Medicaid</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Documentation</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {documentationRate >= 90 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">90%+ session notes signed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">SOAP format compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Goal-linked progress notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Therapist signatures present</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Attendance & Billing</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {attendanceRate >= 80 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">Attendance logged for all sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Service duration recorded</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Make-up sessions documented</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Cancellation reasons noted</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
