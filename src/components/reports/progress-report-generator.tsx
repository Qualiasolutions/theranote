'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Loader2, FileText, Download, Printer } from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  discipline: string
}

interface ProgressReportGeneratorProps {
  students: Student[]
  therapistName: string
  therapistLicense: string | null
}

interface ReportData {
  student: Student
  goals: Array<{
    id: string
    description: string
    domain: string | null
    target_criteria: string | null
    baseline: string | null
    status: string
  }>
  sessions: Array<{
    id: string
    session_date: string
    attendance_status: string
    subjective: string | null
    objective: string | null
    assessment: string | null
    plan: string | null
  }>
  sessionGoals: Array<{
    goal_id: string
    progress_value: number | null
    progress_unit: string | null
    notes: string | null
  }>
  dateRange: { start: string; end: string }
}

export function ProgressReportGenerator({
  students,
  therapistName,
  therapistLicense,
}: ProgressReportGeneratorProps) {
  const supabase = createClient()

  const [studentId, setStudentId] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 3)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)

  const generateReport = async () => {
    if (!studentId) {
      alert('Please select a student')
      return
    }

    setLoading(true)

    try {
      const student = students.find((s) => s.id === studentId)
      if (!student) throw new Error('Student not found')

      // Fetch goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('student_id', studentId)

      // Fetch sessions in date range
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('student_id', studentId)
        .gte('session_date', startDate)
        .lte('session_date', endDate)
        .order('session_date', { ascending: true })

      // Fetch session goals
      const sessionIds = (sessions as { id: string }[] | null)?.map((s) => s.id) || []
      let sessionGoals: Array<{
        goal_id: string
        progress_value: number | null
        progress_unit: string | null
        notes: string | null
      }> = []

      if (sessionIds.length > 0) {
        const { data: sg } = await supabase
          .from('session_goals')
          .select('*')
          .in('session_id', sessionIds)

        sessionGoals = (sg as typeof sessionGoals) || []
      }

      setReportData({
        student,
        goals: (goals as ReportData['goals']) || [],
        sessions: (sessions as ReportData['sessions']) || [],
        sessionGoals,
        dateRange: { start: startDate, end: endDate },
      })
    } catch (error) {
      alert('Error generating report: ' + (error as Error).message)
    }

    setLoading(false)
  }

  const printReport = () => {
    window.print()
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    const years = today.getFullYear() - birthDate.getFullYear()
    const months = today.getMonth() - birthDate.getMonth()
    const totalMonths = years * 12 + months
    return `${Math.floor(totalMonths / 12)}y ${totalMonths % 12}m`
  }

  const getGoalProgressSummary = (goalId: string) => {
    const progressEntries = reportData?.sessionGoals.filter(
      (sg) => sg.goal_id === goalId && sg.progress_value !== null
    )

    if (!progressEntries || progressEntries.length === 0) {
      return { average: null, trend: 'No data' }
    }

    const values = progressEntries.map((p) => p.progress_value!).filter((v) => v !== null)
    const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length)

    let trend = 'Stable'
    if (values.length >= 2) {
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      if (secondAvg > firstAvg + 5) trend = 'Improving'
      else if (secondAvg < firstAvg - 5) trend = 'Declining'
    }

    return { average, trend }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label htmlFor="student">Student</Label>
          <select
            id="student"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} ({student.discipline})
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={generateReport} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        Generate Report
      </Button>

      {/* Report Preview */}
      {reportData && (
        <div className="border rounded-lg p-6 bg-white print:border-none print:p-0">
          {/* Print Actions */}
          <div className="flex justify-end gap-2 mb-6 print:hidden">
            <Button variant="outline" onClick={printReport}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>

          {/* Report Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-2xl font-bold mb-2">Progress Report</h1>
            <p className="text-muted-foreground">
              {new Date(reportData.dateRange.start).toLocaleDateString()} -{' '}
              {new Date(reportData.dateRange.end).toLocaleDateString()}
            </p>
          </div>

          {/* Student Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="font-semibold text-lg mb-2">Student Information</h2>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {reportData.student.first_name}{' '}
                  {reportData.student.last_name}
                </p>
                <p>
                  <strong>DOB:</strong>{' '}
                  {new Date(reportData.student.date_of_birth).toLocaleDateString()}
                </p>
                <p>
                  <strong>Age:</strong> {calculateAge(reportData.student.date_of_birth)}
                </p>
                <p>
                  <strong>Service:</strong> {reportData.student.discipline}
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">Provider Information</h2>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Therapist:</strong> {therapistName}
                </p>
                {therapistLicense && (
                  <p>
                    <strong>License:</strong> {therapistLicense}
                  </p>
                )}
                <p>
                  <strong>Sessions in Period:</strong> {reportData.sessions.length}
                </p>
                <p>
                  <strong>Attendance Rate:</strong>{' '}
                  {reportData.sessions.length > 0
                    ? Math.round(
                        (reportData.sessions.filter((s) => s.attendance_status === 'present')
                          .length /
                          reportData.sessions.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Goals Progress */}
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-4">Goal Progress Summary</h2>

            {reportData.goals.length === 0 ? (
              <p className="text-muted-foreground">No goals documented for this student.</p>
            ) : (
              <div className="space-y-4">
                {reportData.goals.map((goal) => {
                  const { average, trend } = getGoalProgressSummary(goal.id)

                  return (
                    <div key={goal.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          {goal.domain && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 mr-2">
                              {goal.domain}
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              goal.status === 'met'
                                ? 'bg-green-100 text-green-700'
                                : goal.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {goal.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          {average !== null && (
                            <p className="font-bold text-lg">{average}%</p>
                          )}
                          <p
                            className={`text-xs ${
                              trend === 'Improving'
                                ? 'text-green-600'
                                : trend === 'Declining'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {trend}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm mb-2">{goal.description}</p>

                      {goal.target_criteria && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Target:</strong> {goal.target_criteria}
                        </p>
                      )}
                      {goal.baseline && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Baseline:</strong> {goal.baseline}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Session Summary */}
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-4">Session Summary</h2>

            {reportData.sessions.length === 0 ? (
              <p className="text-muted-foreground">
                No sessions documented during this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Attendance</th>
                      <th className="text-left p-2">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.sessions.slice(0, 10).map((session) => (
                      <tr key={session.id} className="border-b">
                        <td className="p-2">
                          {new Date(session.session_date).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              session.attendance_status === 'present'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {session.attendance_status}
                          </span>
                        </td>
                        <td className="p-2 max-w-md">
                          <p className="line-clamp-2 text-xs">
                            {session.assessment || session.objective || 'No notes'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.sessions.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing 10 of {reportData.sessions.length} sessions
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Signature Line */}
          <div className="mt-12 pt-8 border-t">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="border-b border-black mb-2 h-8"></div>
                <p className="text-sm">Therapist Signature</p>
                <p className="text-xs text-muted-foreground">{therapistName}</p>
              </div>
              <div>
                <div className="border-b border-black mb-2 h-8"></div>
                <p className="text-sm">Date</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
