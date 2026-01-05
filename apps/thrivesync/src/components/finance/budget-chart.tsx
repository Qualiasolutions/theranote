'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'

interface BudgetChartProps {
  data: Array<{
    category: string
    budgeted: number
    actual: number
  }>
}

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
  supplies: 'Supplies',
  rent: 'Rent',
  utilities: 'Utilities',
  salaries: 'Salaries',
  training: 'Training',
  equipment: 'Equipment',
  transportation: 'Transport',
  food: 'Food',
  maintenance: 'Maint.',
  insurance: 'Insurance',
  other: 'Other',
}

// Purple color scheme
const COLORS = {
  budgeted: '#8B5CF6', // purple-500
  actual: '#A78BFA', // purple-400
  overBudget: '#EF4444', // red-500
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const budgetItem = payload.find((p) => p.name === 'budgeted')
  const actualItem = payload.find((p) => p.name === 'actual')

  const budgeted = budgetItem?.value || 0
  const actual = actualItem?.value || 0
  const variance = budgeted - actual
  const percentUsed = budgeted > 0 ? Math.round((actual / budgeted) * 100) : 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium text-gray-900 mb-2">
        {CATEGORY_LABELS[label || ''] || label}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Budgeted:</span>
          <span className="font-medium">${budgeted.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Actual:</span>
          <span className="font-medium">${actual.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-1 border-t">
          <span className="text-gray-500">Variance:</span>
          <span className={`font-medium ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {variance < 0 ? '-' : '+'}${Math.abs(variance).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Used:</span>
          <span className={`font-medium ${percentUsed > 100 ? 'text-red-600' : ''}`}>
            {percentUsed}%
          </span>
        </div>
      </div>
    </div>
  )
}

export function BudgetChart({ data }: BudgetChartProps) {
  // Format data with readable labels
  const chartData = data.map((item) => ({
    ...item,
    name: CATEGORY_LABELS[item.category] || item.category,
    isOverBudget: item.actual > item.budgeted,
  }))

  // Calculate totals for summary
  const totalBudgeted = data.reduce((sum, d) => sum + d.budgeted, 0)
  const totalActual = data.reduce((sum, d) => sum + d.actual, 0)
  const percentUsed = totalBudgeted > 0 ? Math.round((totalActual / totalBudgeted) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-purple-50">
          <p className="text-xs text-gray-500">Budget</p>
          <p className="text-sm font-semibold text-purple-700">
            ${totalBudgeted.toLocaleString()}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-gray-50">
          <p className="text-xs text-gray-500">Spent</p>
          <p className="text-sm font-semibold text-gray-700">
            ${totalActual.toLocaleString()}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${percentUsed > 100 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-xs text-gray-500">Used</p>
          <p className={`text-sm font-semibold ${percentUsed > 100 ? 'text-red-700' : 'text-green-700'}`}>
            {percentUsed}%
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="budgeted" name="budgeted" fill={COLORS.budgeted} radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="actual" name="actual" radius={[0, 4, 4, 0]} barSize={12}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isOverBudget ? COLORS.overBudget : COLORS.actual}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.budgeted }} />
          <span className="text-gray-600">Budgeted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.actual }} />
          <span className="text-gray-600">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.overBudget }} />
          <span className="text-gray-600">Over Budget</span>
        </div>
      </div>

      {/* Individual Category Progress */}
      <div className="space-y-2 pt-2 border-t">
        <p className="text-xs font-medium text-gray-500 uppercase">Category Breakdown</p>
        {chartData.slice(0, 5).map((item) => {
          const percent = item.budgeted > 0 ? Math.min((item.actual / item.budgeted) * 100, 100) : 0
          const isOver = item.actual > item.budgeted

          return (
            <div key={item.category}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-600">{item.name}</span>
                <span className={`font-medium ${isOver ? 'text-red-600' : 'text-gray-700'}`}>
                  {Math.round((item.actual / item.budgeted) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isOver ? 'bg-red-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
