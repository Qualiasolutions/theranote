'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import {
  Users,
  FileText,
  Target,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react'

interface QuickActionsProps {
  onAction?: (action: string) => void
}

const QUICK_ACTIONS = [
  {
    id: 'new-session',
    icon: FileText,
    label: 'New Session',
    description: 'Create a new therapy session',
    href: '/sessions/new',
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  },
  {
    id: 'new-student',
    icon: Users,
    label: 'New Student',
    description: 'Add a student to your caseload',
    href: '/students/new',
    color: 'bg-green-50 text-green-600 hover:bg-green-100',
  },
  {
    id: 'view-goals',
    icon: Target,
    label: 'Manage Goals',
    description: 'View and edit IEP goals',
    href: '/students',
    color: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
  },
]

export function QuickActions({ onAction }: QuickActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: typeof QUICK_ACTIONS[0]) => {
    setLoading(action.id)
    onAction?.(action.id)

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 150))
    router.push(action.href)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Plus className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div className="space-y-2">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Button
              variant="ghost"
              onClick={() => handleAction(action)}
              disabled={loading === action.id}
              className="w-full justify-between h-auto py-3 px-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {action.description}
                  </div>
                </div>
              </div>
              {loading === action.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <ArrowRight className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
