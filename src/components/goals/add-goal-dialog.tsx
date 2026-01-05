'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'

interface AddGoalDialogProps {
  studentId: string
  discipline: string
}

const DOMAINS_BY_DISCIPLINE: Record<string, { value: string; label: string }[]> = {
  speech: [
    { value: 'articulation', label: 'Articulation' },
    { value: 'language', label: 'Language' },
    { value: 'fluency', label: 'Fluency' },
    { value: 'voice', label: 'Voice' },
    { value: 'pragmatics', label: 'Pragmatics' },
    { value: 'communication', label: 'Communication' },
  ],
  ot: [
    { value: 'fine_motor', label: 'Fine Motor' },
    { value: 'sensory', label: 'Sensory Processing' },
    { value: 'adl', label: 'Activities of Daily Living' },
    { value: 'visual_motor', label: 'Visual Motor' },
    { value: 'handwriting', label: 'Handwriting' },
  ],
  pt: [
    { value: 'gross_motor', label: 'Gross Motor' },
    { value: 'balance', label: 'Balance & Coordination' },
    { value: 'mobility', label: 'Mobility' },
    { value: 'strength', label: 'Strength' },
  ],
  aba: [
    { value: 'behavior', label: 'Behavior' },
    { value: 'social', label: 'Social Skills' },
    { value: 'communication', label: 'Communication' },
    { value: 'adaptive', label: 'Adaptive Skills' },
    { value: 'academic', label: 'Academic' },
  ],
  counseling: [
    { value: 'social', label: 'Social-Emotional' },
    { value: 'behavior', label: 'Behavior' },
    { value: 'coping', label: 'Coping Skills' },
    { value: 'self_regulation', label: 'Self-Regulation' },
  ],
}

export function AddGoalDialog({ studentId, discipline }: AddGoalDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [domain, setDomain] = useState('')
  const [description, setDescription] = useState('')
  const [targetCriteria, setTargetCriteria] = useState('')
  const [baseline, setBaseline] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const domains = DOMAINS_BY_DISCIPLINE[discipline] || DOMAINS_BY_DISCIPLINE.speech

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      alert('Please enter a goal description')
      return
    }

    setLoading(true)

    const goalData = {
      student_id: studentId,
      discipline,
      domain: domain || null,
      description: description.trim(),
      target_criteria: targetCriteria.trim() || null,
      baseline: baseline.trim() || null,
      status: 'in_progress',
      target_date: targetDate || null,
    }

    const { error } = await (supabase
      .from('goals') as ReturnType<typeof supabase.from>)
      .insert(goalData as never)

    if (error) {
      alert('Error adding goal: ' + error.message)
    } else {
      // Reset form
      setDomain('')
      setDescription('')
      setTargetCriteria('')
      setBaseline('')
      setTargetDate('')
      setIsOpen(false)
      router.refresh()
    }

    setLoading(false)
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Goal
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add IEP/IFSP Goal</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="domain">Domain</Label>
              <select
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select domain...</option>
                {domains.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Goal Description *</Label>
              <Textarea
                id="description"
                placeholder="e.g., Student will produce /r/ in initial position of words with 80% accuracy..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="targetCriteria">Target Criteria</Label>
              <Input
                id="targetCriteria"
                placeholder="e.g., 80% accuracy over 3 consecutive sessions"
                value={targetCriteria}
                onChange={(e) => setTargetCriteria(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="baseline">Baseline</Label>
              <Input
                id="baseline"
                placeholder="e.g., 20% accuracy at initial evaluation"
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Goal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
