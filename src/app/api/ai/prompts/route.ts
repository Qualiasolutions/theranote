import { NextRequest, NextResponse } from 'next/server'
import { generateSOAPPrompts } from '@/lib/ai/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { discipline, section, context } = body

    if (!discipline || !section) {
      return NextResponse.json(
        { error: 'Missing required fields: discipline and section' },
        { status: 400 }
      )
    }

    // Validate section
    if (!['S', 'O', 'A', 'P'].includes(section)) {
      return NextResponse.json(
        { error: 'Invalid section. Must be S, O, A, or P' },
        { status: 400 }
      )
    }

    const prompts = await generateSOAPPrompts(
      discipline,
      section as 'S' | 'O' | 'A' | 'P',
      context
    )

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('Error generating prompts:', error)
    return NextResponse.json(
      { error: 'Failed to generate prompts' },
      { status: 500 }
    )
  }
}
