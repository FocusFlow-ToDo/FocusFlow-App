import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-20",
        className,
      )}
    >
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full glass-card flex items-center justify-center">
          <Icon className="w-12 h-12 text-zinc-600" strokeWidth={1.2} />
        </div>
        <div className="absolute inset-0 -m-3 rounded-full border border-dashed border-white/[0.06] animate-[spin_30s_linear_infinite]" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-300 tracking-tight mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-zinc-600 max-w-xs mx-auto mb-8 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 accent-bg text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all active:scale-95 accent-shadow"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
