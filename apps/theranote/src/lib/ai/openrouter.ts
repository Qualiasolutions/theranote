const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// Using a fast, cost-effective model for prompt generation
const MODEL = 'google/gemini-flash-1.5'

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

async function chat(messages: OpenRouterMessage[]): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'TheraNote',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${error}`)
  }

  const data: OpenRouterResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

export async function generateSOAPPrompts(
  discipline: string,
  section: 'S' | 'O' | 'A' | 'P',
  context?: {
    studentName?: string
    goals?: string[]
    previousContent?: string
  }
): Promise<string[]> {
  const sectionNames: Record<string, string> = {
    S: 'Subjective',
    O: 'Objective',
    A: 'Assessment',
    P: 'Plan',
  }

  const disciplineFullNames: Record<string, string> = {
    speech: 'Speech-Language Pathology',
    ot: 'Occupational Therapy',
    pt: 'Physical Therapy',
    aba: 'Applied Behavior Analysis',
    counseling: 'Counseling/Psychology',
    seit: 'Special Education Itinerant Teacher',
    scis: 'Special Class Integrated Setting',
  }

  const sectionGuidelines: Record<string, string> = {
    S: 'Reports from student, parent, or caregiver about concerns, progress, or observations at home/school',
    O: 'Measurable, observable data collected during the session (percentages, trial counts, specific behaviors observed)',
    A: 'Clinical interpretation of the objective data, progress toward goals, and effectiveness of interventions',
    P: 'Next steps, recommendations, and plan for future sessions',
  }

  const systemPrompt = `You are an expert ${disciplineFullNames[discipline.toLowerCase()] || discipline} therapist writing clinical documentation for a preschool special education program. Generate concise, professional sentence starters for SOAP notes.`

  const userPrompt = `Generate 3 SHORT sentence starters or templates for the "${sectionNames[section]}" section of a SOAP note.

Guidelines for ${sectionNames[section]}:
${sectionGuidelines[section]}

${context?.studentName ? `Student: ${context.studentName}` : ''}
${context?.goals?.length ? `Current goals: ${context.goals.join('; ')}` : ''}
${context?.previousContent ? `Already written: "${context.previousContent}"` : ''}

Requirements:
- Keep each suggestion under 25 words
- Use clinical terminology appropriate for ${disciplineFullNames[discipline.toLowerCase()] || discipline}
- Use blanks (___) for specific data the therapist will fill in
- Be objective and professional
- Focus on early childhood/preschool context

Return ONLY a JSON array of 3 strings, no other text. Example:
["First suggestion here...", "Second suggestion...", "Third suggestion..."]`

  try {
    const response = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback to default prompts if parsing fails
    return getDefaultPrompts(discipline, section)
  } catch (error) {
    console.error('Error generating prompts:', error)
    return getDefaultPrompts(discipline, section)
  }
}

function getDefaultPrompts(discipline: string, section: string): string[] {
  const disciplineName = discipline.toLowerCase()

  const defaults: Record<string, Record<string, string[]>> = {
    speech: {
      S: ['Student reported feeling confident about sounds practiced.', 'Parent noted improvement in speech clarity at home.', 'Caregiver mentioned difficulty with specific sounds.'],
      O: ['Student produced target sound with ___% accuracy across ___ trials.', 'Articulation was assessed at word/phrase/sentence level.', 'Fluency was characterized by ___ disfluencies per minute.'],
      A: ['Student demonstrates steady progress toward IEP goal.', 'Performance indicates readiness for increased complexity.', 'Student would benefit from additional practice with ___.'],
      P: ['Continue targeting current sounds at ___ level.', 'Introduce new target sounds in next session.', 'Provide home practice activities for reinforcement.'],
    },
    default: {
      S: ['Student arrived in ___ mood/behavioral state.', 'Parent/caregiver reported progress with ___ at home.', 'Student expressed interest in ___ activities.'],
      O: ['Student demonstrated ___ with ___% accuracy.', 'Performance was observed during structured activities.', 'Data collected on ___ trials across ___ targets.'],
      A: ['Student shows progress in skill development.', 'Current intervention approach is effective for goals.', 'Student would benefit from ___ strategies.'],
      P: ['Continue current intervention plan.', 'Introduce new skill targets next session.', 'Coordinate with team on generalization strategies.'],
    },
  }

  return defaults[disciplineName]?.[section] || defaults.default[section] || [
    'Clinical observation noted...',
    'Progress was documented as...',
    'Recommendations include...',
  ]
}
