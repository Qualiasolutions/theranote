'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save } from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string
}

interface IncidentFormProps {
  students: Student[]
  reporterId: string
}

const INCIDENT_TYPES = [
  { value: 'behavior', label: 'Behavior Incident', description: 'Tantrums, aggression, non-compliance' },
  { value: 'elopement', label: 'Elopement', description: 'Leaving designated area without permission' },
  { value: 'injury', label: 'Injury/Accident', description: 'Physical injury requiring documentation' },
  { value: 'medical', label: 'Medical', description: 'Health-related incident or concern' },
  { value: 'safety', label: 'Safety Concern', description: 'Environmental or situational safety issue' },
  { value: 'communication', label: 'Parent Communication', description: 'Significant parent/guardian contact' },
]

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
]

export function IncidentForm({ students, reporterId }: IncidentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form state
  const [studentId, setStudentId] = useState('')
  const [incidentType, setIncidentType] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0])
  const [incidentTime, setIncidentTime] = useState(
    new Date().toTimeString().slice(0, 5)
  )
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [antecedent, setAntecedent] = useState('')
  const [behavior, setBehavior] = useState('')
  const [consequence, setConsequence] = useState('')
  const [interventions, setInterventions] = useState('')
  const [outcome, setOutcome] = useState('')
  const [parentNotified, setParentNotified] = useState(false)
  const [adminNotified, setAdminNotified] = useState(false)
  const [followUpRequired, setFollowUpRequired] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!studentId || !incidentType || !description) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    // For now, just show success - would save to incidents table
    // In production, this would call an API endpoint or Supabase insert
    await new Promise(resolve => setTimeout(resolve, 1000))

    alert('Incident report saved successfully')
    router.push('/incidents')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="student">Student *</Label>
          <select
            id="student"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
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
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={incidentTime}
            onChange={(e) => setIncidentTime(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Incident Type *</Label>
          <select
            id="type"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Select type...</option>
            {INCIDENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="severity">Severity *</Label>
          <select
            id="severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {SEVERITY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="e.g., Classroom 3, Playground, Hallway"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description of Incident *</Label>
        <Textarea
          id="description"
          placeholder="Describe what happened in objective, observable terms..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px]"
          required
        />
      </div>

      {/* ABC Analysis (for behavior incidents) */}
      {(incidentType === 'behavior' || incidentType === 'elopement') && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold">ABC Analysis</h3>

          <div>
            <Label htmlFor="antecedent">Antecedent (What happened before?)</Label>
            <Textarea
              id="antecedent"
              placeholder="What was happening right before the behavior? What triggered it?"
              value={antecedent}
              onChange={(e) => setAntecedent(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="behavior">Behavior (What did the student do?)</Label>
            <Textarea
              id="behavior"
              placeholder="Describe the specific behavior in observable terms..."
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="consequence">Consequence (What happened after?)</Label>
            <Textarea
              id="consequence"
              placeholder="What were the immediate results of the behavior?"
              value={consequence}
              onChange={(e) => setConsequence(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
      )}

      {/* Interventions & Outcome */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="interventions">Interventions Used</Label>
          <Textarea
            id="interventions"
            placeholder="What strategies or interventions were used?"
            value={interventions}
            onChange={(e) => setInterventions(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="outcome">Outcome</Label>
          <Textarea
            id="outcome"
            placeholder="How was the situation resolved?"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        <Label>Notifications</Label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={parentNotified}
              onChange={(e) => setParentNotified(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">Parent/Guardian notified</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={adminNotified}
              onChange={(e) => setAdminNotified(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">Administrator notified</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">Follow-up required</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Incident Report
        </Button>
      </div>
    </form>
  )
}
