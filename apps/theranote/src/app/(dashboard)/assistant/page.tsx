import { createClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/assistant/chat-interface'
import { QuickActions } from '@/components/assistant/quick-actions'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'AI Assistant | TheraNote',
  description: 'Your AI-powered clinical documentation assistant',
}

export default async function AssistantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's profile for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('discipline')
    .eq('id', user?.id || '')
    .single() as { data: { discipline: string | null } | null }

  // Get recent goals for context
  const { data: recentGoals } = await supabase
    .from('goals')
    .select('description')
    .limit(5)
    .order('created_at', { ascending: false }) as { data: { description: string }[] | null }

  const context = {
    discipline: profile?.discipline || undefined,
    recentGoals: recentGoals?.map(g => g.description) || [],
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-100 rounded-xl">
          <Sparkles className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
          <p className="text-sm text-gray-500">
            Get help with documentation, goals, and clinical questions
          </p>
        </div>
      </div>

      {/* Main Content - Chat + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <ChatInterface context={context} />
        </div>
        <div className="hidden xl:block">
          <div className="sticky top-4 space-y-4">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
