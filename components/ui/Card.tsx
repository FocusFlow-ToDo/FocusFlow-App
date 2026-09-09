import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  padding?: "sm" | "md" | "lg"
}

const PADDING = {
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
}

export function Card({ children, className, hoverable = false, padding = "lg" }: CardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl mb-4",
        PADDING[padding],
        hoverable && "glass-card-hover cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  )
}
