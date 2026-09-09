"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  addDays, format, isSameDay, startOfDay, isBefore, differenceInDays,
  isAfter, subDays
} from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/useTasks"
import { useToast } from "@/contexts/ToastContext"
import { useSettings } from "@/hooks/useSettings"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, ChevronRight, Plus, AlertTriangle,
  ArrowRight, Clock, X, Check, Calendar, ChevronDown,
  Tag, Flag, ListTodo, AlignLeft, Trash2, Boxes
} from "lucide-react"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { Draggable, Droppable, DragDropContext, type DropResult } from "@hello-pangea/dnd"
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer"
import { TaskCard } from "@/components/tasks/TaskCard"
import type { Task } from "@/types"
import { StatusMilestones } from "@/components/focus/StatusMilestones"
import { GlobalContextMenu } from "@/components/ui/GlobalContextMenu"
import { CategorySymbol } from "@/components/ui/CategorySymbol"

/* ═══════════════════════════════════════ */
/*  Planner Page                           */
/* ═══════════════════════════════════════ */
export default function PlannerPage() {
  const { 
    tasks, updateTask, addTask, batchUpdateTasks, 
    completeTask, uncompleteTask, setTaskFocused, deleteTask, restoreTask
  } = useTasks()
  const { settings, updateSettings } = useSettings()
  const router = useRouter()
  const [weekStart, setWeekStart] = React.useState(() => startOfDay(new Date()))
  
  const updateWeekStart = React.useCallback((date: Date | ((d: Date) => Date)) => {
    setWeekStart(date)
  }, [])

  const { showToast } = useToast()
  const todayDate = React.useMemo(() => startOfDay(new Date()), [])

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [inlineAddIdx, setInlineAddIdx] = React.useState<number | null>(null)
  const [inlineValue, setInlineValue] = React.useState("")
  const [inlineCategory, setInlineCategory] = React.useState<string | null>(null)
  const [inlinePriority, setInlinePriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium")
  const [globalMenuOpen, setGlobalMenuOpen] = React.useState(false)
  const [globalMenuCoords, setGlobalMenuCoords] = React.useState({ x: 0, y: 0 })
  const inlineRef = React.useRef<HTMLInputElement>(null)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [activeWeekPage, setActiveWeekPage] = React.useState<1 | 2>(1)

  React.useEffect(() => { setIsMounted(true) }, [])

  // Auto-scrolling logic for horizontal drag & drop 
  React.useEffect(() => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    let animationFrameId: number;
    let scrollSpeed = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const edgeThreshold = 120;
      
      if (e.clientX < rect.left + edgeThreshold) {
        const intensity = Math.max(0, rect.left + edgeThreshold - e.clientX) / edgeThreshold;
        scrollSpeed = -20 * intensity;
      } else if (e.clientX > rect.right - edgeThreshold) {
        const intensity = Math.max(0, e.clientX - (rect.right - edgeThreshold)) / edgeThreshold;
        scrollSpeed = 20 * intensity;
      } else {
        scrollSpeed = 0;
      }
    };
    
    const scrollStep = () => {
      if (scrollSpeed !== 0 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += scrollSpeed;
      }
      animationFrameId = requestAnimationFrame(scrollStep);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(scrollStep);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDragging]);

  const handleGlobalContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.group-relative')) return
    if ((e.target as HTMLElement).closest('.group')) return
    if ((e.target as HTMLElement).closest('.flex-shrink-0.select-none')) return 
    e.preventDefault()
    setGlobalMenuCoords({ x: e.clientX, y: e.clientY })
    setGlobalMenuOpen(true)
  }

  // Exactly 2 Weeks (14 Days)
  const days = React.useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const isShowingToday = isSameDay(weekStart, todayDate)

  const [optimisticTasks, setOptimisticTasks] = React.useState<Task[]>(tasks)

  React.useEffect(() => {
    setOptimisticTasks(tasks)
  }, [tasks])

  const getTasksForDay = React.useCallback(
    (day: Date) => optimisticTasks.filter((t) => {
        if (t.status === "trash") return false;
        if (!t.dueDate) return false;

        const taskDate = startOfDay(new Date(t.dueDate));
        const dayDate = startOfDay(day);
        
        if (!isSameDay(taskDate, dayDate)) return false;
        if (t.status !== "done" && isBefore(taskDate, todayDate) && !isSameDay(taskDate, todayDate)) return false;

        return true;
    }).sort((a, b) => a.order - b.order),
    [optimisticTasks, todayDate]
  )

  const overdueTasks = React.useMemo(
    () => optimisticTasks.filter((t) => t.status !== "done" && t.status !== "trash" && t.dueDate && isBefore(t.dueDate, todayDate) && !isSameDay(t.dueDate, todayDate)),
    [optimisticTasks, todayDate],
  )
  const unscheduledTasks = React.useMemo(() => optimisticTasks.filter((t) => {
    if (t.status === "trash") return false;
    return !t.dueDate;
  }), [optimisticTasks])

  const dayLabel = React.useCallback((date: Date) => {
    if (isSameDay(date, todayDate)) return "Bugün"
    if (isSameDay(date, addDays(todayDate, 1))) return "Yarın"
    return format(date, "EEEE", { locale: tr })
  }, [todayDate])

  const closeInline = React.useCallback(() => { 
    setInlineAddIdx(null)
    setInlineValue("")
    setInlineCategory(null)
    setInlinePriority("medium")
  }, [])

  const submitInline = React.useCallback(async () => {
    const title = inlineValue.trim()
    if (!title || inlineAddIdx === null) return
    await addTask({ 
        title, 
        dueDate: days[inlineAddIdx], 
        priority: inlinePriority, 
        categoryId: inlineCategory,
        status: "todo" 
    })
    setInlineValue("")
    setInlineCategory(null)
    setInlinePriority("medium")
    setTimeout(() => inlineRef.current?.focus(), 50)
  }, [inlineValue, inlineAddIdx, days, addTask, inlineCategory, inlinePriority])

  const handleComplete = React.useCallback(async (id: string, done: boolean) => {
    if (done) {
      await completeTask(id)
      showToast({ 
        type: "success", 
        message: "✅ Görev tamamlandı", 
        action: { label: "Geri Al", onClick: () => uncompleteTask(id) } 
      })
    } else {
      await uncompleteTask(id)
    }
  }, [completeTask, uncompleteTask, showToast])

  const handleFocusStart = React.useCallback(async (id: string) => {
    await setTaskFocused(id)
    router.push("/")
  }, [setTaskFocused, router])

  // Direct delete to trash without prompt
  const handleDelete = React.useCallback(async (id: string) => {
    await deleteTask(id)
    showToast({ 
      type: "success", 
      message: "🗑 Görev çöp kutusuna taşındı", 
      action: { label: "Geri Al", onClick: () => restoreTask(id) } 
    })
  }, [deleteTask, restoreTask, showToast])

  const handleChangeDate = React.useCallback(async (id: string, newDate: Date | null) => {
    await updateTask(id, { dueDate: newDate })
    showToast({
      type: "success",
      message: newDate 
        ? `📅 Görev ${format(newDate, "d MMMM", { locale: tr })} tarihine taşındı`
        : "📅 Görev tarihsiz yapıldı"
    })
  }, [updateTask, showToast])

  const handleAssignGroup = React.useCallback(async (id: string, groupId: string | null, groupName?: string | null, groupColor?: string | null, groupIcon?: string | null) => {
    setOptimisticTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      groupId: groupId || null,
      groupName: groupName || null,
      groupColor: groupColor || null,
      groupIcon: groupIcon || null
    } : t))
    await updateTask(id, { 
      groupId: groupId || null, 
      groupName: groupName || null, 
      groupColor: groupColor || null,
      groupIcon: groupIcon || null
    })
    showToast({
      type: "success",
      message: groupName ? `${groupIcon || "🏷️"} "${groupName}" grubuna eklendi` : "Gruptan çıkarıldı"
    })
  }, [updateTask, showToast])

  const handleDragEnd = React.useCallback(async (result: DropResult) => {
    setIsDragging(false)
    const { source, destination, draggableId } = result
    if (!destination) return

    const movedTask = optimisticTasks.find((t) => t.id === draggableId)
    if (!movedTask) return

    // 1. DRAG TO TRASH
    if (destination.droppableId === "trash-zone") {
      deleteTask(draggableId)
      showToast({
        type: "success",
        message: "🗑 Görev çöp kutusuna atıldı",
        action: { label: "Geri Al", onClick: () => restoreTask(draggableId) }
      })
      setOptimisticTasks(prev => prev.filter(t => t.id !== draggableId))
      return
    }

    if (destination.droppableId === "overdue") return

    // Helper to decode target drop area
    // Format: day-{idx}-active OR day-{idx}-done OR day-{idx}
    const isDestDone = destination.droppableId.endsWith("-done")
    const isDestActive = destination.droppableId.endsWith("-active")
    const isSourceDone = source.droppableId.endsWith("-done")

    let dayIdx = -1
    if (destination.droppableId.startsWith("day-")) {
      const parts = destination.droppableId.split("-")
      dayIdx = parseInt(parts[1])
    }

    const targetDate = dayIdx >= 0 && dayIdx < days.length ? days[dayIdx] : null

    // Determine status change
    let nextStatus = movedTask.status
    let nextCompletedAt = movedTask.completedAt

    if (isDestDone && movedTask.status !== "done") {
      nextStatus = "done"
      nextCompletedAt = new Date()
      showToast({ type: "success", message: "✅ Görev tamamlandı!" })
    } else if (isDestActive && movedTask.status === "done") {
      nextStatus = "todo"
      nextCompletedAt = null
      showToast({ type: "info", message: "🔄 Görev tekrar yapılacaklara alındı" })
    }

    // Reorder destination day's tasks with consecutive order indices
    const destDayTasks = optimisticTasks.filter(t => {
      if (t.id === draggableId) return false
      if (!targetDate || !t.dueDate) return false
      if (!isSameDay(new Date(t.dueDate), targetDate)) return false
      return isDestDone ? t.status === "done" : t.status !== "done"
    }).sort((a, b) => (typeof a.order === "number" ? a.order : 0) - (typeof b.order === "number" ? b.order : 0))

    const movedUpdatedTask = {
      ...movedTask,
      dueDate: targetDate !== null ? targetDate : movedTask.dueDate,
      status: nextStatus,
      completedAt: nextCompletedAt,
      order: destination.index
    }

    destDayTasks.splice(destination.index, 0, movedUpdatedTask as any)

    const reorderedUpdates = destDayTasks.map((t, idx) => ({
      id: t.id,
      changes: t.id === draggableId
        ? {
            dueDate: targetDate !== null ? targetDate : movedTask.dueDate,
            status: nextStatus,
            completedAt: nextCompletedAt,
            order: idx
          }
        : { order: idx }
    }))

    // Apply optimistic update
    setOptimisticTasks(prev => {
      const next = prev.map(t => {
        const u = reorderedUpdates.find(up => up.id === t.id)
        return u ? { ...t, ...u.changes } : t
      })
      return next.sort((a, b) => (typeof a.order === "number" ? a.order : 0) - (typeof b.order === "number" ? b.order : 0))
    })

    await batchUpdateTasks(reorderedUpdates)
  }, [optimisticTasks, days, deleteTask, restoreTask, batchUpdateTasks, showToast])

  const handleDragStart = React.useCallback(() => {
    setIsDragging(true)
  }, [])

  // Navigation between Week 1 and Week 2
  const scrollToWeek = (weekNum: 1 | 2) => {
    setActiveWeekPage(weekNum)
    if (scrollContainerRef.current) {
      const targetScroll = weekNum === 1 ? 0 : scrollContainerRef.current.scrollWidth / 2
      scrollContainerRef.current.scrollTo({ left: targetScroll, behavior: "smooth" })
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.35 }} 
      className="h-full flex flex-col relative"
      onContextMenu={handleGlobalContextMenu}
    >
      {/* HEADER */}
      <header className="flex-shrink-0 px-3 sm:px-6 pt-3 sm:pt-4 pb-2 border-b border-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Planlayıcı
              </h1>
              <p className="text-[11px] text-zinc-400">
                14 Günlük Takvim Görünümü
              </p>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => updateSettings({ showCompleted: !settings.showCompleted })}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold active:scale-95",
                settings.showCompleted 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-white/[0.04] border-white/[0.08] text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Check className="w-3.5 h-3.5" />
              {settings.showCompleted ? "Bitenler Açık" : "Bitenler Gizli"}
            </button>
          </div>
        </div>

        {/* 2-WEEK NAV ROW */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/[0.04]">
          <button 
            onClick={() => updateWeekStart((d) => addDays(d, -7))} 
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 px-2 sm:px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all text-sm active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Önceki Hafta</span>
          </button>

          <div className="flex flex-col items-center gap-1.5 min-w-0">
            {/* Week 1 & Week 2 Pill Switcher */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] p-1 rounded-2xl shadow-inner">
              <button
                onClick={() => scrollToWeek(1)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  activeWeekPage === 1
                    ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <span>1. Hafta</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({format(days[0], "d MMM", { locale: tr })} – {format(days[6], "d MMM", { locale: tr })})
                </span>
              </button>

              <button
                onClick={() => scrollToWeek(2)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  activeWeekPage === 2
                    ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <span>2. Hafta</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({format(days[7], "d MMM", { locale: tr })} – {format(days[13], "d MMM", { locale: tr })})
                </span>
              </button>
            </div>

            <AnimatePresence>
              {!isShowingToday && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => {
                    updateWeekStart(startOfDay(new Date()))
                    setActiveWeekPage(1)
                  }} 
                  className="text-[11px] font-medium accent-text accent-bg-soft px-3 py-0.5 rounded-full"
                >
                  Bugüne Dön
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => updateWeekStart((d) => addDays(d, 7))} 
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 px-2 sm:px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all text-sm active:scale-95"
          >
            <span className="hidden sm:inline font-medium">Sonraki Hafta</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="px-3 sm:px-6 pb-32">
          <StatusMilestones />
          
          {!isMounted ? null : (
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {/* 2-WEEK SCROLL CONTAINER */}
              <div 
                ref={scrollContainerRef} 
                className="overflow-x-auto pb-4 -mx-1 px-1 custom-scrollbar"
              >
                <div className="flex gap-3 min-h-[440px] pb-2">
                  {days.map((day, idx) => {
                    const isToday = isSameDay(day, todayDate)
                    const isPast = isBefore(day, todayDate) && !isToday
                    const dayTasks = getTasksForDay(day)
                    const activeTasks = dayTasks.filter(t => t.status !== "done")
                    const doneTasks = dayTasks.filter(t => t.status === "done")
                    const isInlineOpen = inlineAddIdx === idx

                    // Group active tasks by groupId if present
                    const groupedTasksMap = new Map<string, Task[]>()
                    const unGroupedTasks: Task[] = []

                    activeTasks.forEach(t => {
                      if (t.groupId) {
                        const existing = groupedTasksMap.get(t.groupId) || []
                        existing.push(t)
                        groupedTasksMap.set(t.groupId, existing)
                      } else {
                        unGroupedTasks.push(t)
                      }
                    })

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex flex-col rounded-[24px] transition-all duration-500 relative group/col",
                          "min-w-[290px] sm:min-w-[320px] flex-shrink-0 flex-1 max-w-[420px]",
                          isToday ? "bg-gradient-to-b from-blue-500/[0.06] to-transparent border border-blue-500/20 shadow-[0_8px_32px_rgba(59,130,246,0.06)]" : "bg-white/[0.015] hover:bg-white/[0.025] border border-white/[0.05]",
                          isPast && "opacity-40 blur-[0.5px]"
                        )}
                      >
                        {/* Day Header */}
                        <div className={cn("px-4 py-4 border-b text-center flex-shrink-0 select-none relative z-10", isToday ? "border-blue-500/10" : "border-white/[0.04]")}>
                          {isToday && <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />}
                          <div className="flex flex-col items-center justify-center mb-2 min-h-[24px]">
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.25em]",
                              isToday ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" : isPast ? "text-zinc-700" : "text-zinc-400 transition-colors group-hover/col:text-zinc-300")}>
                              {dayLabel(day)}
                            </p>
                            {(isSameDay(day, todayDate) || isSameDay(day, addDays(todayDate, 1))) && (
                              <span className={cn("text-[8px] uppercase tracking-widest font-bold mt-0.5 opacity-60", isToday ? "text-blue-400" : "text-zinc-500")}>
                                {format(day, "EEEE", { locale: tr })}
                              </span>
                            )}
                          </div>
                          <div className={cn("text-[17px] font-black mx-auto w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-500",
                            isToday ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] scale-110" : isPast ? "text-zinc-700 bg-white/[0.015]" : "text-zinc-200 bg-white/[0.04] shadow-sm group-hover/col:bg-white/[0.08]")}>
                            {format(day, "d")}
                          </div>
                          <div className="flex justify-center items-center gap-1.5 mt-3 h-2 min-h-[8px]">
                            {activeTasks.slice(0, 5).map((t, i) => (
                              <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", 
                                t.priority === "urgent" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                t.priority === "high" ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" :
                                t.priority === "medium" ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              )} />
                            ))}
                            {activeTasks.length > 5 && <span className="text-[9px] text-zinc-500 ml-0.5 font-bold">+{activeTasks.length - 5}</span>}
                          </div>
                        </div>

                        {/* SECTION 1: Active (Uncompleted) Tasks */}
                        <Droppable droppableId={`day-${idx}-active`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                "flex-1 px-3 py-2 space-y-1.5 transition-colors duration-200 min-h-[80px]",
                                snapshot.isDraggingOver && "bg-blue-500/[0.03] ring-1 ring-blue-500/20 rounded-xl"
                              )}
                            >
                              {/* Render Grouped Tasks */}
                              {(() => {
                                let activeCounter = 0
                                return (
                                  <>
                                    {Array.from(groupedTasksMap.entries()).map(([gid, gTasks]) => {
                                      const gName = gTasks[0]?.groupName || "Özel Grup"
                                      const gColor = gTasks[0]?.groupColor || "#3B82F6"
                                      const gIcon = gTasks[0]?.groupIcon || "📁"
                                      return (
                                        <div key={gid} className="p-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-1.5 mb-2.5 backdrop-blur-sm shadow-sm transition-all hover:border-white/10">
                                          <div className="flex items-center justify-between px-1.5 py-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div 
                                                className="w-5 h-5 rounded-md flex items-center justify-center text-xs relative flex-shrink-0"
                                                style={{
                                                  backgroundColor: `${gColor}25`,
                                                  border: `1px solid ${gColor}50`,
                                                  color: gColor
                                                }}
                                              >
                                                <CategorySymbol symbol={gIcon} className="w-3 h-3" />
                                              </div>
                                              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-200 truncate">{gName}</span>
                                            </div>
                                            <span 
                                              className="text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0"
                                              style={{
                                                backgroundColor: `${gColor}15`,
                                                color: gColor
                                              }}
                                            >
                                              {gTasks.length}
                                            </span>
                                          </div>
                                          {gTasks.map((task) => {
                                            const itemIdx = activeCounter++
                                            return (
                                              <Draggable key={task.id} draggableId={task.id} index={itemIdx}>
                                                {(dp, ds) => (
                                                  <div
                                                    ref={dp.innerRef}
                                                    {...dp.draggableProps}
                                                    style={dp.draggableProps.style}
                                                    className={cn(ds.isDragging && "z-50 shadow-2xl")}
                                                  >
                                                    <TaskCard
                                                      task={task}
                                                      variant="compact"
                                                      onSelect={() => setSelectedTask(task)}
                                                      onToggle={handleComplete}
                                                      onFocusStart={handleFocusStart}
                                                      onDelete={handleDelete}
                                                      onChangeDate={handleChangeDate}
                                                      onAssignGroup={handleAssignGroup}
                                                      hideDate={true}
                                                      isDragging={ds.isDragging}
                                                      dragHandleProps={dp.dragHandleProps}
                                                    />
                                                  </div>
                                                )}
                                              </Draggable>
                                            )
                                          })}
                                        </div>
                                      )
                                    })}

                                    {/* Render Ungrouped Tasks */}
                                    {unGroupedTasks.map((task) => {
                                      const itemIdx = activeCounter++
                                      return (
                                        <Draggable key={task.id} draggableId={task.id} index={itemIdx}>
                                          {(dp, ds) => (
                                            <div
                                              ref={dp.innerRef}
                                              {...dp.draggableProps}
                                              style={dp.draggableProps.style}
                                              className={cn(ds.isDragging && "z-50 shadow-2xl")}
                                            >
                                              <TaskCard
                                                task={task}
                                                variant="compact"
                                                onSelect={() => setSelectedTask(task)}
                                                onToggle={handleComplete}
                                                onFocusStart={handleFocusStart}
                                                onDelete={handleDelete}
                                                onChangeDate={handleChangeDate}
                                                onAssignGroup={handleAssignGroup}
                                                hideDate={true}
                                                isDragging={ds.isDragging}
                                                dragHandleProps={dp.dragHandleProps}
                                              />
                                            </div>
                                          )}
                                        </Draggable>
                                      )
                                    })}
                                  </>
                                )
                              })()}

                              {provided.placeholder}

                              {activeTasks.length === 0 && !isInlineOpen && (
                                <div className="flex flex-col items-center justify-center py-6 gap-1 opacity-50 group-hover/col:opacity-100 transition-opacity">
                                  <div className="w-7 h-7 rounded-full border border-dashed border-white/[0.1] flex items-center justify-center bg-white/[0.01]">
                                    <Plus className="w-3.5 h-3.5 text-zinc-600" />
                                  </div>
                                  <span className="text-[10px] font-medium text-zinc-600 select-none">Görev yok</span>
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>

                        {/* SECTION 2: Divider & Completed Tasks Drop Zone */}
                        <div className="px-3">
                          <div className="my-2 flex items-center gap-2">
                            <div className="h-px flex-1 bg-white/[0.06]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              Bitenler ({doneTasks.length})
                            </span>
                            <div className="h-px flex-1 bg-white/[0.06]" />
                          </div>

                          <Droppable droppableId={`day-${idx}-done`}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "space-y-1.5 pb-2 min-h-[40px] rounded-xl transition-colors",
                                  snapshot.isDraggingOver && "bg-emerald-500/[0.06] ring-1 ring-emerald-500/30 p-2"
                                )}
                              >
                                {doneTasks.map((task, tIdx) => (
                                  <Draggable key={task.id} draggableId={task.id} index={tIdx}>
                                    {(dp, ds) => (
                                      <div
                                        ref={dp.innerRef}
                                        {...dp.draggableProps}
                                        style={dp.draggableProps.style}
                                        className={cn(ds.isDragging && "z-50 shadow-2xl")}
                                      >
                                        <TaskCard
                                          task={task}
                                          variant="compact"
                                          onSelect={() => setSelectedTask(task)}
                                          onToggle={handleComplete}
                                          onFocusStart={handleFocusStart}
                                          onDelete={handleDelete}
                                          onChangeDate={handleChangeDate}
                                          onAssignGroup={handleAssignGroup}
                                          hideDate={true}
                                          isDragging={ds.isDragging}
                                          dragHandleProps={dp.dragHandleProps}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}

                                {snapshot.isDraggingOver && doneTasks.length === 0 && (
                                  <div className="text-[10px] text-emerald-400 text-center py-2 font-bold uppercase tracking-wider animate-pulse">
                                    Tamamlamak için buraya bırakın ✦
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </div>

                        {/* Inline Add Task Form */}
                        <AnimatePresence>
                          {isInlineOpen && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden px-3">
                              <div className="bg-[#1a1a24] border border-white/[0.08] rounded-[20px] p-3 shadow-2xl ring-1 ring-white/5 mb-2">
                                <input 
                                  ref={inlineRef} 
                                  value={inlineValue} 
                                  onChange={(e) => setInlineValue(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => { 
                                     if (e.key === "Enter" && inlineValue.trim()) submitInline(); 
                                     if (e.key === "Escape") closeInline() 
                                  }}
                                  placeholder="Görev adı..." 
                                  className="w-full bg-transparent text-[14px] font-medium text-white placeholder:text-zinc-600 outline-none focus:outline-none focus:ring-0 mb-3" 
                                />
                                
                                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04]">
                                  <div className="flex items-center gap-1.5">
                                    <CategoryManager 
                                      selectedCategoryId={inlineCategory}
                                      onSelect={setInlineCategory}
                                      variant="minimal"
                                    />

                                    <div className="flex items-center gap-0.5 bg-white/[0.03] p-0.5 rounded-lg border border-white/5">
                                       {(["low", "medium", "high", "urgent"] as const).map((p) => {
                                          const isActive = inlinePriority === p;
                                          const colors = {
                                            low: isActive ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-700 hover:text-zinc-500",
                                            medium: isActive ? "bg-blue-500/20 text-blue-400" : "text-zinc-700 hover:text-zinc-500",
                                            high: isActive ? "bg-orange-500/20 text-orange-400" : "text-zinc-700 hover:text-zinc-500",
                                            urgent: isActive ? "bg-red-500/20 text-red-400" : "text-zinc-700 hover:text-zinc-500",
                                          }
                                          return (
                                            <button 
                                              key={p} 
                                              onClick={() => setInlinePriority(p)}
                                              className={cn("w-6 h-6 flex items-center justify-center rounded-md transition-all active:scale-90", colors[p])}
                                            >
                                              <Flag className="w-3 h-3" />
                                            </button>
                                          )
                                       })}
                                    </div>
                                  </div>

                                  <div className="flex gap-1">
                                    <button onClick={closeInline} className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-white/5 transition-colors">
                                      <X className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={submitInline} 
                                      disabled={!inlineValue.trim()} 
                                      className={cn(
                                        "p-1.5 rounded-lg transition-all active:scale-95", 
                                        inlineValue.trim() ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]" : "bg-white/5 text-zinc-700"
                                      )}
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Add Task Button at bottom of column */}
                        {!isPast && !isInlineOpen && (
                          <div className="p-2 flex-shrink-0 mt-auto bg-gradient-to-t from-[#0a0a0f]/50 to-transparent relative z-20">
                            <button 
                              onClick={() => setInlineAddIdx(idx)}
                              className="w-full h-8 flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/[0.08] text-zinc-500 hover:border-white/[0.2] hover:text-zinc-300 hover:bg-white/[0.03] transition-all active:scale-[0.98] group-hover/col:border-white/[0.15]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold tracking-wide">GÖREV EKLE</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* OVERDUE SECTION */}
              {overdueTasks.length > 0 && (
                <section className="mt-5">
                  <div className="glass-card !border-red-500/10 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-500/10">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-sm font-medium text-red-400">Gecikmiş Görevler</span>
                      <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-semibold">{overdueTasks.length}</span>
                    </div>
                    <Droppable droppableId="overdue" direction="horizontal">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-wrap gap-2 p-3">
                          {overdueTasks.map((task, i) => (
                            <Draggable key={task.id} draggableId={task.id} index={i}>
                              {(dp, ds) => (
                                <div
                                  ref={dp.innerRef}
                                  {...dp.draggableProps}
                                  style={dp.draggableProps.style}
                                  className={cn("min-w-[160px] max-w-[320px]", ds.isDragging && "z-50 shadow-2xl")}
                                >
                                  <TaskCard
                                    task={task}
                                    variant="compact"
                                    onSelect={() => setSelectedTask(task)}
                                    onToggle={handleComplete}
                                    onFocusStart={handleFocusStart}
                                    onDelete={handleDelete}
                                    onChangeDate={handleChangeDate}
                                    onAssignGroup={handleAssignGroup}
                                    dragHandleProps={dp.dragHandleProps}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </section>
              )}

              {/* DRAG TO TRASH DROP ZONE - Always mounted so Droppable never unmounts during drag lifecycle */}
              <div
                className={cn(
                  "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none transform",
                  isDragging
                    ? "opacity-100 translate-y-0 pointer-events-auto scale-100"
                    : "opacity-0 translate-y-8 pointer-events-none scale-95"
                )}
              >
                <Droppable droppableId="trash-zone">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex items-center gap-3 px-8 py-3.5 rounded-2xl border transition-all duration-300 backdrop-blur-2xl shadow-2xl",
                        snapshot.isDraggingOver
                          ? "bg-rose-500/25 border-rose-500 text-rose-300 scale-105 shadow-[0_0_40px_rgba(244,63,94,0.5)]"
                          : "bg-black/90 border-white/20 text-zinc-400 hover:border-rose-500/50"
                      )}
                    >
                      <Trash2 className={cn("w-5 h-5", snapshot.isDraggingOver ? "text-rose-400 animate-bounce" : "text-zinc-500")} />
                      <span className="text-xs font-black uppercase tracking-widest">
                        {snapshot.isDraggingOver ? "Çöp Kutusuna Bırak!" : "Görevi Çöpe Atmak İçin Buraya Sürükle"}
                      </span>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      <GlobalContextMenu
        open={globalMenuOpen}
        onClose={() => setGlobalMenuOpen(false)}
        coords={globalMenuCoords}
      />
    </motion.div>
  )
}