import * as React from "react"
import { cn } from "@/lib/utils"

interface CountBadgeProps {
  count: number
  className?: string
}

export function CountBadge({ count, className }: CountBadgeProps) {
  return (
    <span
      className={cn(
        "text-[10px] font-black tabular-nums text-zinc-600",
        "bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/[0.04]",
        className,
      )}
    >
      {count}
    </span>
  )
}
