'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AIPromptsPanel } from './ai-prompts-panel'
import { GoalProgressTracker } from './goal-progress-tracker'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, CheckCircle, Sparkles } from 'lucide-react'

// Extended student type for the editor (allows passing joined data)
interface StudentForEditor {
  id: string
  first_name: string
  last_name: string
  discipline?: string
}

interface SOAPEditorProps {
  therapistId: string
  discipline: string
  students: StudentForEditor[]
  existingSession?: {
    id: string
    student_id: string
    session_date: string
    start_time: string
    end_time: string
    attendance_status: string
    subjective: string | null
    objective: string | null
    assessment: string | null
    plan: string | null
    status: string
  }
}

export function SOAPEditor({
  therapistId,
  discipline,
  students,
  existingSession,
}: SOAPEditorProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'S' | 'O' | 'A' | 'P'>('S')
  const [showAIPanel, setShowAIPanel] = useState(true)

  // Goals state
  interface Goal {
    id: string
    description: string
    domain: string | null
    target_criteria: string | null
    status: string
  }
  interface GoalProgress {
    goalId: string
    progressValue: number | null
    progressUnit: string
    notes: string
  }
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([])

  // Form state
  const [studentId, setStudentId] = useState(existingSession?.student_id || '')
  const [sessionDate, setSessionDate] = useState(
    existingSession?.session_date || new Date().toISOString().split('T')[0]
  )
  const [startTime, setStartTime] = useState(existingSession?.start_time || '09:00')
  const [endTime, setEndTime] = useState(existingSession?.end_time || '09:30')
  const [attendanceStatus, setAttendanceStatus] = useState(
    existingSession?.attendance_status || 'present'
  )
  const [subjective, setSubjective] = useState(existingSession?.subjective || '')
  const [objective, setObjective] = useState(existingSession?.objective || '')
  const [assessment, setAssessment] = useState(existingSession?.assessment || '')
  const [plan, setPlan] = useState(existingSession?.plan || '')

  const selectedStudent = students.find((s) => s.id === studentId)

  // Load goals when student changes
  useEffect(() => {
    const loadGoals = async () => {
      if (!studentId) {
        setGoals([])
        setGoalProgress([])
        return
      }

      // Get active goals for the student
      const { data: studentGoals } = await supabase
        .from('goals')
        .select('id, description, domain, target_criteria, status')
        .eq('student_id', studentId)
        .in('status', ['baseline', 'in_progress'])
        .order('created_at', { ascending: false })

      setGoals((studentGoals as Goal[]) || [])

      // If editing existing session, load progress data
      if (existingSession) {
        const { data: sessionGoals } = await supabase
          .from('session_goals')
          .select('goal_id, progress_value, progress_unit, notes')
          .eq('session_id', existingSession.id)

        if (sessionGoals) {
          setGoalProgress(
            sessionGoals.map((sg: { goal_id: string; progress_value: number | null; progress_unit: string | null; notes: string | null }) => ({
              goalId: sg.goal_id,
              progressValue: sg.progress_value,
              progressUnit: sg.progress_unit || '%',
              notes: sg.notes || '',
            }))
          )
        }
      }
    }

    loadGoals()
  }, [studentId, existingSession, supabase])

  const saveGoalProgress = async (sessionId: string) => {
    // Delete existing progress for this session
    await supabase
      .from('session_goals')
      .delete()
      .eq('session_id', sessionId)

    // Insert new progress data
    const progressToSave = goalProgress.filter(p => p.progressValue !== null || p.notes)
    if (progressToSave.length > 0) {
      await (supabase
        .from('session_goals') as ReturnType<typeof supabase.from>)
        .insert(
          progressToSave.map(p => ({
            session_id: sessionId,
            goal_id: p.goalId,
            progress_value: p.progressValue,
            progress_unit: p.progressUnit,
            notes: p.notes || null,
          })) as never
        )
    }
  }

  const handleSaveDraft = async () => {
    if (!studentId) {
      alert('Please select a student')
      return
    }

    setLoading(true)

    const sessionData = {
      student_id: studentId,
      therapist_id: therapistId,
      session_date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      attendance_status: attendanceStatus as 'present' | 'absent' | 'makeup' | 'cancelled',
      discipline: selectedStudent?.discipline || discipline,
      subjective: subjective || null,
      objective: objective || null,
      assessment: assessment || null,
      plan: plan || null,
      status: 'draft' as const,
    }

    let sessionId = existingSession?.id

    if (existingSession) {
      const { error } = await (supabase
        .from('sessions') as ReturnType<typeof supabase.from>)
        .update(sessionData as never)
        .eq('id', existingSession.id)

      if (error) {
        alert('Error saving: ' + error.message)
        setLoading(false)
        return
      }
    } else {
      const { data, error } = await (supabase
        .from('sessions') as ReturnType<typeof supabase.from>)
        .insert(sessionData as never)
        .select('id')
        .single()

      if (error) {
        alert('Error saving: ' + error.message)
        setLoading(false)
        return
      }
      sessionId = (data as { id: string }).id
    }

    // Save goal progress
    if (sessionId) {
      await saveGoalProgress(sessionId)
    }

    setLoading(false)
    router.push('/sessions')
    router.refresh()
  }

  const handleSign = async () => {
    if (!subjective || !objective || !assessment || !plan) {
      alert('Please complete all SOAP sections before signing')
      return
    }

    setLoading(true)

    const sessionData = {
      student_id: studentId,
      therapist_id: therapistId,
      session_date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      attendance_status: attendanceStatus as 'present' | 'absent' | 'makeup' | 'cancelled',
      discipline: selectedStudent?.discipline || discipline,
      subjective,
      objective,
      assessment,
      plan,
      status: 'signed' as const,
      signed_at: new Date().toISOString(),
    }

    let sessionId = existingSession?.id

    if (existingSession) {
      const { error } = await (supabase
        .from('sessions') as ReturnType<typeof supabase.from>)
        .update(sessionData as never)
        .eq('id', existingSession.id)

      if (error) {
        alert('Error signing: ' + error.message)
        setLoading(false)
        return
      }
    } else {
      const { data, error } = await (supabase
        .from('sessions') as ReturnType<typeof supabase.from>)
        .insert(sessionData as never)
        .select('id')
        .single()

      if (error) {
        alert('Error signing: ' + error.message)
        setLoading(false)
        return
      }
      sessionId = (data as { id: string }).id
    }

    // Save goal progress
    if (sessionId) {
      await saveGoalProgress(sessionId)
    }

    setLoading(false)
    router.push('/sessions')
    router.refresh()
  }

  const insertText = (text: string) => {
    switch (activeSection) {
      case 'S':
        setSubjective((prev) => prev + (prev ? ' ' : '') + text)
        break
      case 'O':
        setObjective((prev) => prev + (prev ? ' ' : '') + text)
        break
      case 'A':
        setAssessment((prev) => prev + (prev ? ' ' : '') + text)
        break
      case 'P':
        setPlan((prev) => prev + (prev ? ' ' : '') + text)
        break
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-6">
        {/* Session Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
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
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="attendance">Attendance</Label>
                <select
                  id="attendance"
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="makeup">Makeup</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SOAP Sections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>SOAP Note</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIPanel(!showAIPanel)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {showAIPanel ? 'Hide' : 'Show'} AI Assist
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subjective */}
            <div>
              <Label
                htmlFor="subjective"
                className={`text-lg font-semibold ${
                  activeSection === 'S' ? 'text-primary' : ''
                }`}
              >
                Subjective
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Student/caregiver reports, concerns, and observations
              </p>
              <Textarea
                id="subjective"
                placeholder="Student reported feeling confident about speech sounds practiced last session..."
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                onFocus={() => setActiveSection('S')}
                className="min-h-[120px]"
              />
            </div>

            {/* Objective */}
            <div>
              <Label
                htmlFor="objective"
                className={`text-lg font-semibold ${
                  activeSection === 'O' ? 'text-primary' : ''
                }`}
              >
                Objective
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Measurable observations, data, and clinical findings
              </p>
              <Textarea
                id="objective"
                placeholder="Student produced /r/ in initial position with 80% accuracy across 20 trials..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                onFocus={() => setActiveSection('O')}
                className="min-h-[120px]"
              />
            </div>

            {/* Assessment */}
            <div>
              <Label
                htmlFor="assessment"
                className={`text-lg font-semibold ${
                  activeSection === 'A' ? 'text-primary' : ''
                }`}
              >
                Assessment
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Clinical interpretation and progress evaluation
              </p>
              <Textarea
                id="assessment"
                placeholder="Student demonstrates steady progress toward IEP goal. Performance indicates readiness for..."
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                onFocus={() => setActiveSection('A')}
                className="min-h-[120px]"
              />
            </div>

            {/* Plan */}
            <div>
              <Label
                htmlFor="plan"
                className={`text-lg font-semibold ${
                  activeSection === 'P' ? 'text-primary' : ''
                }`}
              >
                Plan
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Next steps, recommendations, and treatment direction
              </p>
              <Textarea
                id="plan"
                placeholder="Continue targeting /r/ in initial position. Introduce /r/ in medial position next session..."
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                onFocus={() => setActiveSection('P')}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSaveDraft} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button onClick={handleSign} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Sign & Complete
          </Button>
        </div>
      </div>

      {/* Right Panel: Goals & AI */}
      {showAIPanel && (
        <div className="lg:col-span-1 space-y-6">
          {/* Goal Progress Tracker */}
          {studentId && (
            <GoalProgressTracker
              goals={goals}
              progress={goalProgress}
              onProgressChange={setGoalProgress}
            />
          )}

          {/* AI Prompts */}
          <AIPromptsPanel
            discipline={selectedStudent?.discipline || discipline}
            activeSection={activeSection}
            onInsert={insertText}
          />
        </div>
      )}
    </div>
  )
}
