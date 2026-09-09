import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline" | "icon"
  size?: "xs" | "sm" | "md" | "lg" | "icon"
}

const VARIANTS = {
  primary:
    "accent-bg text-white hover:brightness-110 active:brightness-90 accent-shadow active:scale-[0.97]",
  secondary:
    "bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] active:scale-[0.97]",
  ghost:
    "bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
  destructive:
    "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.97]",
  outline:
    "bg-transparent text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04] hover:text-zinc-200 hover:border-white/[0.1] active:scale-[0.97]",
  icon: "p-2 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 rounded-xl",
}

const SIZES = {
  xs: "h-7 px-2.5 text-[11px] gap-1.5",
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-10 px-5 text-sm gap-2",
  icon: "h-9 w-9",
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl",
          "font-bold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
          "disabled:pointer-events-none disabled:opacity-50",
          "cursor-pointer select-none",
          VARIANTS[variant],
          variant !== "icon" && SIZES[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }