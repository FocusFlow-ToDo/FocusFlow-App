import * as React from "react"
import { cn } from "@/lib/utils"
import { PRIORITY_CONFIG } from "@/lib/design-tokens"

interface PriorityBadgeProps {
  priority: string
  size?: "sm" | "md"
  className?: string
}

export function PriorityBadge({ priority, size = "sm", className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  if (!config) return null

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold uppercase tracking-wider border",
        config.color,
        config.bg,
        config.border,
        size === "sm" && "text-[9px] px-1.5 py-0.5 rounded-md",
        size === "md" && "text-[10px] px-2 py-0.5 rounded-lg",
        className,
      )}
    >
      {config.label}
    </span>
  )
}

interface PriorityDotProps {
  priority: string
  className?: string
}

export function PriorityDot({ priority, className }: PriorityDotProps) {
  const config = PRIORITY_CONFIG[priority]
  if (!config) return null

  return (
    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", config.dot, className)} />
  )
}
