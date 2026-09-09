import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <h3
      className={cn(
        "text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mb-4 px-1",
        className,
      )}
    >
      {children}
    </h3>
  )
}
