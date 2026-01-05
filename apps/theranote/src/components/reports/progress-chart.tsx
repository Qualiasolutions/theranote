'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface ProgressDataPoint {
  date: string
  displayDate: string
  [goalId: string]: number | string | null
}

interface Goal {
  id: string
  description: string
  domain: string | null
  status: string
}

interface SessionGoalProgress {
  session_id: string
  session_date: string
  goal_id: string
  progress_value: number | null
  progress_unit: string | null
}

interface ProgressChartProps {
  goals: Goal[]
  progressData: SessionGoalProgress[]
  height?: number
}

// Color palette for goals
const GOAL_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

export function ProgressChart({ goals, progressData, height = 300 }: ProgressChartProps) {
  // Transform data for chart
  const chartData = transformDataForChart(progressData, goals)

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg border">
        <p className="text-muted-foreground">No progress data available for the selected period</p>
      </div>
    )
  }

  // Get goal abbreviations for legend
  const goalLabels = goals.reduce((acc, goal, idx) => {
    acc[goal.id] = `Goal ${idx + 1}: ${truncate(goal.description, 30)}`
    return acc
  }, {} as Record<string, string>)

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number, name: string) => [`${value}%`, goalLabels[name] || name]}
            labelFormatter={(label) => `Session: ${label}`}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm">{goalLabels[value] || value}</span>
            )}
          />
          {goals.map((goal, idx) => (
            <Line
              key={goal.id}
              type="monotone"
              dataKey={goal.id}
              stroke={GOAL_COLORS[idx % GOAL_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: GOAL_COLORS[idx % GOAL_COLORS.length] }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Goal Legend with full descriptions */}
      <div className="grid gap-2 text-sm">
        {goals.map((goal, idx) => (
          <div key={goal.id} className="flex items-start gap-2">
            <div
              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: GOAL_COLORS[idx % GOAL_COLORS.length] }}
            />
            <div>
              <span className="font-medium">Goal {idx + 1}</span>
              {goal.domain && (
                <span className="text-xs ml-2 px-1.5 py-0.5 bg-gray-100 rounded">
                  {goal.domain}
                </span>
              )}
              <span
                className={`text-xs ml-2 px-1.5 py-0.5 rounded ${
                  goal.status === 'met'
                    ? 'bg-green-100 text-green-700'
                    : goal.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {goal.status.replace('_', ' ')}
              </span>
              <p className="text-muted-foreground">{goal.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Area chart variant for single goal
export function SingleGoalProgressChart({
  goal,
  progressData,
  height = 200,
}: {
  goal: Goal
  progressData: SessionGoalProgress[]
  height?: number
}) {
  const filteredData = progressData.filter((p) => p.goal_id === goal.id && p.progress_value !== null)

  const chartData = filteredData.map((p) => ({
    date: p.session_date,
    displayDate: new Date(p.session_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    value: p.progress_value,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg border">
        <p className="text-sm text-muted-foreground">No progress data</p>
      </div>
    )
  }

  // Calculate trend
  const values = chartData.map((d) => d.value!).filter((v) => v !== null)
  const firstHalf = values.slice(0, Math.ceil(values.length / 2))
  const secondHalf = values.slice(Math.ceil(values.length / 2))
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0

  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  if (secondAvg > firstAvg + 5) trend = 'improving'
  else if (secondAvg < firstAvg - 5) trend = 'declining'

  const trendColor =
    trend === 'improving' ? '#10B981' : trend === 'declining' ? '#EF4444' : '#6B7280'

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradient-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value}%`, 'Progress']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={2}
            fill={`url(#gradient-${goal.id})`}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div className="flex justify-between text-sm px-2">
        <div>
          <span className="text-muted-foreground">Avg: </span>
          <span className="font-medium">
            {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}%
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Trend: </span>
          <span className="font-medium" style={{ color: trendColor }}>
            {trend.charAt(0).toUpperCase() + trend.slice(1)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Sessions: </span>
          <span className="font-medium">{chartData.length}</span>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function transformDataForChart(
  progressData: SessionGoalProgress[],
  goals: Goal[]
): ProgressDataPoint[] {
  // Group by session date
  const byDate = progressData.reduce((acc, item) => {
    const date = item.session_date
    if (!acc[date]) {
      acc[date] = {
        date,
        displayDate: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }
      // Initialize all goals to null
      goals.forEach((g) => {
        acc[date][g.id] = null
      })
    }
    if (item.progress_value !== null) {
      acc[date][item.goal_id] = item.progress_value
    }
    return acc
  }, {} as Record<string, ProgressDataPoint>)

  // Convert to array and sort by date
  return Object.values(byDate).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
