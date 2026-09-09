"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { 
  Calendar, MoreHorizontal, Target, Trash2, Check, Clock, Pencil, Tag, Circle, ChevronDown, ListTodo, GripVertical
} from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { format, isBefore, isToday, isTomorrow, startOfDay, differenceInDays } from "date-fns"
import { tr } from "date-fns/locale"
import type { Task, Priority, Subtask } from "@/types"
import { useCategories, type CategoryItem } from "@/hooks/useCategories"
import { useSettings } from "@/hooks/useSettings"
import { useTasks } from "@/hooks/useTasks"
import { CategorySymbol } from "@/components/ui/CategorySymbol"
import { TaskContextMenu } from "./TaskContextMenu"

const PRIORITY_BAR: Record<Priority, string> = {
  urgent: "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]", 
  high: "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]", 
  medium: "bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.2)]", 
  low: "bg-emerald-500/60",
}

const PRIORITY_BADGE: Record<Priority, { bg: string; text: string; dot: string }> = {
  urgent: { bg: "bg-red-500/12", text: "text-red-400", dot: "bg-red-500" },
  high: { bg: "bg-orange-500/12", text: "text-orange-400", dot: "bg-orange-500" },
  medium: { bg: "bg-blue-500/12", text: "text-blue-400", dot: "bg-blue-500" },
  low: { bg: "bg-emerald-500/12", text: "text-emerald-400", dot: "bg-emerald-500" },
}
const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Acil", high: "Yüksek", medium: "Orta", low: "Düşük",
}

const CAT_COLORS_PRESETS: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  rose: "bg-rose-500/10 border-rose-500/30 text-rose-400",
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
}

const CAT_PRESET_HEX: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  rose: "#f43f5e",
  emerald: "#10b981",
  amber: "#f59e0b",
}

const PRIORITY_HEX: Record<Priority, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#3b82f6",
  low: "#10b981",
}

export type TaskCardVariant = "default" | "focus" | "compact" | "sidebar" | "kanban"

interface TaskCardProps {
  task: Task
  onToggle?: (id: string, completed: boolean) => void
  onSelect?: () => void
  onFocusStart?: (id: string) => void
  onDelete?: (id: string) => void
  onHardDelete?: (id: string) => void
  onChangeDate?: (id: string, date: Date | null) => void
  onAssignGroup?: (id: string, groupId: string | null, groupName?: string | null, groupColor?: string | null, groupIcon?: string | null) => void
  variant?: TaskCardVariant
  hideMore?: boolean
  hideDate?: boolean
  isDragging?: boolean
  dragHandleProps?: any
  isPremium?: boolean
}

export function TaskCard({
  task,
  onToggle,
  onSelect,
  onFocusStart,
  onDelete,
  onHardDelete,
  onChangeDate,
  onAssignGroup,
  variant = "default",
  hideMore,
  hideDate,
  isDragging,
  dragHandleProps,
  isPremium,
}: TaskCardProps) {
  const { settings } = useSettings()
  const { tasks, updateTask } = useTasks()
  const { categories } = useCategories()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [menuCoords, setMenuCoords] = React.useState({ x: 0, y: 0 })
  const [isExpanded, setIsExpanded] = React.useState(variant === "focus")
  
  const [optimisticSubtasks, setOptimisticSubtasks] = React.useState(task.subtasks || [])
  React.useEffect(() => { setOptimisticSubtasks(task.subtasks || []) }, [task.subtasks])

  const isCompact = variant === "compact" || variant === "sidebar" || (variant === "default" && settings.appearance.compactMode)
  const isFocus = variant === "focus"
  const isKanban = variant === "kanban"

  const isDone = task.status === "done"
  const today = startOfDay(new Date())
  const isOverdue = !isDone && task.dueDate && isBefore(startOfDay(new Date(task.dueDate)), today)
  const showBar = settings.features.priorities && task.priority

  const dateDisplay = React.useMemo(() => {
    if (!task.dueDate || !settings.appearance.showTaskMetadata.dueDate) return null
    const d = new Date(task.dueDate)
    if (isOverdue) {
      const days = differenceInDays(today, startOfDay(d))
      return { text: `${days}g gecikmiş`, cls: "text-red-400" }
    }
    if (isToday(d)) return { text: "Bugün", cls: "text-blue-400" }
    if (isTomorrow(d)) return { text: "Yarın", cls: "text-zinc-300" }
    return { text: format(d, "d MMM", { locale: tr }), cls: "text-zinc-500" }
  }, [task.dueDate, isOverdue, today, settings.appearance.showTaskMetadata.dueDate])

  const subtaskInfo = React.useMemo(() => {
    if (!task.subtasks?.length) return null
    const done = task.subtasks.filter((s) => s.completed).length
    return { done, total: task.subtasks.length, pct: (done / task.subtasks.length) * 100 }
  }, [task.subtasks])

  const taskCategory = React.useMemo(() => {
    if (!settings.appearance.showTaskMetadata.categoryBadge) return null
    if (task.categoryId) return categories.find(c => c.id === task.categoryId)
    return null
  }, [task.categoryId, categories, settings.appearance.showTaskMetadata.categoryBadge])

  const handleSubtaskToggle = async (subtaskId: string) => {
    if (!task.subtasks) return
    const nextSubtasks = task.subtasks.map(s => 
      s.id === subtaskId ? { 
          ...s, 
          completed: !s.completed, 
          completedAt: !s.completed ? new Date().toISOString() : null 
      } : s
    )
    await updateTask(task.id, { subtasks: nextSubtasks })

    if (nextSubtasks.length > 0 && nextSubtasks.every(s => s.completed)) {
        onToggle?.(task.id, true)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !task.subtasks) return
    const items = Array.from(optimisticSubtasks).sort((a,b) => a.order - b.order)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    const newItems = items.map((t, idx) => ({ ...t, order: idx }))

    setOptimisticSubtasks(newItems)
    await updateTask(task.id, { subtasks: newItems })
  }

  // Priority and Category Colors
  const pColor = PRIORITY_HEX[task.priority] || "#3b82f6"
  const catColorRaw = taskCategory?.color || pColor
  const cColor = catColorRaw.startsWith("#") ? catColorRaw : (CAT_PRESET_HEX[catColorRaw] || pColor)

  const taskCardStyle = React.useMemo(() => {
    if (isDone) return {}
    
    return {
      borderColor: isPremium ? `${cColor}40` : `${cColor}25`,
      boxShadow: isPremium 
        ? `0 32px 64px -16px rgba(0,0,0,0.6), inset 0 1px 1px ${cColor}10`
        : `0 8px 32px -12px ${pColor}15, 0 4px 16px -8px ${cColor}15, inset 0 1px 1px ${cColor}05`,
      background: isPremium 
        ? `linear-gradient(165deg, ${cColor}20 0%, #030307 100%)`
        : `linear-gradient(135deg, ${pColor}10 0%, ${cColor}08 100%)`
    }
  }, [task.priority, cColor, pColor, isDone, isPremium])

  return (
    <motion.div
      layout={(!isCompact && !isKanban && !isDragging) ? "position" : false}
      whileHover={!isDragging ? { y: -2, scale: isFocus ? 1.002 : (isCompact || isKanban) ? 1.005 : 1.01 } : undefined}
      transition={{
        type: "spring",
        stiffness: 550,
        damping: 35,
        mass: 0.5
      }}
      onClick={onSelect}
      onContextMenu={(e) => {
        if (hideMore) return;
        e.preventDefault();
        setMenuCoords({ x: e.clientX, y: e.clientY });
        setMenuOpen(true);
      }}
      style={taskCardStyle}
      className={cn(
        "group relative flex flex-col cursor-pointer overflow-hidden transition-all duration-500 w-full",
        isPremium 
          ? "premium-active-task rounded-[32px] p-8 sm:p-10" 
          : isFocus 
            ? "px-8 py-8 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[32px] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-white/[0.12] mb-6" 
            : isKanban
              ? "px-4 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-[22px] mb-3 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:bg-white/[0.05] hover:border-white/[0.1]"
              : isCompact 
                ? "px-3.5 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-[16px] mb-2 shadow-[0_4px_16px_rgba(0,0,0,0.15)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.05] hover:border-white/[0.1]" 
                : "px-5 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-[22px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] mb-3",
        !isCompact && !isFocus && !isPremium && "hover:bg-white/[0.05] hover:border-white/[0.1] hover:shadow-2xl hover:shadow-black/50",
        isDone ? "opacity-60 grayscale-[0.2]" : "accent-glow-subtle",
        !isCompact && isOverdue && !isDone && "bg-rose-500/[0.04] border-rose-500/20",
        menuOpen && "!bg-white/[0.08] !border-white/[0.15] shadow-2xl scale-[1.01] z-10",
        isDragging && "!bg-white/[0.08] !border-blue-500/40 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] z-50 !cursor-grabbing shadow-blue-500/10",
        taskCategory && !isDone && !isPremium && "border-opacity-40 ring-1 ring-white/5 shadow-2xl"
      )}
    >
      {isPremium && <div className="premium-glow" />}
      {isPremium && <div className="absolute inset-0 animate-shimmer-subtle pointer-events-none" />}
      {/* Priority Indicator */}
      {settings.appearance.showTaskMetadata.priorityBadge && showBar && !isDone && (
        <div 
          className={cn(
            "absolute left-0 w-1.5 transition-all duration-500",
            isPremium ? "top-12 bottom-12 rounded-r-lg" : "top-6 bottom-6 rounded-r-full"
          )}
          style={{ 
            backgroundColor: pColor,
            boxShadow: `0 0 20px ${pColor}80, 2px 0 10px ${pColor}40`
          }}
        />
      )}

      {/* Tightly coupled Top Row Wrapper */}
      <div 
        {...dragHandleProps}
        className={cn(
          "flex w-full cursor-grab active:cursor-grabbing",
          isFocus ? "gap-8 items-start" : isKanban ? "flex-col gap-4" : isCompact ? "gap-3 items-start" : "gap-4 items-start"
        )}
      >
        {/* Checkbox Section */}
        <div className={cn("flex-shrink-0", isKanban ? "flex items-center gap-3 w-full" : "pt-0.5")}>
        <button
          onClick={async (e) => { 
            e.stopPropagation(); 
            const newCompleted = !isDone;
            if (!newCompleted && task.subtasks && task.subtasks.length > 0) {
                const resetSubtasks = task.subtasks.map(s => ({ ...s, completed: false }))
                await updateTask(task.id, { subtasks: resetSubtasks })
            }
            onToggle?.(task.id, newCompleted);
          }}
          className={cn(
            "rounded-full border flex items-center justify-center transition-all duration-500 overflow-hidden relative group/checkbox",
            isFocus ? "w-10 h-10 border-[2.5px]" : (isCompact || isKanban) ? "w-[20px] h-[20px] border-[1.5px]" : "w-6 h-6 border-2",
            isDone
              ? "bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "border-white/[0.18] hover:border-blue-400 bg-black/20 hover:bg-black/30 shadow-inner",
            "active:scale-90",
          )}
        >
          {isDone ? (
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}>
              <Check className={cn(isFocus ? "w-6 h-6" : (isCompact || isKanban) ? "w-3 h-3" : "w-3.5 h-3.5", "text-white")} strokeWidth={isFocus ? 4 : 3.5} />
            </motion.div>
          ) : (
            <div className="absolute inset-0 bg-blue-400/20 scale-0 group-hover/checkbox:scale-100 transition-transform duration-300 rounded-full" />
          )}
        </button>
        {isKanban && (
            <p className={cn(
                "font-bold leading-snug tracking-tight text-[15px] flex-1",
                isDone ? "text-zinc-600 line-through decoration-emerald-500/30" : "text-zinc-100 group-hover:text-white"
            )}>
                {task.title}
            </p>
        )}
      </div>

      {/* Main Content Area */}
      <div className={cn("flex-1 min-w-0 w-full", isFocus ? "space-y-4" : (isCompact || isKanban) ? "space-y-2" : "space-y-2.5")}>
        {!isKanban ? (
          <div className="space-y-1.5">
            <p className={cn(
                "font-bold leading-snug tracking-wide transition-all duration-300",
                isPremium ? "text-3xl" : isFocus ? "text-2xl" : isCompact ? "text-[14px]" : "text-[15.5px]",
                isDone ? "text-zinc-500 font-medium line-through decoration-emerald-500/30" : "text-zinc-100 group-hover:text-white"
            )}>
                {task.title}
            </p>
            {task.description && (
              <p className={cn(
                "text-zinc-500 leading-relaxed whitespace-pre-wrap transition-colors",
                isFocus ? "text-[15px] line-clamp-[6]" : isCompact ? "text-[12px] line-clamp-2 opacity-80" : "text-[13px] line-clamp-2",
                isDone && "opacity-50"
              )}>
                {task.description}
              </p>
            )}
          </div>
        ) : task.description && (
          <p className={cn(
            "text-zinc-500 text-[12px] leading-relaxed line-clamp-2",
            isDone && "opacity-50"
          )}>
            {task.description}
          </p>
        )}

        <div className={cn("flex gap-2 flex-wrap", isKanban ? "items-center" : "items-center gap-2.5")}>
          {settings.features.categories && settings.appearance.showTaskMetadata.categoryBadge && taskCategory && (
            <div 
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-black shadow-sm shrink-0"
              style={{ backgroundColor: `${taskCategory.color}15`, borderColor: `${taskCategory.color}30`, color: taskCategory.color }}
            >
              <CategorySymbol symbol={taskCategory.emoji} className="scale-75" />
              <span className="uppercase tracking-widest leading-none">{taskCategory.name}</span>
            </div>
          )}

          {task.groupName && (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-black shadow-sm shrink-0 backdrop-blur-sm"
              style={{
                backgroundColor: task.groupColor ? `${task.groupColor}18` : 'rgba(59,130,246,0.18)',
                borderColor: task.groupColor ? `${task.groupColor}35` : 'rgba(59,130,246,0.35)',
                color: task.groupColor || '#60A5FA',
                boxShadow: task.groupColor ? `0 0 10px ${task.groupColor}15` : undefined
              }}
            >
              {task.groupIcon ? (
                <CategorySymbol symbol={task.groupIcon} className="w-3 h-3 flex-shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.groupColor || '#60A5FA' }} />
              )}
              <span className="uppercase tracking-widest leading-none font-bold">{task.groupName}</span>
            </div>
          )}

          {settings.appearance.showTaskMetadata.dueDate && dateDisplay && !isDone && !hideDate && (
            <span className={cn(
                "text-[8px] font-black flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5",
                dateDisplay.cls,
                isKanban && "mt-auto"
            )}>
              <Calendar className="w-3 h-3" />
              <span className="uppercase tracking-widest">{dateDisplay.text}</span>
            </span>
          )}

          {settings.appearance.showTaskMetadata.createdAt && task.createdAt && !isDone && (
            <span className={cn(
               "text-[8px] font-bold flex items-center gap-1.5 bg-white/[0.04] border border-white/5 px-2 py-0.5 rounded-lg",
               isKanban ? "text-zinc-500" : "text-zinc-400"
            )}>
              <Clock className="w-3 h-3 opacity-70" />
              <span className="tracking-widest">{format(new Date(task.createdAt), "HH:mm")}</span>
            </span>
          )}
        </div>

        {/* Integrated Subtasks Accordion Header with Progress */}
        {settings.features.subtasks && subtaskInfo && (
          <div className="mt-3.5 space-y-2">
             <button
               onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
               className={cn(
                  "flex items-center overflow-hidden gap-3 w-full group/btn transition-colors focus:outline-none",
                  isExpanded ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
               )}
             >
                <div className="flex items-center gap-2">
                     <ListTodo className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">Alt İşler</span>
                     <span className="text-[10px] font-bold tabular-nums bg-white/[0.04] px-1.5 py-0.5 rounded-md border border-white/[0.05] ml-1">
                        {subtaskInfo.done}<span className="mx-0.5 opacity-40">/</span>{subtaskInfo.total}
                     </span>
                </div>
                <div className={cn("h-px flex-1 transition-colors", isExpanded ? "bg-blue-500/20" : "bg-white/[0.04] group-hover/btn:bg-white/[0.08]")} />
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isExpanded ? "rotate-180" : "opacity-50")} />
             </button>

             {/* Integrated Progress Bar */}
             {!isDone && (
               <div className="h-1 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.03]">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${subtaskInfo.pct}%` }}
                   transition={{ type: "spring", stiffness: 100, damping: 20 }}
                   className="h-full bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-blue-500/30 bg-[length:200%_100%] animate-shimmer"
                 />
               </div>
             )}
          </div>
        )}
           {/* Action Area (Absolute to save space for title) */}
      {!isKanban && !hideMore && !isFocus && (
        <div className="absolute top-2.5 right-2 sm:top-3 sm:right-3.5 z-10">
            <div className="relative">
                <button
                onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuCoords({ x: rect.left, y: rect.bottom + 4 });
                    setMenuOpen(true);
                }}
                className="p-1 sm:p-1.5 rounded-xl opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.08] transition-all bg-black/40 backdrop-blur-sm shadow-sm border border-white/5"
                >
                <MoreHorizontal className={isCompact ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
                </button>
                <TaskContextMenu
                  task={task}
                  open={menuOpen}
                  coords={menuCoords}
                  onClose={() => setMenuOpen(false)}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  onFocusStart={onFocusStart}
                  onDelete={onDelete}
                  onChangeDate={onChangeDate || ((id, d) => updateTask(id, { dueDate: d }))}
                  onAssignGroup={onAssignGroup || ((id, gid, gname, gcol, gico) => updateTask(id, { groupId: gid, groupName: gname, groupColor: gcol, groupIcon: gico }))}
                />
            </div>
        </div>
      )}
      </div>
  </div>

      {/* Full-width Subtasks Drawer */}
      <AnimatePresence>
         {isExpanded && optimisticSubtasks && optimisticSubtasks.length > 0 && (
           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} 
              className="w-full overflow-hidden">
              <div className={cn(
                "w-full flex flex-col",
                !isFocus && !isKanban && "mt-2 pt-2 border-t border-transparent pl-1.5",
                isFocus && "mt-3 pt-2 border-t border-transparent pl-2",
                isKanban && "mt-4 pt-3 border-t border-white/[0.04]"
              )}>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={`subtasks-${task.id}`}>
                    {(provided) => (
                       <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-0.5">
                          {optimisticSubtasks.sort((a,b) => a.order - b.order).map((s, index) => (
                            <Draggable key={s.id} draggableId={s.id} index={index}>
                              {(p, snap) => {
                                const child = (
                                  <motion.div 
                                    ref={p.innerRef} {...p.draggableProps}
                                    onClick={(e: any) => { e.stopPropagation(); handleSubtaskToggle(s.id) }}
                                    className={cn(
                                      "flex items-center group/sub rounded-[14px] border border-transparent transition-all cursor-pointer relative",
                                      isFocus ? "gap-4 py-3 px-4 hover:bg-white/[0.04] hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:border-white/[0.04]" : 
                                      isKanban ? "gap-2 py-1 px-1.5 hover:bg-white/[0.03]" : "gap-3 py-1.5 px-2 hover:bg-white/[0.04]",
                                      snap.isDragging ? "z-[99999] shadow-2xl bg-[#1a1a24] border-white/20 opacity-100 ring-2 ring-blue-500/30" : ""
                                    )}
                                    style={p.draggableProps.style}
                                  >
                                    <div 
                                      {...p.dragHandleProps}
                                      onClick={(e: any) => e.stopPropagation()}
                                      className="opacity-20 group-hover/sub:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300 p-1 -ml-1 -my-2 flex-shrink-0"
                                    >
                                      <GripVertical className={cn(isFocus ? "w-4 h-4" : "w-3.5 h-3.5")} />
                                    </div>

                                    <div className={cn(
                                      "rounded-md border flex items-center justify-center transition-all flex-shrink-0 shadow-inner relative overflow-hidden",
                                      isFocus ? "w-[22px] h-[22px] border-[1.5px]" : (isKanban || isCompact) ? "w-3.5 h-3.5" : "w-4 h-4",
                                      s.completed ? "bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]" : "border-white/[0.2] group-hover/sub:border-white/40 bg-black/20 group-hover/sub:bg-black/30"
                                    )}>
                                      {s.completed && <Check className={cn(isFocus ? "w-4 h-4" : "w-2.5 h-2.5", "text-white")} strokeWidth={4} />}
                                    </div>
                                    <span className={cn(
                                      "font-semibold flex-1 block leading-snug transition-all",
                                      isFocus ? "text-lg truncate" : (isKanban || isCompact) ? "text-[11.5px] line-clamp-2" : "text-[14px] truncate",
                                      s.completed ? "text-zinc-600 line-through decoration-emerald-500/20" : "text-zinc-300 group-hover/sub:text-zinc-100"
                                    )}>
                                      {s.title}
                                    </span>
                                  </motion.div>
                                );

                                if (snap.isDragging && typeof document !== "undefined") {
                                   return createPortal(child, document.body);
                                }
                                return child;
                              }}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                       </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* Floating Meta for Kanban */}
      {isKanban && !hideMore && (
          <div className="absolute top-2 right-2">
               <button
                onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuCoords({ x: rect.left, y: rect.bottom + 4 });
                    setMenuOpen(true);
                }}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.08] transition-all"
                >
                <MoreHorizontal className="w-4 h-4" />
                </button>
                <TaskContextMenu
                  task={task}
                  open={menuOpen}
                  coords={menuCoords}
                  onClose={() => setMenuOpen(false)}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  onFocusStart={onFocusStart}
                  onDelete={onDelete}
                  onChangeDate={onChangeDate || ((id, d) => updateTask(id, { dueDate: d }))}
                  onAssignGroup={onAssignGroup || ((id, gid, gname, gcol, gico) => updateTask(id, { groupId: gid, groupName: gname, groupColor: gcol, groupIcon: gico }))}
                />
          </div>
      )}
    </motion.div>
  )
}