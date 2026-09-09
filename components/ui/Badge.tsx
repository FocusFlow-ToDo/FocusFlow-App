import * as React from "react"
import { cn } from "@/lib/utils"
import type { Priority } from "@/types"

const STYLES: Record<Priority, string> = {
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

interface BadgeProps {
  children: React.ReactNode
  priority?: Priority
  className?: string
}

export function Badge({ children, priority = "medium", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold",
        "px-2.5 py-1 rounded-full border",
        STYLES[priority],
        className,
      )}
    >
      {children}
    </span>
  )
}