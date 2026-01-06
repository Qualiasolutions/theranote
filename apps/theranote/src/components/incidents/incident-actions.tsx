'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Printer, CheckCircle, Eye, Loader2 } from 'lucide-react'

interface IncidentActionsProps {
  incidentId: string
  currentStatus: string
}

export function IncidentActions({ incidentId, currentStatus }: IncidentActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus)
    try {
      const { error } = await (supabase
        .from('incidents') as ReturnType<typeof supabase.from>)
        .update({ status: newStatus, updated_at: new Date().toISOString() } as never)
        .eq('id', incidentId)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status')
    } finally {
      setLoading(null)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex justify-end gap-3 print:hidden">
      {currentStatus === 'open' && (
        <Button
          variant="outline"
          onClick={() => updateStatus('reviewed')}
          disabled={loading !== null}
        >
          {loading === 'reviewed' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          Mark as Reviewed
        </Button>
      )}

      {(currentStatus === 'open' || currentStatus === 'reviewed') && (
        <Button
          variant="default"
          onClick={() => updateStatus('closed')}
          disabled={loading !== null}
        >
          {loading === 'closed' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Close Incident
        </Button>
      )}

      {currentStatus === 'closed' && (
        <Button
          variant="outline"
          onClick={() => updateStatus('open')}
          disabled={loading !== null}
        >
          {loading === 'open' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Reopen Incident
        </Button>
      )}

      <Button variant="outline" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />
        Print Report
      </Button>
    </div>
  )
}
