'use client'

import { cn } from '@/lib/utils'

interface ComplianceScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ComplianceScore({
  score,
  size = 'md',
  showLabel = true,
  className,
}: ComplianceScoreProps) {
  // Determine color based on score threshold
  const getColor = (value: number) => {
    if (value >= 90) return { stroke: '#22c55e', bg: '#dcfce7', text: 'text-green-600' } // green
    if (value >= 70) return { stroke: '#eab308', bg: '#fef9c3', text: 'text-yellow-600' } // yellow
    return { stroke: '#ef4444', bg: '#fee2e2', text: 'text-red-600' } // red
  }

  const colors = getColor(score)

  // Size configurations
  const sizes = {
    sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { width: 120, strokeWidth: 8, fontSize: 'text-3xl', labelSize: 'text-sm' },
    lg: { width: 180, strokeWidth: 10, fontSize: 'text-5xl', labelSize: 'text-base' },
  }

  const config = sizes[size]
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={config.width}
          height={config.width}
        >
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={colors.bg}
            strokeWidth={config.strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', config.fontSize, colors.text)}>
            {score}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn('mt-2 font-medium text-gray-600', config.labelSize)}>
          Compliance Score
        </span>
      )}
    </div>
  )
}
