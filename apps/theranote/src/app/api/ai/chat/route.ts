import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// Using Claude for better conversational ability
const MODEL = 'anthropic/claude-3.5-haiku'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const SYSTEM_PROMPT = `You are TheraNote AI, a helpful assistant for therapists and clinical staff at a preschool special education program (4410, CPSE, Early Intervention).

You help with:
1. **Documentation**: Writing SOAP notes, progress reports, session summaries
2. **Goals**: Suggesting IEP/IFSP goals, tracking progress
3. **Clinical Guidance**: Therapy techniques, intervention strategies
4. **Compliance**: NYC DOE/NYSED regulations, billing requirements
5. **Creating Things**: Help users create sessions, add students, write goals

Available Disciplines: Speech-Language Pathology (SLP), Occupational Therapy (OT), Physical Therapy (PT), Applied Behavior Analysis (ABA), Counseling, SEIT, SCIS

When helping create content:
- Use clinical, professional language
- Include measurable/observable data placeholders like [X%], [specific behavior]
- Reference age-appropriate developmental milestones
- Be warm but professional

When users ask to "create" something, format your response clearly:
- For SOAP notes: Provide each section labeled (S, O, A, P)
- For goals: Use SMART format (Specific, Measurable, Achievable, Relevant, Time-bound)
- For session summaries: Include key observations and recommendations

Keep responses concise and actionable. You're a productivity tool, not a chatbot.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, context } = await request.json() as {
      messages: Message[]
      context?: {
        currentStudent?: string
        discipline?: string
        recentGoals?: string[]
      }
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    // Build context-aware system message
    let systemMessage = SYSTEM_PROMPT
    if (context) {
      systemMessage += '\n\nCurrent Context:'
      if (context.currentStudent) {
        systemMessage += `\n- Working with student: ${context.currentStudent}`
      }
      if (context.discipline) {
        systemMessage += `\n- Discipline: ${context.discipline}`
      }
      if (context.recentGoals?.length) {
        systemMessage += `\n- Recent goals: ${context.recentGoals.join('; ')}`
      }
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'TheraNote AI Assistant',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemMessage },
          ...messages.slice(-10), // Keep last 10 messages for context
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter error:', error)
      return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }

    // Stream the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch {
                  // Skip invalid JSON chunks
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
