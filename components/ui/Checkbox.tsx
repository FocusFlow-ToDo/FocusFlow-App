import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { motion } from "motion/react"

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  className?: string
  disabled?: boolean
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  label,
  className,
  disabled,
}: CheckboxProps) {
  const handleClick = React.useCallback(() => {
    if (!disabled) onCheckedChange?.(!checked)
  }, [checked, disabled, onCheckedChange])

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2.5 cursor-pointer group outline-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      <motion.div
        initial={false}
        animate={{
          backgroundColor: checked ? "#3B82F6" : "transparent",
          borderColor: checked ? "#3B82F6" : "#52525B",
        }}
        whileTap={disabled ? undefined : { scale: 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center flex-shrink-0",
          "group-focus-visible:ring-2 group-focus-visible:ring-blue-500/50 group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-[#09090B]",
          !checked && "group-hover:border-zinc-400",
        )}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={
            checked
              ? { scale: 1, opacity: 1 }
              : { scale: 0, opacity: 0 }
          }
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {label && (
        <span
          className={cn(
            "text-sm transition-all duration-200 select-none",
            checked ? "text-zinc-500 line-through" : "text-zinc-200",
          )}
        >
          {label}
        </span>
      )}
    </button>
  )
}