'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'

interface ProgressChartProps {
  goalId: string
  studentId: string
  title: string
  baseline?: string | null
  targetCriteria?: string | null
}

interface ProgressDataPoint {
  date: string
  displayDate: string
  value: number
  notes: string | null
  unit: string | null
}

interface SessionGoalData {
  progress_value: number | null
  progress_unit: string | null
  notes: string | null
  sessions: {
    session_date: string
  }
}

// Parse numeric baseline/target from string (e.g., "50% accuracy" -> 50)
function parseNumericValue(str: string | null | undefined): number | null {
  if (!str) return null
  const match = str.match(/(\d+(?:\.\d+)?)\s*%?/)
  if (match) {
    return parseFloat(match[1])
  }
  return null
}

export function ProgressChart({
  goalId,
  studentId,
  title,
  baseline,
  targetCriteria,
}: ProgressChartProps) {
  const [data, setData] = useState<ProgressDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const baselineValue = parseNumericValue(baseline)
  const targetValue = parseNumericValue(targetCriteria)

  useEffect(() => {
    async function fetchProgressData() {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Fetch session_goals with session date
      const { data: sessionGoals, error: fetchError } = await supabase
        .from('session_goals')
        .select(`
          progress_value,
          progress_unit,
          notes,
          sessions!inner(session_date)
        `)
        .eq('goal_id', goalId)
        .not('progress_value', 'is', null)
        .order('created_at', { ascending: true }) as {
          data: SessionGoalData[] | null
          error: Error | null
        }

      if (fetchError) {
        setError('Failed to load progress data')
        setLoading(false)
        return
      }

      if (!sessionGoals || sessionGoals.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      // Transform to chart data
      const chartData: ProgressDataPoint[] = sessionGoals
        .filter((sg) => sg.progress_value !== null)
        .map((sg) => ({
          date: sg.sessions.session_date,
          displayDate: new Date(sg.sessions.session_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          value: sg.progress_value!,
          notes: sg.notes,
          unit: sg.progress_unit,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setData(chartData)
      setLoading(false)
    }

    fetchProgressData()
  }, [goalId, studentId])

  // Calculate trend
  const calculateTrend = (): 'improving' | 'declining' | 'stable' | null => {
    if (data.length < 2) return null

    const values = data.map((d) => d.value)
    const firstHalf = values.slice(0, Math.ceil(values.length / 2))
    const secondHalf = values.slice(Math.ceil(values.length / 2))

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    const diff = secondAvg - firstAvg
    if (diff > 5) return 'improving'
    if (diff < -5) return 'declining'
    return 'stable'
  }

  const trend = calculateTrend()

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-48 bg-red-50 rounded-lg border border-red-100">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border">
        <p className="text-sm text-muted-foreground">No progress data recorded yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Progress will appear after session notes are documented
        </p>
      </div>
    )
  }

  // Calculate stats
  const currentValue = data[data.length - 1].value
  const avgValue = Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)

  const trendConfig = {
    improving: { color: '#10B981', icon: TrendingUp, label: 'Improving' },
    declining: { color: '#EF4444', icon: TrendingDown, label: 'Declining' },
    stable: { color: '#6B7280', icon: Minus, label: 'Stable' },
  }

  const TrendIcon = trend ? trendConfig[trend].icon : Minus
  const trendColor = trend ? trendConfig[trend].color : '#6B7280'

  return (
    <div className="space-y-3">
      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#9CA3AF', strokeDasharray: '5 5' }}
            />

            {/* Baseline reference line */}
            {baselineValue !== null && (
              <ReferenceLine
                y={baselineValue}
                stroke="#8B5CF6"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: 'Baseline',
                  position: 'insideTopRight',
                  fill: '#8B5CF6',
                  fontSize: 10,
                }}
              />
            )}

            {/* Target reference line */}
            {targetValue !== null && (
              <ReferenceLine
                y={targetValue}
                stroke="#10B981"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: 'Target',
                  position: 'insideBottomRight',
                  fill: '#10B981',
                  fontSize: 10,
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-muted-foreground">Current: </span>
            <span className="font-medium">{currentValue}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg: </span>
            <span className="font-medium">{avgValue}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Sessions: </span>
            <span className="font-medium">{data.length}</span>
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span className="font-medium">{trendConfig[trend].label}</span>
          </div>
        )}
      </div>

      {/* Legend for reference lines */}
      {(baselineValue !== null || targetValue !== null) && (
        <div className="flex items-center gap-4 px-1 text-xs">
          {baselineValue !== null && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-purple-500" style={{ borderStyle: 'dashed' }} />
              <span className="text-muted-foreground">Baseline: {baselineValue}%</span>
            </div>
          )}
          {targetValue !== null && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }} />
              <span className="text-muted-foreground">Target: {targetValue}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Custom tooltip component
interface TooltipPayload {
  value: number
  payload: ProgressDataPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="font-medium text-gray-900 mb-1">{data.displayDate}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Progress:</span>
          <span className="font-medium text-blue-600">
            {data.value}%{data.unit && data.unit !== '%' ? ` (${data.unit})` : ''}
          </span>
        </div>
        {data.notes && (
          <div className="pt-1 border-t">
            <p className="text-gray-500 text-xs">Notes:</p>
            <p className="text-gray-700 text-xs line-clamp-3">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
