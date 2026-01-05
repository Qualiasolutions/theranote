import { NextRequest, NextResponse } from 'next/server'
import { analyzeNoteForMissingElements } from '@/lib/ai/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteFormat, subjective, objective, assessment, plan, narrativeNotes, discipline } = body

    if (!discipline) {
      return NextResponse.json(
        { error: 'Discipline is required' },
        { status: 400 }
      )
    }

    const warnings = await analyzeNoteForMissingElements(
      noteFormat || 'soap',
      {
        subjective,
        objective,
        assessment,
        plan,
        narrativeNotes,
      },
      discipline
    )

    return NextResponse.json({ warnings })
  } catch (error) {
    console.error('Error analyzing note:', error)
    return NextResponse.json(
      { warnings: [] },
      { status: 200 }
    )
  }
}
