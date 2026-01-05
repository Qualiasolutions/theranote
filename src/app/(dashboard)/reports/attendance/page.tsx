import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Download, Calendar, Check, X, Clock } from 'lucide-react'

export default async function AttendanceReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get sessions for the current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const endOfMonth = new Date()
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)
  endOfMonth.setDate(0)

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      student:students(id, first_name, last_name)
    `)
    .eq('therapist_id', user.id)
    .gte('session_date', startOfMonth.toISOString().split('T')[0])
    .lte('session_date', endOfMonth.toISOString().split('T')[0])
    .order('session_date', { ascending: false }) as { data: Array<{
      id: string
      session_date: string
      start_time: string
      end_time: string
      duration_minutes: number
      attendance_status: string
      discipline: string
      status: string
      student: { id: string; first_name: string; last_name: string } | null
    }> | null }

  // Calculate stats
  const totalSessions = sessions?.length || 0
  const presentSessions = sessions?.filter(s => s.attendance_status === 'present').length || 0
  const absentSessions = sessions?.filter(s => s.attendance_status === 'absent').length || 0
  const makeupSessions = sessions?.filter(s => s.attendance_status === 'makeup').length || 0
  const cancelledSessions = sessions?.filter(s => s.attendance_status === 'cancelled').length || 0

  // Group by student
  const byStudent = sessions?.reduce((acc, session) => {
    const studentName = session.student
      ? `${session.student.first_name} ${session.student.last_name}`
      : 'Unknown'
    if (!acc[studentName]) {
      acc[studentName] = { present: 0, absent: 0, makeup: 0, cancelled: 0, total: 0 }
    }
    acc[studentName][session.attendance_status as keyof typeof acc[typeof studentName]]++
    acc[studentName].total++
    return acc
  }, {} as Record<string, { present: number; absent: number; makeup: number; cancelled: number; total: number }>)

  const monthName = startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Attendance Log</h2>
          <p className="text-muted-foreground">{monthName}</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Check className="h-4 w-4 text-green-600" />
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentSessions}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <X className="h-4 w-4 text-red-600" />
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentSessions}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4 text-blue-600" />
              Makeup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{makeupSessions}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{cancelledSessions}</div>
          </CardContent>
        </Card>
      </div>

      {/* By Student Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance by Student</CardTitle>
          <CardDescription>Summary for {monthName}</CardDescription>
        </CardHeader>
        <CardContent>
          {byStudent && Object.keys(byStudent).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Student</th>
                    <th className="text-center p-3 font-medium">Present</th>
                    <th className="text-center p-3 font-medium">Absent</th>
                    <th className="text-center p-3 font-medium">Makeup</th>
                    <th className="text-center p-3 font-medium">Cancelled</th>
                    <th className="text-center p-3 font-medium">Total</th>
                    <th className="text-center p-3 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(byStudent).map(([name, stats]) => (
                    <tr key={name} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{name}</td>
                      <td className="p-3 text-center text-green-600">{stats.present}</td>
                      <td className="p-3 text-center text-red-600">{stats.absent}</td>
                      <td className="p-3 text-center text-blue-600">{stats.makeup}</td>
                      <td className="p-3 text-center text-gray-600">{stats.cancelled}</td>
                      <td className="p-3 text-center">{stats.total}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          (stats.present / stats.total) >= 0.8
                            ? 'bg-green-100 text-green-700'
                            : (stats.present / stats.total) >= 0.6
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {Math.round((stats.present / stats.total) * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No sessions recorded for this month
            </p>
          )}
        </CardContent>
      </Card>

      {/* Session Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Session Detail</CardTitle>
          <CardDescription>All sessions for {monthName}</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions && sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Student</th>
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-center p-3 font-medium">Duration</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-center p-3 font-medium">Doc Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
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
                        {session.start_time} - {session.end_time}
                      </td>
                      <td className="p-3 text-center">{session.duration_minutes} min</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          session.attendance_status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : session.attendance_status === 'absent'
                            ? 'bg-red-100 text-red-700'
                            : session.attendance_status === 'makeup'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {session.attendance_status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          session.status === 'signed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No sessions recorded for this month
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
