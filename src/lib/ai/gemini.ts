import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
    counseling: 'School Counseling/Psychology',
    seit: 'Special Education Itinerant Teacher',
    scis: 'Special Class Integrated Setting',
  }

  const sectionGuidelines: Record<string, string> = {
    S: 'Reports from student, parent, or caregiver about concerns, progress, or observations at home/school',
    O: 'Measurable, observable data collected during the session (percentages, trial counts, specific behaviors observed)',
    A: 'Clinical interpretation of the objective data, progress toward goals, and effectiveness of interventions',
    P: 'Next steps, recommendations, and plan for future sessions',
  }

  const prompt = `You are an expert ${disciplineFullNames[discipline.toLowerCase()] || discipline} therapist writing clinical documentation for a preschool special education program.

Generate 3 SHORT sentence starters or templates for the "${sectionNames[section]}" section of a SOAP note.

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
    const result = await gemini.generateContent(prompt)
    const response = result.response.text()

    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback to default prompts if parsing fails
    return [
      `${disciplineFullNames[discipline.toLowerCase()] || discipline} observation noted...`,
      `Progress was documented as...`,
      `Clinical findings indicate...`,
    ]
  } catch (error) {
    console.error('Error generating prompts:', error)
    throw error
  }
}
