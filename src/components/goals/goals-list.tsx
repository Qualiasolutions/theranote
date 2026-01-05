'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Target, ChevronDown, ChevronUp, Check, Pause, X } from 'lucide-react'

interface Goal {
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
}

interface GoalsListProps {
  goals: Goal[]
  studentId: string
}

export function GoalsList({ goals, studentId }: GoalsListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const updateGoalStatus = async (goalId: string, newStatus: string) => {
    setUpdating(goalId)

    const { error } = await (supabase
      .from('goals') as ReturnType<typeof supabase.from>)
      .update({ status: newStatus } as never)
      .eq('id', goalId)

    if (error) {
      alert('Error updating goal: ' + error.message)
    } else {
      router.refresh()
    }

    setUpdating(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'met':
        return 'bg-green-100 text-green-700'
      case 'baseline':
        return 'bg-purple-100 text-purple-700'
      case 'discontinued':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDomainLabel = (domain: string | null) => {
    if (!domain) return null
    const labels: Record<string, string> = {
      articulation: 'Articulation',
      language: 'Language',
      fluency: 'Fluency',
      voice: 'Voice',
      pragmatics: 'Pragmatics',
      fine_motor: 'Fine Motor',
      gross_motor: 'Gross Motor',
      sensory: 'Sensory',
      adl: 'ADL',
      behavior: 'Behavior',
      social: 'Social Skills',
      academic: 'Academic',
      communication: 'Communication',
    }
    return labels[domain] || domain
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No goals yet</h3>
        <p className="text-muted-foreground">
          Add IEP/IFSP goals to track student progress
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="border rounded-lg overflow-hidden"
        >
          {/* Goal Header */}
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {goal.domain && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                      {getDomainLabel(goal.domain)}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(goal.status)}`}>
                    {goal.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="font-medium line-clamp-2">{goal.description}</p>
              </div>
              <Button variant="ghost" size="icon" className="ml-2">
                {expandedGoal === goal.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedGoal === goal.id && (
            <div className="px-4 pb-4 border-t bg-gray-50">
              <div className="pt-4 space-y-3">
                {goal.target_criteria && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Criteria</p>
                    <p className="text-sm">{goal.target_criteria}</p>
                  </div>
                )}

                {goal.baseline && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Baseline</p>
                    <p className="text-sm">{goal.baseline}</p>
                  </div>
                )}

                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Start Date</p>
                    <p>{new Date(goal.start_date).toLocaleDateString()}</p>
                  </div>
                  {goal.target_date && (
                    <div>
                      <p className="font-medium text-muted-foreground">Target Date</p>
                      <p>{new Date(goal.target_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                <div className="flex gap-2 pt-2">
                  {goal.status !== 'met' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateGoalStatus(goal.id, 'met')
                      }}
                      disabled={updating === goal.id}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark Met
                    </Button>
                  )}

                  {goal.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateGoalStatus(goal.id, 'baseline')
                      }}
                      disabled={updating === goal.id}
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Back to Baseline
                    </Button>
                  )}

                  {goal.status !== 'discontinued' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateGoalStatus(goal.id, 'discontinued')
                      }}
                      disabled={updating === goal.id}
                      className="text-gray-600"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Discontinue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
