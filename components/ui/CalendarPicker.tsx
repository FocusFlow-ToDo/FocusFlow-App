"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, 
  addMonths, subMonths, isBefore
} from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface CalendarPickerProps {
  selectedDate: Date | null
  onSelect: (date: Date) => void
  onClose: () => void
  today: Date
  allowPastDates?: boolean
  hideTomorrow?: boolean
  activeDates?: Set<string>
}

export function CalendarPicker({ selectedDate, onSelect, onClose, today, allowPastDates = false, hideTomorrow = false, activeDates }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || today)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start with Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

  return (
    <div className="w-[245px] glass-dropdown rounded-2xl p-3.5 shadow-2xl overflow-hidden border border-white/[0.08]">
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-all active:scale-90"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex flex-col items-center">
            <h3 className="text-[12px] font-extrabold text-zinc-200 capitalize tracking-wide">
            {format(currentMonth, "MMMM yyyy", { locale: tr })}
            </h3>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-all active:scale-90"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="h-6 flex items-center justify-center text-[9px] font-extrabold uppercase tracking-widest text-zinc-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isTodayDate = isSameDay(day, today)
          const isPast = !allowPastDates && !isTodayDate && isBefore(day, today)
          const isCurrentMonth = isSameMonth(day, monthStart)
          const hasData = activeDates?.has(format(day, "yyyy-MM-dd"))

          return (
            <button
              key={idx}
              type="button"
              disabled={isPast}
              onClick={() => {
                if (isPast) return
                onSelect(day)
                onClose()
              }}
              className={cn(
                "h-8 rounded-xl flex items-center justify-center text-[12px] font-medium transition-all relative group",
                isPast ? "opacity-20 pointer-events-none" : !isCurrentMonth ? "text-zinc-700 hover:text-zinc-500" : "text-zinc-300",
                isSelected ? "accent-bg text-white shadow-lg shadow-[var(--accent-rgb)/0.3] scale-[1.05]" : "hover:bg-white/5",
                isTodayDate && !isSelected && "text-blue-400"
              )}
            >
              {format(day, "d")}
              {hasData && (
                <div className={cn("absolute top-1.5 right-1.5 w-1 h-1 rounded-full shadow-[0_0_4px_rgba(96,165,250,0.6)]", isSelected ? "bg-white" : "bg-blue-400")} />
              )}
              {isTodayDate && !isSelected && (
                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-blue-500/60" />
              )}
            </button>
          )
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/[0.04] grid grid-cols-2 gap-2">
           <button 
            type="button"
            onClick={() => {
                onSelect(today)
                onClose()
            }}
            className="h-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase tracking-wider hover:bg-blue-500/20 transition-all active:scale-95"
           >
               Bugün
           </button>
           {!hideTomorrow && (
             <button 
              type="button"
              onClick={() => {
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                onSelect(tomorrow);
                onClose();
            }}
            className="h-8 flex items-center justify-center rounded-lg bg-white/[0.03] text-zinc-400 text-[11px] font-bold uppercase tracking-wider hover:bg-white/[0.06] transition-all active:scale-95"
           >
               Yarın
             </button>
           )}
      </div>
    </div>
  )
}
