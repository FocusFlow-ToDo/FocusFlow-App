import { cn } from "@/lib/utils"

interface ProgressRingProps {
  /** 0-100 */
  progress: number
  size?: number
  strokeWidth?: number
  trackClass?: string
  progressClass?: string
  children?: React.ReactNode
  className?: string
}

export function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 5,
  trackClass = "text-zinc-800/60",
  progressClass = "text-blue-500",
  children,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference
  const center = size / 2

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className={trackClass}
          strokeWidth={strokeWidth}
        />

        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className={cn(progressClass, "transition-all duration-1000 ease-linear")}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}