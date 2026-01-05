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

export async function generateFullNote(
  discipline: string,
  noteFormat: 'soap' | 'narrative',
  context?: {
    studentName?: string
    goals?: { description: string; domain: string | null }[]
    sessionDate?: string
    attendanceStatus?: string
  }
): Promise<{
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  narrative?: string
  warnings?: string[]
}> {
  const disciplineFullNames: Record<string, string> = {
    speech: 'Speech-Language Pathology',
    ot: 'Occupational Therapy',
    pt: 'Physical Therapy',
    aba: 'Applied Behavior Analysis',
    counseling: 'Counseling/Psychology',
    seit: 'Special Education Itinerant Teacher',
    scis: 'Special Class Integrated Setting',
  }

  const goalsText = context?.goals?.length
    ? context.goals.map((g) => `- ${g.description}${g.domain ? ` (${g.domain})` : ''}`).join('\n')
    : 'No specific goals provided'

  const systemPrompt = `You are an expert ${disciplineFullNames[discipline.toLowerCase()] || discipline} therapist writing clinical documentation for a preschool special education (4410) program. Generate professional, compliant session notes.

IMPORTANT GUIDELINES:
- Use placeholders like [X%], [specific behavior], [number of trials] where specific data should be added
- Be clinical but warm in tone, appropriate for early childhood
- Include measurable data points and specific observations
- Reference goals when documenting progress
- Keep content PHI-safe (no actual identifying information)
- Follow NYC DOE/NYSED documentation standards`

  const formatInstructions =
    noteFormat === 'soap'
      ? `Generate a complete SOAP note with all 4 sections:
- Subjective: Parent/caregiver reports, student's self-reports, behavioral observations at start
- Objective: Measurable data, trial results, specific behaviors observed during session
- Assessment: Clinical interpretation, progress toward goals, effectiveness of interventions
- Plan: Next steps, recommendations, goals for next session

Return a JSON object with keys: subjective, objective, assessment, plan (each a string paragraph)`
      : `Generate a comprehensive narrative session note that covers:
- Session context and student presentation
- Interventions and activities used
- Student's response and measurable outcomes
- Progress toward IEP goals
- Recommendations and next steps

Return a JSON object with key: narrative (a single string containing the full note)`

  const userPrompt = `Generate a session note for:
Discipline: ${disciplineFullNames[discipline.toLowerCase()] || discipline}
Session Date: ${context?.sessionDate || 'Today'}
Attendance: ${context?.attendanceStatus || 'present'}
Student: ${context?.studentName || 'Student'}

Current IEP Goals:
${goalsText}

${formatInstructions}

Also include a "warnings" array with any reminders for the therapist (e.g., "Remember to add specific percentage data", "Include actual trial counts").`

  try {
    const response = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        subjective: result.subjective,
        objective: result.objective,
        assessment: result.assessment,
        plan: result.plan,
        narrative: result.narrative,
        warnings: result.warnings || [
          'Review and update placeholder values with actual session data',
          'Ensure all observations are based on your clinical judgment',
        ],
      }
    }

    throw new Error('Could not parse AI response')
  } catch (error) {
    console.error('Error generating full note:', error)
    // Return template defaults
    if (noteFormat === 'soap') {
      return {
        subjective: `${context?.studentName || 'Student'} arrived for scheduled therapy session. [Add parent/caregiver report and initial observations.]`,
        objective: `During the session, ${context?.studentName || 'student'} demonstrated [specific skills] with [X%] accuracy across [X] trials. [Add measurable data.]`,
        assessment: `${context?.studentName || 'Student'} shows [progress level] toward current IEP goals. [Add clinical interpretation.]`,
        plan: `Continue current intervention approach. Next session will focus on [specific targets]. [Add recommendations.]`,
        warnings: ['Add specific data from your session observations', 'Include actual trial counts and percentages'],
      }
    } else {
      return {
        narrative: `${context?.studentName || 'Student'} was seen for individual ${discipline} therapy on ${context?.sessionDate || 'this date'}. [Add session details, interventions used, student responses, and progress observations. Include measurable data and recommendations for next session.]`,
        warnings: ['Complete the note with actual session observations'],
      }
    }
  }
}

export async function analyzeNoteForMissingElements(
  noteFormat: 'soap' | 'narrative',
  content: {
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
    narrativeNotes?: string
  },
  discipline: string
): Promise<string[]> {
  const noteText =
    noteFormat === 'soap'
      ? `Subjective: ${content.subjective || '[empty]'}\nObjective: ${content.objective || '[empty]'}\nAssessment: ${content.assessment || '[empty]'}\nPlan: ${content.plan || '[empty]'}`
      : `Narrative: ${content.narrativeNotes || '[empty]'}`

  const systemPrompt = `You are a clinical documentation reviewer for a preschool special education program. Analyze session notes for compliance and completeness.`

  const userPrompt = `Review this ${discipline} session note for missing elements. Check for:

1. Measurable data (percentages, trial counts, specific numbers)
2. Observable behaviors (specific actions, not assumptions)
3. Goal references (connection to IEP objectives)
4. Professional clinical language
5. Time-specific observations
6. Parent/caregiver communication (if applicable)
7. Next session recommendations

Note to review:
${noteText}

Return a JSON array of warning strings (max 5 most important issues). If the note is complete, return an empty array.
Example: ["Missing measurable data in Objective section", "Consider adding specific goal references"]`

  try {
    const response = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return []
  } catch (error) {
    console.error('Error analyzing note:', error)
    return []
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
