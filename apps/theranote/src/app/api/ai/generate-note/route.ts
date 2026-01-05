import { NextRequest, NextResponse } from 'next/server'
import { generateFullNote } from '@/lib/ai/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { discipline, studentName, goals, sessionDate, attendanceStatus, noteFormat } = body

    if (!discipline) {
      return NextResponse.json(
        { error: 'Discipline is required' },
        { status: 400 }
      )
    }

    const result = await generateFullNote(
      discipline,
      noteFormat || 'soap',
      {
        studentName,
        goals,
        sessionDate,
        attendanceStatus,
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating note:', error)
    return NextResponse.json(
      { error: 'Failed to generate note' },
      { status: 500 }
    )
  }
}
