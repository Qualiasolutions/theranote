'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Target, ChevronDown, ChevronUp } from 'lucide-react'

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

interface GoalProgressTrackerProps {
  goals: Goal[]
  progress: GoalProgress[]
  onProgressChange: (progress: GoalProgress[]) => void
}

export function GoalProgressTracker({
  goals,
  progress,
  onProgressChange,
}: GoalProgressTrackerProps) {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(
    goals.length > 0 ? goals[0].id : null
  )

  const updateProgress = (goalId: string, field: keyof GoalProgress, value: string | number | null) => {
    const existingIndex = progress.findIndex((p) => p.goalId === goalId)

    if (existingIndex >= 0) {
      const updated = [...progress]
      updated[existingIndex] = { ...updated[existingIndex], [field]: value }
      onProgressChange(updated)
    } else {
      onProgressChange([
        ...progress,
        {
          goalId,
          progressValue: field === 'progressValue' ? (value as number) : null,
          progressUnit: field === 'progressUnit' ? (value as string) : '%',
          notes: field === 'notes' ? (value as string) : '',
        },
      ])
    }
  }

  const getProgressForGoal = (goalId: string): GoalProgress => {
    return (
      progress.find((p) => p.goalId === goalId) || {
        goalId,
        progressValue: null,
        progressUnit: '%',
        notes: '',
      }
    )
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No active goals for this student.
            <br />
            Add goals from the student profile.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Goal Progress ({goals.length} active)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.map((goal) => {
          const goalProgress = getProgressForGoal(goal.id)
          const isExpanded = expandedGoal === goal.id

          return (
            <div key={goal.id} className="border rounded-lg overflow-hidden">
              <div
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-start justify-between"
                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
              >
                <div className="flex-1 min-w-0">
                  {goal.domain && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mr-2">
                      {goal.domain}
                    </span>
                  )}
                  <p className="text-sm line-clamp-2 mt-1">{goal.description}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                )}
              </div>

              {isExpanded && (
                <div className="p-3 pt-0 space-y-3 border-t bg-gray-50">
                  {goal.target_criteria && (
                    <p className="text-xs text-muted-foreground">
                      Target: {goal.target_criteria}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Progress</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={goalProgress.progressValue ?? ''}
                          onChange={(e) =>
                            updateProgress(
                              goal.id,
                              'progressValue',
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-20 h-8 text-sm"
                        />
                        <select
                          value={goalProgress.progressUnit}
                          onChange={(e) =>
                            updateProgress(goal.id, 'progressUnit', e.target.value)
                          }
                          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="%">%</option>
                          <option value="trials">/ trials</option>
                          <option value="attempts">/ attempts</option>
                          <option value="minutes">min</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Session Notes for Goal</Label>
                    <Textarea
                      placeholder="Progress notes specific to this goal..."
                      value={goalProgress.notes}
                      onChange={(e) => updateProgress(goal.id, 'notes', e.target.value)}
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
