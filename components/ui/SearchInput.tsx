import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Ara...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative group", className)}>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-400 pointer-events-none transition-colors" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-xl pl-9 pr-8 text-sm glass-input text-zinc-200 placeholder:text-zinc-600 outline-none focus:outline-none focus:ring-0"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
