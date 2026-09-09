import * as React from "react"
import { cn } from "@/lib/utils"

interface DividerProps {
  className?: string
  spacing?: "sm" | "md" | "lg"
}

const SPACING = {
  sm: "my-2",
  md: "my-4",
  lg: "my-6",
}

export function Divider({ className, spacing = "md" }: DividerProps) {
  return (
    <div
      className={cn("h-px bg-white/[0.04]", SPACING[spacing], className)}
    />
  )
}
