'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, UserPlus, Trash2, Edit2 } from 'lucide-react'

interface Therapist {
  id: string
  full_name: string
  discipline: string | null
}

interface Student {
  id: string
  first_name: string
  last_name: string
  status: string
  service_type: string | null
}

interface Caseload {
  id: string
  therapist_id: string
  student_id: string
  discipline: string
  frequency: string | null
  start_date: string
  end_date: string | null
  therapist: { id: string; full_name: string; discipline: string | null } | null
  student: { id: string; first_name: string; last_name: string } | null
}

export function CaseloadManager() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [caseloads, setCaseloads] = useState<Caseload[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [selectedTherapist, setSelectedTherapist] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [frequency, setFrequency] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/caseloads')
      if (response.ok) {
        const data = await response.json()
        setTherapists(data.therapists || [])
        setStudents(data.students || [])
        setCaseloads(data.caseloads || [])
      }
    } catch (error) {
      console.error('Error loading caseloads:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update discipline when therapist changes
  useEffect(() => {
    if (selectedTherapist) {
      const therapist = therapists.find(t => t.id === selectedTherapist)
      if (therapist?.discipline) {
        setDiscipline(therapist.discipline)
      }
    }
  }, [selectedTherapist, therapists])

  const handleAssign = async () => {
    if (!selectedTherapist || !selectedStudent || !discipline) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/caseloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapist_id: selectedTherapist,
          student_id: selectedStudent,
          discipline,
          frequency: frequency || null,
          start_date: startDate,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to assign caseload')
        return
      }

      // Reset form and reload
      setSelectedTherapist('')
      setSelectedStudent('')
      setDiscipline('')
      setFrequency('')
      setDialogOpen(false)
      loadData()
      router.refresh()
    } catch (error) {
      console.error('Error assigning caseload:', error)
      alert('Failed to assign caseload')
    } finally {
      setSaving(false)
    }
  }

  const handleEndCaseload = async (id: string) => {
    if (!confirm('Are you sure you want to end this caseload assignment?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/caseloads?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadData()
        router.refresh()
      } else {
        alert('Failed to end caseload')
      }
    } catch (error) {
      console.error('Error ending caseload:', error)
    }
  }

  // Get unassigned students
  const assignedStudentIds = new Set(caseloads.map(c => c.student_id))
  const unassignedStudents = students.filter(s => !assignedStudentIds.has(s.id))

  // Group caseloads by therapist
  const caseloadsByTherapist = caseloads.reduce((acc, c) => {
    const therapistId = c.therapist_id
    if (!acc[therapistId]) {
      acc[therapistId] = []
    }
    acc[therapistId].push(c)
    return acc
  }, {} as Record<string, Caseload[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{therapists.length}</div>
            <p className="text-xs text-muted-foreground">Total Therapists</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Active Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{caseloads.length}</div>
            <p className="text-xs text-muted-foreground">Active Assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{unassignedStudents.length}</div>
            <p className="text-xs text-muted-foreground">Unassigned Students</p>
          </CardContent>
        </Card>
      </div>

      {/* Assign Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Caseload Assignments</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Student to Therapist</DialogTitle>
              <DialogDescription>
                Create a new caseload assignment between a therapist and student.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="therapist">Therapist *</Label>
                <select
                  id="therapist"
                  value={selectedTherapist}
                  onChange={(e) => setSelectedTherapist(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a therapist...</option>
                  {therapists.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.discipline?.toUpperCase() || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <select
                  id="student"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a student...</option>
                  <optgroup label="Unassigned Students">
                    {unassignedStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.last_name}, {s.first_name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Students">
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.last_name}, {s.first_name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discipline">Discipline *</Label>
                  <select
                    id="discipline"
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="speech">Speech</option>
                    <option value="ot">OT</option>
                    <option value="pt">PT</option>
                    <option value="aba">ABA</option>
                    <option value="counseling">Counseling</option>
                    <option value="seit">SEIT</option>
                    <option value="scis">SCIS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input
                    id="frequency"
                    placeholder="e.g., 2x/week"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Caseloads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Caseloads</CardTitle>
        </CardHeader>
        <CardContent>
          {caseloads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No caseload assignments yet. Click "Assign Student" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Discipline</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caseloads.map((caseload) => (
                  <TableRow key={caseload.id}>
                    <TableCell className="font-medium">
                      {caseload.student
                        ? `${caseload.student.last_name}, ${caseload.student.first_name}`
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {caseload.therapist?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {caseload.discipline.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{caseload.frequency || '-'}</TableCell>
                    <TableCell>{caseload.start_date}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEndCaseload(caseload.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Unassigned Students Alert */}
      {unassignedStudents.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200">
              Unassigned Students ({unassignedStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassignedStudents.map((student) => (
                <Badge
                  key={student.id}
                  variant="outline"
                  className="border-amber-300 text-amber-800 dark:text-amber-200"
                >
                  {student.first_name} {student.last_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
