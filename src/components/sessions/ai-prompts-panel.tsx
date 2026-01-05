'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'

interface AIPromptsPanelProps {
  discipline: string
  activeSection: 'S' | 'O' | 'A' | 'P'
  onInsert: (text: string) => void
}

const sectionLabels = {
  S: 'Subjective',
  O: 'Objective',
  A: 'Assessment',
  P: 'Plan',
}

// Pre-built prompts by discipline and section
const promptsByDiscipline: Record<string, Record<string, string[]>> = {
  speech: {
    S: [
      'Student reported feeling confident about sounds practiced.',
      'Parent noted improvement in speech clarity at home.',
      'Student expressed interest in practicing new targets.',
      'Caregiver mentioned difficulty with specific sounds in conversation.',
    ],
    O: [
      'Student produced target sound with __% accuracy across __ trials.',
      'Articulation was assessed at word/phrase/sentence level.',
      'Student demonstrated age-appropriate receptive language skills.',
      'Fluency was characterized by __ disfluencies per minute.',
    ],
    A: [
      'Student demonstrates steady progress toward IEP goal.',
      'Performance indicates readiness for increased complexity.',
      'Current level of support is appropriate for skill development.',
      'Student would benefit from additional practice with __.',
    ],
    P: [
      'Continue targeting current sounds at __ level.',
      'Introduce new target sounds in next session.',
      'Provide home practice activities for reinforcement.',
      'Reassess progress toward IEP goals at next review.',
    ],
  },
  ot: {
    S: [
      'Student reported comfort level with fine motor tasks.',
      'Parent noted progress with self-care skills at home.',
      'Student expressed preference for sensory activities.',
      'Caregiver mentioned challenges with handwriting.',
    ],
    O: [
      'Student demonstrated __ grasp pattern during writing task.',
      'Fine motor coordination was assessed using standardized measure.',
      'Student completed __ of __ self-care task steps independently.',
      'Sensory processing was observed during structured activities.',
    ],
    A: [
      'Student shows progress in fine motor skill development.',
      'Current intervention approach is effective for goals.',
      'Student would benefit from sensory integration strategies.',
      'Performance indicates need for adaptive equipment.',
    ],
    P: [
      'Continue fine motor strengthening activities.',
      'Introduce new self-care skill targets.',
      'Implement sensory diet recommendations.',
      'Collaborate with classroom team on accommodations.',
    ],
  },
  pt: {
    S: [
      'Student reported comfort level during gross motor activities.',
      'Parent noted progress with mobility at home.',
      'Student expressed interest in playground activities.',
      'Caregiver mentioned concerns about balance.',
    ],
    O: [
      'Student demonstrated __ gait pattern during ambulation.',
      'Balance was assessed using standardized measure.',
      'Gross motor skills were observed during structured play.',
      'Range of motion was measured at __ degrees.',
    ],
    A: [
      'Student shows progress in gross motor development.',
      'Current intervention is effective for mobility goals.',
      'Student would benefit from strengthening exercises.',
      'Performance indicates need for assistive device.',
    ],
    P: [
      'Continue gross motor strengthening activities.',
      'Progress balance challenge activities.',
      'Implement home exercise program.',
      'Collaborate with team on environmental modifications.',
    ],
  },
  aba: {
    S: [
      'Student arrived in __ mood/behavioral state.',
      'Parent reported progress with target behaviors at home.',
      'Student engaged appropriately during initial interaction.',
      'Caregiver noted challenges with specific behaviors.',
    ],
    O: [
      'Target behavior occurred __ times during __ minute session.',
      'Student demonstrated mastery of __ skill at __% accuracy.',
      'Prompt level was faded from __ to __.',
      'Data collected on __ trials across __ programs.',
    ],
    A: [
      'Student demonstrates acquisition of target skills.',
      'Behavior reduction goals are progressing as expected.',
      'Current reinforcement schedule is effective.',
      'Student ready for generalization of mastered skills.',
    ],
    P: [
      'Continue current behavior intervention plan.',
      'Fade prompts for mastered skills.',
      'Introduce new skill acquisition targets.',
      'Coordinate with team on generalization strategies.',
    ],
  },
  counseling: {
    S: [
      'Student reported current emotional state as __.',
      'Parent noted behavioral changes at home.',
      'Student expressed feelings about __.',
      'Caregiver mentioned social challenges.',
    ],
    O: [
      'Student engaged in therapeutic activities appropriately.',
      'Affect was observed as __ throughout session.',
      'Student demonstrated coping skills during role-play.',
      'Social interaction was observed during group activity.',
    ],
    A: [
      'Student shows progress with emotional regulation.',
      'Therapeutic rapport continues to develop.',
      'Student demonstrates emerging coping strategies.',
      'Social skills development is progressing.',
    ],
    P: [
      'Continue building therapeutic relationship.',
      'Introduce new coping strategies.',
      'Practice social skills through role-play.',
      'Coordinate with family on home support.',
    ],
  },
}

export function AIPromptsPanel({
  discipline,
  activeSection,
  onInsert,
}: AIPromptsPanelProps) {
  const [loading, setLoading] = useState(false)
  const [customPrompts, setCustomPrompts] = useState<string[]>([])

  // Get prompts for current discipline and section
  const disciplineKey = discipline.toLowerCase()
  const prompts =
    promptsByDiscipline[disciplineKey]?.[activeSection] ||
    promptsByDiscipline['speech'][activeSection]

  const generateCustomPrompts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discipline,
          section: activeSection,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompts')
      }

      const data = await response.json()
      setCustomPrompts(data.prompts || [])
    } catch (error) {
      console.error('Error generating prompts:', error)
      // Fallback to static prompts on error
      setCustomPrompts([
        `Based on ${discipline} therapy best practices...`,
        `Consider documenting progress on...`,
        `Clinical observation suggests...`,
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Prompts
        </CardTitle>
        <CardDescription>
          Suggestions for {sectionLabels[activeSection]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick prompts */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Quick Insert
          </p>
          {prompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onInsert(prompt)}
              className="w-full text-left p-3 text-sm rounded-md border hover:bg-primary/5 hover:border-primary/20 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Custom AI prompts */}
        {customPrompts.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">
              AI Generated
            </p>
            {customPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => onInsert(prompt)}
                className="w-full text-left p-3 text-sm rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Generate more */}
        <Button
          variant="outline"
          className="w-full"
          onClick={generateCustomPrompts}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Generate More Suggestions
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          AI assists with formatting only. All clinical content must be your own observations.
        </p>
      </CardContent>
    </Card>
  )
}
