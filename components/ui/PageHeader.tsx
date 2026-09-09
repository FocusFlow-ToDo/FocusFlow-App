import * as React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  iconColorClass?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  iconColorClass = "bg-white/[0.04] text-zinc-400 border-white/[0.06]",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 flex-wrap", className)}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-2xl border flex items-center justify-center flex-shrink-0",
            iconColorClass,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[16px] font-black text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
