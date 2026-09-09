"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Calendar, MoreHorizontal, Target, Trash2, Check, Clock, Pencil } from "lucide-react"
import { format, isBefore, isToday, isTomorrow, startOfDay, differenceInDays } from "date-fns"
import { tr } from "date-fns/locale"
import type { Task, Priority } from "@/types"

const PRIORITY_BAR: Record<Priority, string> = { urgent: "bg-red-500", high: "bg-orange-500", medium: "bg-blue-500", low: "bg-emerald-500" }
const PRIORITY_BADGE: Record<Priority, { bg: string; text: string; dot: string }> = {
  urgent: { bg: "bg-red-500/12", text: "text-red-400", dot: "bg-red-500" },
  high: { bg: "bg-orange-500/12", text: "text-orange-400", dot: "bg-orange-500" },
  medium: { bg: "bg-blue-500/12", text: "text-blue-400", dot: "bg-blue-500" },
  low: { bg: "bg-emerald-500/12", text: "text-emerald-400", dot: "bg-emerald-500" },
}
const PRIORITY_LABEL: Record<Priority, string> = { urgent: "Acil", high: "Yüksek", medium: "Orta", low: "Düşük" }

interface TaskCardProps {
  task: Task; onToggle?: (id: string, completed: boolean) => void; onSelect?: () => void
  onFocusStart?: (id: string) => void; onDelete?: (id: string) => void; compact?: boolean
}

export function TaskCard({ task, onToggle, onSelect, onFocusStart, onDelete, compact }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const isDone = task.status === "done"
  const today = startOfDay(new Date())
  const isOverdue = !isDone && task.dueDate && isBefore(startOfDay(new Date(task.dueDate)), today)
  const showBar = task.priority === "urgent" || task.priority === "high"

  React.useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [menuOpen])

  const dateDisplay = React.useMemo(() => {
    if (!task.dueDate) return null; const d = new Date(task.dueDate)
    if (isOverdue) return { text: `${differenceInDays(today, startOfDay(d))}g gecikmiş`, cls: "text-red-400" }
    if (isToday(d)) return { text: "Bugün", cls: "text-blue-400" }
    if (isTomorrow(d)) return { text: "Yarın", cls: "text-zinc-300" }
    return { text: format(d, "d MMM", { locale: tr }), cls: "text-zinc-500" }
  }, [task.dueDate, isOverdue, today])

  const subtaskInfo = React.useMemo(() => {
    if (!task.subtasks?.length) return null; const done = task.subtasks.filter((s) => s.completed).length
    return { done, total: task.subtasks.length, pct: (done / task.subtasks.length) * 100 }
  }, [task.subtasks])

  return (
    <div onClick={onSelect} className={cn(
      "group relative flex items-start gap-3 rounded-xl transition-all duration-150 cursor-pointer",
      compact ? "px-3 py-2.5" : "px-4 py-3.5",
      // ★ Glass card görünümü — daha belirgin
      isDone
        ? "opacity-50 hover:opacity-70 bg-white/[0.01]"
        : "bg-white/[0.025] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1]",
      isOverdue && !isDone && "!bg-red-500/[0.03] !border-red-500/10",
      task.isFocused && !isDone && "!bg-blue-500/[0.04] !border-blue-500/15 ring-1 ring-blue-500/10",
    )}>
      {showBar && !isDone && <div className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-full", PRIORITY_BAR[task.priority])} />}

      <button onClick={(e) => { e.stopPropagation(); onToggle?.(task.id, !isDone) }}
        className={cn("mt-0.5 w-[18px] h-[18px] rounded-[5px] border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 active:scale-[0.85]",
          isDone ? "bg-blue-500 border-blue-500" : "border-zinc-600 hover:border-blue-400 hover:bg-blue-500/5")}>
        {isDone && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}><Check className="w-3 h-3 text-white" strokeWidth={3} /></motion.div>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] sm:text-sm font-medium leading-snug", isDone ? "text-zinc-600 line-through" : "text-zinc-200")}>{task.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {subtaskInfo && !isDone && (
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full bg-blue-500/70 rounded-full" style={{ width: `${subtaskInfo.pct}%` }} /></div>
              <span className="text-[10px] text-zinc-600 tabular-nums">{subtaskInfo.done}/{subtaskInfo.total}</span>
            </div>
          )}
          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] text-zinc-500 bg-white/[0.04] border border-white/[0.04] px-1.5 py-px rounded">#{tag}</span>
          ))}
          {task.createdAt && !isDone && (
            <span className="text-[10px] text-zinc-700 flex items-center gap-0.5"><Clock className="w-[9px] h-[9px]" />{format(new Date(task.createdAt), "HH:mm")}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        {!isDone && !compact && (
          <span className={cn("hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded", PRIORITY_BADGE[task.priority].bg, PRIORITY_BADGE[task.priority].text)}>
            <span className={cn("w-1 h-1 rounded-full", PRIORITY_BADGE[task.priority].dot)} />{PRIORITY_LABEL[task.priority]}
          </span>
        )}
        {dateDisplay && !isDone && <span className={cn("text-[10px] sm:text-[11px] flex items-center gap-1", dateDisplay.cls)}><Calendar className="w-[10px] h-[10px]" />{dateDisplay.text}</span>}
        {isDone && task.completedAt && <span className="text-[10px] text-zinc-600 flex items-center gap-1"><Check className="w-[10px] h-[10px]" />{format(new Date(task.completedAt), "d MMM", { locale: tr })}</span>}

        <div className="relative" ref={menuRef}>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className={cn("p-1 rounded-md transition-all text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.04] opacity-0 group-hover:opacity-100", menuOpen && "!opacity-100 text-zinc-400")}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 top-full mt-1 z-50 glass-dropdown rounded-xl py-1 min-w-[160px]">
              {onSelect && <Pencil onClick={() => { onSelect(); setMenuOpen(false) }}>Düzenle</Pencil>}
              {onFocusStart && !isDone && <MenuBtn icon={Target} onClick={() => { onFocusStart(task.id); setMenuOpen(false) }}>Odaklan</MenuBtn>}
              {!isDone && onToggle && <MenuBtn icon={Check} onClick={() => { onToggle(task.id, true); setMenuOpen(false) }}>Tamamla</MenuBtn>}
              {isDone && onToggle && <MenuBtn icon={Check} onClick={() => { onToggle(task.id, false); setMenuOpen(false) }}>Geri Al</MenuBtn>}
              <div className="h-px bg-white/[0.04] my-1 mx-2" />
              {onDelete && <MenuBtn icon={Trash2} onClick={() => { onDelete(task.id); setMenuOpen(false) }} destructive>Sil</MenuBtn>}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuBtn({ children, icon: Icon, onClick, destructive }: { children: React.ReactNode; icon: React.FC<{ className?: string }>; onClick: () => void; destructive?: boolean }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg mx-1 transition-colors",
        destructive ? "text-red-400 hover:bg-red-500/10" : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200")} style={{ width: "calc(100% - 8px)" }}>
      <Icon className="w-3.5 h-3.5" />{children}
    </button>
  )
}