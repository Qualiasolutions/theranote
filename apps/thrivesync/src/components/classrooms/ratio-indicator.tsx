'use client'

interface RatioIndicatorProps {
  staffCount: number
  studentCount: number
  ratioRequirement: string | null // e.g., "1:6" or "2:12"
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function parseRatio(ratio: string | null): { staffRequired: number; studentsPerStaff: number } | null {
  if (!ratio) return null
  const parts = ratio.split(':')
  if (parts.length !== 2) return null
  const staffRequired = parseInt(parts[0], 10)
  const studentsPerStaff = parseInt(parts[1], 10)
  if (isNaN(staffRequired) || isNaN(studentsPerStaff)) return null
  return { staffRequired, studentsPerStaff }
}

export function calculateRatioMet(
  staffCount: number,
  studentCount: number,
  ratioRequirement: string | null
): boolean {
  const parsed = parseRatio(ratioRequirement)
  if (!parsed || staffCount === 0) return false

  // Calculate how many students each staff member can handle
  const studentsPerStaff = parsed.studentsPerStaff / parsed.staffRequired
  const maxStudents = staffCount * studentsPerStaff

  return studentCount <= maxStudents
}

export function RatioIndicator({
  staffCount,
  studentCount,
  ratioRequirement,
  size = 'md',
  showLabel = true,
}: RatioIndicatorProps) {
  const ratioMet = calculateRatioMet(staffCount, studentCount, ratioRequirement)
  const currentRatio = staffCount > 0 ? `${staffCount}:${studentCount}` : 'N/A'

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${sizeClasses[size]}
          ${ratioMet
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
          }
        `}
      >
        <span
          className={`
            rounded-full
            ${dotSizes[size]}
            ${ratioMet ? 'bg-green-500' : 'bg-red-500'}
          `}
        />
        <span>{currentRatio}</span>
      </div>
      {showLabel && (
        <span className={`text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {ratioMet ? 'Ratio Met' : 'Ratio Not Met'}
        </span>
      )}
    </div>
  )
}

// Compact badge version for cards
export function RatioBadge({
  staffCount,
  studentCount,
  ratioRequirement,
}: Pick<RatioIndicatorProps, 'staffCount' | 'studentCount' | 'ratioRequirement'>) {
  const ratioMet = calculateRatioMet(staffCount, studentCount, ratioRequirement)
  const currentRatio = staffCount > 0 ? `${staffCount}:${studentCount}` : 'N/A'

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
        ${ratioMet
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-red-100 text-red-700 border border-red-200'
        }
      `}
    >
      {currentRatio}
    </span>
  )
}
