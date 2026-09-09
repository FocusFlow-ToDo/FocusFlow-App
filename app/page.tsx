"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Play, Pause, RotateCcw, Check, Target, Calendar,
  Sparkles, ChevronRight, LayoutList, Monitor, Loader2,
  Pencil, Trash2, MoreHorizontal, ArrowDownUp
} from "lucide-react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import confetti from "canvas-confetti"
import { useTasks } from "@/hooks/useTasks"
import { useSettings } from "@/hooks/useSettings"
import { useToast } from "@/contexts/ToastContext"
import { useCategories } from "@/hooks/useCategories"
import { StatusMilestones } from "@/components/focus/StatusMilestones"
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer"
import { TaskCard } from "@/components/tasks/TaskCard"
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal"
import { format, isSameDay, addDays, isBefore, startOfDay, isAfter, subDays } from "date-fns"
import { tr } from "date-fns/locale"
import {
  DragDropContext, Droppable, Draggable, type DropResult,
} from "@hello-pangea/dnd"
import type { Task } from "@/types"
import { CategorySymbol } from "@/components/ui/CategorySymbol"
import { TaskContextMenu } from "@/components/tasks/TaskContextMenu"
import { GlobalContextMenu } from "@/components/ui/GlobalContextMenu"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { EmptyState } from "@/components/ui/EmptyState"
import { PRIORITY_CONFIG } from "@/lib/design-tokens"

/* ═══════════════════════════════════════ */
/*  Constants                              */
/* ═══════════════════════════════════════ */
const SVG_SIZE = 200
const RING_RADIUS = 88
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const RING_STROKE = 5

const PRIORITY_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(PRIORITY_CONFIG).map(([k, v]) => [k, v.label])
)

const PRIORITY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(PRIORITY_CONFIG).map(([k, v]) => [k, `${v.color} ${v.bg} ${v.border}`])
)


type SortKey = "order" | "priority" | "date" | "name"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "order", label: "Sıra" },
  { key: "priority", label: "Öncelik" },
  { key: "date", label: "Tarih" },
  { key: "name", label: "İsim" },
]

/* ═══════════════════════════════════════ */
/*  Utilities                              */
/* ═══════════════════════════════════════ */
function sendNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window)) return
  if (Notification.permission === "granted") {
    const n = new Notification(title, { body, icon })
    n.onclick = () => {
      if ((window as any).electron?.ipcRenderer) {
        (window as any).electron.ipcRenderer.send("focus-window")
      } else {
        window.focus()
      }
    }
  }
}

/* ═══════════════════════════════════════ */
/*  Page                                   */
/* ═══════════════════════════════════════ */
export default function FocusPage() {
  const {
    tasks, activeTask, completeTask, uncompleteTask,
    setTaskFocused, updateTask, batchUpdateTasks, deleteTask, hardDeleteTask,
  } = useTasks()
  const { settings, updateSettings } = useSettings()
  const { showToast } = useToast()
  const { categories } = useCategories()

  const showCompleted = settings.showCompleted
  const sortBy = settings.sortBy
  const focusMode = settings.focusMode

  const setShowCompleted = (v: boolean) => updateSettings({ showCompleted: v })
  const setSortBy = (v: SortKey) => updateSettings({ sortBy: v })
  const setFocusMode = (v: "large" | "compact") => updateSettings({ focusMode: v })

  /* ── State ── */
  const [isRunning, setIsRunning] = React.useState(false)
  const [timeLeft, setTimeLeft] = React.useState(() => {
    if (settings.pomodoroTimeLeft !== null) {
      return Math.min(settings.pomodoroTimeLeft, settings.pomodoroFocus * 60)
    }
    return settings.pomodoroFocus * 60
  })
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [deleteModal, setDeleteModal] = React.useState<{ isOpen: boolean, task: Task | null, isHard: boolean }>({ isOpen: false, task: null, isHard: false })
  const [menuOpen, setMenuOpen] = React.useState<string | null>(null)
  const [menuCoords, setMenuCoords] = React.useState({ x: 0, y: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)

  const [globalMenuOpen, setGlobalMenuOpen] = React.useState(false)
  const [globalMenuCoords, setGlobalMenuCoords] = React.useState({ x: 0, y: 0 })

  const [showFocusZone, setShowFocusZone] = React.useState(true)
  const [showPendingList, setShowPendingList] = React.useState(true)
  const [isMounted, setIsMounted] = React.useState(false)
  const [sortMenuOpen, setSortMenuOpen] = React.useState(false)
  const sortMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setSortMenuOpen(false)
    }
    document.addEventListener("mousedown", handler, true)
    return () => document.removeEventListener("mousedown", handler, true)
  }, [])

  // Sync timeLeft back to settings for persistence
  React.useEffect(() => {
    if (settings.pomodoroTimeLeft !== timeLeft && (timeLeft % 5 === 0 || !isRunning)) {
      updateSettings({ pomodoroTimeLeft: timeLeft })
    }
  }, [timeLeft, isRunning, updateSettings, settings.pomodoroTimeLeft])
  const [pendingFilter, setPendingFilter] = React.useState<"smart" | "all" | "today" | "tomorrow">("smart")
  const todayDate = React.useMemo(() => startOfDay(new Date()), [])

  /* ── Derived ── */
  const focusDuration = settings.pomodoroFocus * 60

  const allPendingCount = React.useMemo(() => {
    return tasks.filter((t) => t.status !== "done" && t.status !== "trash" && t.id !== activeTask?.id).length
  }, [tasks, activeTask?.id])

  const { filteredTasks, smartLabel } = React.useMemo(() => {
    let filtered = tasks.filter((t) => t.status !== "done" && t.status !== "trash" && t.id !== activeTask?.id)
    let label = "SIRADAKİ GÖREVLER"

    const isToday = (d: Date) => isSameDay(startOfDay(d), todayDate) || isBefore(startOfDay(d), todayDate)
    const isTomorrow = (d: Date) => isSameDay(startOfDay(d), addDays(todayDate, 1))

    if (pendingFilter === "smart") {
       const todayList = filtered.filter(t => t.dueDate && isToday(new Date(t.dueDate)))
       if (todayList.length > 0) {
         filtered = todayList
         label = "BUGÜNÜN GÖREVLERİ"
       } else {
         const tomorrowList = filtered.filter(t => t.dueDate && isTomorrow(new Date(t.dueDate)))
         if (tomorrowList.length > 0) {
           filtered = tomorrowList
           label = "YARININ GÖREVLERİ"
         } else {
           label = "GENEL GÖREVLER"
         }
       }
    } else if (pendingFilter === "today") {
      filtered = filtered.filter(t => t.dueDate && isToday(new Date(t.dueDate)))
      label = "BUGÜNÜN GÖREVLERİ"
    } else if (pendingFilter === "tomorrow") {
      filtered = filtered.filter(t => t.dueDate && isTomorrow(new Date(t.dueDate)))
      label = "YARININ GÖREVLERİ"
    }

    const sorted = (() => {
      switch (sortBy) {
        case "priority": {
          const prioOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
          return [...filtered].sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority])
        }
        case "date":
          return [...filtered].sort((a, b) => {
            if (!a.dueDate) return 1
            if (!b.dueDate) return -1
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          })
        case "name":
          return [...filtered].sort((a, b) => a.title.localeCompare(b.title, "tr"))
        default:
          return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      }
    })()

    return { filteredTasks: sorted, smartLabel: label }
  }, [tasks, activeTask?.id, sortBy, pendingFilter, todayDate])

  const pendingTasks = filteredTasks

  const completedTasks = React.useMemo(() => {
    let filtered = tasks.filter((t) => t.status === "done")
    
    const isToday = (d: any) => isSameDay(startOfDay(new Date(d)), todayDate)
    const isThisWeek = (d: any) => isAfter(startOfDay(new Date(d)), subDays(todayDate, 7))

    if (pendingFilter === "today") {
      filtered = filtered.filter(t => t.completedAt && isToday(t.completedAt))
    } else if (pendingFilter === "tomorrow") {
      filtered = []
    } else if (pendingFilter === "smart") {
      filtered = filtered.filter(t => t.completedAt && isThisWeek(t.completedAt))
    }

    return filtered.sort((a, b) => {
      const at = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const bt = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return bt - at
    }).slice(0, 15)
  }, [tasks, pendingFilter, todayDate])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const elapsed = focusDuration - timeLeft
  const progress = focusDuration > 0 ? (elapsed / focusDuration) * 100 : 0
  const strokeDashoffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE

  /* ══════════════════════════════ */
  /*  Effects                       */
  /* ══════════════════════════════ */

  // Timer and Focus Time Sync
  const accumulatedRef = React.useRef(0)
  const sessionStartRef = React.useRef<Date | null>(null)

  React.useEffect(() => {
    if (!isRunning || timeLeft <= 0 || !settings.features.pomodoro || !activeTask) {
      sessionStartRef.current = null
      return
    }
    
    if (!sessionStartRef.current) sessionStartRef.current = new Date()

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { 
          setIsRunning(false)
          updateSettings({ pomodoroTimeLeft: 0 })
          return 0 
        }
        accumulatedRef.current += 1
        
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, settings.features.pomodoro, timeLeft, updateSettings, activeTask?.id, updateTask, activeTask?.focusTime, activeTask?.sessions])

  // Final sync on pause, task switch OR app exit
  React.useEffect(() => {
    const handleExitSync = () => {
      if (accumulatedRef.current > 0 && activeTask && sessionStartRef.current) {
        const session = { startTime: sessionStartRef.current.toISOString(), duration: accumulatedRef.current }
        updateTask(activeTask.id, { 
          focusTime: (activeTask.focusTime || 0) + accumulatedRef.current,
          sessions: [...(activeTask.sessions || []), session]
        })
        accumulatedRef.current = 0
      }
    }

    if (!isRunning) {
      handleExitSync()
    }

    window.addEventListener("beforeunload", handleExitSync)
    return () => window.removeEventListener("beforeunload", handleExitSync)
  }, [isRunning, activeTask?.id, updateTask, activeTask?.focusTime, activeTask?.sessions])

  // Timer → 0 session complete
  React.useEffect(() => {
    if (timeLeft === 0 && activeTask && !isCompleting && settings.features.pomodoro) {
      if (settings.notificationsDesktop) {
        sendNotification("FocusFlow", "Pomodoro süresi doldu! İyi iş çıkardın, şimdi mola zamanı.", "/logo.png")
      }
      showToast({
        type: "success",
        message: "🍅 Pomodoro tamamlandı! Çalışma süresi göreve eklendi."
      })
      setIsRunning(false)
      resetTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  // Request Notification Permission
  React.useEffect(() => {
    if (!settings.notificationsDesktop) return
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [settings.notificationsDesktop])

  // Reset timer on task/settings change
  React.useEffect(() => {
    setIsRunning(false)
    setTimeLeft(settings.pomodoroFocus * 60)
  }, [activeTask?.id, settings.pomodoroFocus])

  // Space key
  React.useEffect(() => {
    if (!settings.features.pomodoro) return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return
      if (e.code === "Space" && activeTask) {
        e.preventDefault()
        setIsRunning((r) => !r)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [activeTask, settings.features.pomodoro])

  // Click outside for context menu
  React.useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  /* ══════════════════════════════ */
  /*  Handlers                      */
  /* ══════════════════════════════ */

  const toggleTimer = React.useCallback(() => setIsRunning((r) => !r), [])

  const resetTimer = React.useCallback(() => {
    setIsRunning(false)
    setTimeLeft(settings.pomodoroFocus * 60)
  }, [settings.pomodoroFocus])

  const handleComplete = React.useCallback(async () => {
    if (!activeTask || isCompleting) return
    setIsCompleting(true)
    confetti({
      particleCount: 120, spread: 70, origin: { y: 0.6 },
      colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"],
    })
    setIsRunning(false)
    setTimeLeft(settings.pomodoroFocus * 60)
    const nextPending = pendingTasks.filter((t) => t.id !== activeTask.id)
    setTimeout(async () => {
      await completeTask(activeTask.id)
      showToast({
        type: "success",
        message: "✅ Görev tamamlandı",
        action: { label: "Geri Al", onClick: () => uncompleteTask(activeTask.id) },
      })
      if (nextPending.length > 0) await setTaskFocused(nextPending[0].id)
      setIsCompleting(false)
    }, 1200)
  }, [activeTask, isCompleting, pendingTasks, completeTask, setTaskFocused, settings.pomodoroFocus, showToast, uncompleteTask])

  const handleToggle = React.useCallback(
    async (id: string, completed: boolean) => {
      if (completed) {
        if (activeTask && id === activeTask.id) {
          handleComplete();
          return;
        }
        await completeTask(id)
        showToast({
          type: "success",
          message: "✅ Görev tamamlandı",
          action: { label: "Geri Al", onClick: () => uncompleteTask(id) },
        })
      } else {
        await uncompleteTask(id)
      }
    },
    [activeTask?.id, handleComplete, completeTask, uncompleteTask, showToast],
  )

  const handleDelete = React.useCallback(async (id: string) => {
    await deleteTask(id)
    showToast({ type: "success", message: "🗑 Görev çöp kutusuna taşındı" })
  }, [deleteTask, showToast])

  const handleHardDelete = React.useCallback((id: string) => {
    const task = tasks.find(t => t.id === id)
    if (task) setDeleteModal({ isOpen: true, task, isHard: true })
  }, [tasks])

  const confirmDelete = async () => {
    const { task, isHard } = deleteModal
    if (!task) return
    if (isHard) {
      await hardDeleteTask(task.id)
      showToast({ type: "success", message: "🔥 Görev kalıcı olarak silindi" })
    } else {
      await deleteTask(task.id)
      showToast({ type: "success", message: "🗑 Görev çöp kutusuna taşındı" })
    }
    setDeleteModal({ isOpen: false, task: null, isHard: false })
  }

  const handleSubtaskToggle = React.useCallback(
    async (subtaskId: string) => {
      if (!activeTask) return
      const sub = activeTask.subtasks.find(s => s.id === subtaskId)
      const isFinishing = sub && !sub.completed

      const updated = activeTask.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed, completedAt: !s.completed ? new Date().toISOString() : null } : s,
      )
      await updateTask(activeTask.id, { subtasks: updated })

      if (isFinishing) {
        showToast({
          type: "success",
          message: `✅ "${sub.title}" tamamlandı`,
          action: { 
            label: "Geri Al", 
            onClick: () => {
              const reverted = updated.map(s => s.id === subtaskId ? { ...s, completed: false, completedAt: null } : s)
              updateTask(activeTask.id, { subtasks: reverted })
            } 
          },
        })
      }
    },
    [activeTask, updateTask, showToast],
  )

  const taskCategory = React.useMemo(() => {
    if (!activeTask) return null
    if (activeTask.categoryId) return categories.find(c => c.id === activeTask.categoryId)
    if (activeTask.tags && activeTask.tags.length > 0) {
      const tagName = activeTask.tags[0].toLowerCase()
      return categories.find(c => c.name.toLowerCase() === tagName)
    }
    return null
  }, [activeTask, categories])

  const handleDragEnd = React.useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result
      if (!destination) return

      if (destination.droppableId === "focus-zone") {
        await setTaskFocused(draggableId)
        return
      }

      if (
        source.droppableId === "pending-list" &&
        destination.droppableId === "pending-list"
      ) {
        if (source.index === destination.index) return
        if (sortBy !== "order") setSortBy("order")
        const reordered = Array.from(pendingTasks)
        const [moved] = reordered.splice(source.index, 1)
        reordered.splice(destination.index, 0, moved)
        await batchUpdateTasks(
          reordered.map((t, i) => ({ id: t.id, changes: { order: i } })),
        )
      }
    },
    [pendingTasks, setTaskFocused, batchUpdateTasks, sortBy],
  )

  const focusInput = React.useCallback(() => {
    document.querySelector<HTMLInputElement>("[data-task-input]")?.focus()
  }, [])

  const isEmpty = !activeTask && allPendingCount === 0

  return (
    <div 
      className="h-full flex flex-col relative overflow-hidden"
      onContextMenu={(e) => {
        if (e.defaultPrevented) return
        e.preventDefault()
        setGlobalMenuCoords({ x: e.clientX, y: e.clientY })
        setGlobalMenuOpen(true)
      }}
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="min-h-full px-4 sm:px-6 lg:px-8 pb-32 pt-6">
          <div className="w-full max-w-2xl mx-auto">
            {!isMounted ? null : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <AnimatePresence mode="popLayout">
                {isEmpty && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex flex-col items-center justify-center text-center py-20"
                  >
                    <div className="relative mb-8">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full glass-card flex items-center justify-center">
                        <Target className="w-12 h-12 sm:w-14 h-14 text-zinc-600" strokeWidth={1.2} />
                      </div>
                      <div className="absolute inset-0 -m-3 rounded-full border border-dashed border-white/[0.06] animate-[spin_30s_linear_infinite]" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-zinc-300 tracking-tight mb-2">
                      Odaklanacak bir görev yok
                    </h2>
                    <p className="text-sm text-zinc-600 max-w-xs mx-auto mb-8 leading-relaxed">
                      Aşağıdan yeni bir görev ekleyerek üretken gününüze başlayın.
                    </p>
                    <button
                      onClick={focusInput}
                      className="inline-flex items-center gap-2 accent-bg text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all active:scale-95 accent-shadow"
                    >
                      <Sparkles className="w-4 h-4" />
                      Görev Ekle
                    </button>
                  </motion.div>
                )}

                {!isEmpty && (
                  <div key="content" className="space-y-5">
                    {settings.statusMilestonesEnabled && <StatusMilestones />}

                    {activeTask && (
                      <div className="flex items-center justify-between mb-6 px-2">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setShowFocusZone(!showFocusZone)}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/[0.05] transition-all",
                            "group-hover:bg-white/[0.08] group-hover:border-white/[0.12]",
                            showFocusZone ? "rotate-90" : "rotate-0"
                          )}>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 transition-colors group-hover:text-zinc-300" />
                          </div>
                          <div className="flex flex-col">
                            <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.25em] font-black group-hover:text-zinc-200 transition-colors leading-none mb-1">
                              {activeTask ? "AKTİF GÖREV" : "ODAK BÖLGESİ"}
                            </h3>
                            <div className="h-[2px] w-12 bg-gradient-to-r from-blue-500/50 to-transparent rounded-full group-hover:w-full transition-all duration-500" />
                          </div>
                        </div>
                        
                        {showFocusZone && (
                          <div className="flex items-center bg-[#101018]/50 backdrop-blur-3xl rounded-[22px] p-1.5 border border-white/[0.06] shadow-2xl relative overflow-hidden group/switch">
                            <div
                              className="absolute top-1.5 bottom-1.5 bg-gradient-to-b from-white to-zinc-200 rounded-[16px] shadow-[0_4px_12px_rgba(255,255,255,0.25)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                              style={{ 
                                width: "calc(50% - 0.375rem)", 
                                left: focusMode === "large" ? "0.375rem" : "calc(50% + 0.1875rem)" 
                              }}
                            />
                            <button
                              onClick={() => setFocusMode("large")}
                              className={cn(
                                "relative z-10 flex items-center justify-center gap-2 text-[10px] h-8 px-5 rounded-[12px] transition-all duration-500 w-[100px] font-black tracking-[0.1em]",
                                focusMode === "large" ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-300 hover:scale-105",
                              )}
                            >
                              <Monitor className="w-3.5 h-3.5" strokeWidth={2.5} />
                              ODAK
                            </button>
                            <button
                              onClick={() => setFocusMode("compact")}
                              className={cn(
                                "relative z-10 flex items-center justify-center gap-2 text-[10px] h-8 px-5 rounded-[12px] transition-all duration-500 w-[100px] font-black tracking-[0.1em]",
                                focusMode === "compact" ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-300 hover:scale-105",
                              )}
                            >
                              <LayoutList className="w-3.5 h-3.5" strokeWidth={2.5} />
                              KOMPAKT
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <AnimatePresence>
                      {activeTask && showFocusZone && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, overflow: "hidden" }} 
                          animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: showFocusZone ? "visible" : "hidden" } }} 
                          exit={{ opacity: 0, height: 0, overflow: "hidden" }} 
                          className="px-4 -mx-4"
                        >
                          <Droppable droppableId="focus-zone">
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="relative min-h-[140px]">
                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
                                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />

                                <AnimatePresence mode="popLayout" initial={false}>
                                  <motion.div
                                    key={`active-task-${focusMode}`}
                                    initial={{ opacity: 0, scale: 0.98, filter: "blur(20px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.98, filter: "blur(20px)" }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="relative z-20"
                                    onContextMenu={(e) => {
                                      e.preventDefault()
                                      setMenuCoords({ x: e.clientX, y: e.clientY })
                                      setMenuOpen(activeTask.id)
                                    }}
                                  >
                                    {focusMode === "large" ? (
                                      <div className="space-y-6">
                                        {settings.features.pomodoro && (
                                          <div className="flex flex-col items-center mb-6">
                                            <div className="relative group/timer scale-95 sm:scale-100">
                                              <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="transform -rotate-90 relative z-10">
                                                <circle cx={SVG_SIZE / 2} cy={SVG_SIZE / 2} r={RING_RADIUS} fill="none" stroke="currentColor" className="text-white/[0.03]" strokeWidth={RING_STROKE - 1} />
                                                <circle
                                                  cx={SVG_SIZE / 2} cy={SVG_SIZE / 2} r={RING_RADIUS} fill="none"
                                                  className={cn("transition-all duration-1000 ease-linear", timeLeft === 0 ? "stroke-emerald-500" : isRunning ? "stroke-blue-500" : "stroke-zinc-700")}
                                                  strokeWidth={RING_STROKE} strokeLinecap="round"
                                                  strokeDasharray={RING_CIRCUMFERENCE}
                                                  strokeDashoffset={strokeDashoffset}
                                                />
                                              </svg>
                                              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                                <span className={cn("text-5xl sm:text-6xl font-bold font-mono tracking-tighter tabular-nums transition-all duration-300", isRunning ? "text-white scale-110" : "text-zinc-400 scale-100")}>
                                                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-center gap-3 mt-4">
                                              <div className="flex items-center gap-2 bg-white/[0.05] p-1 rounded-2xl border border-white/[0.05]">
                                                <button onClick={toggleTimer} className={cn("flex items-center justify-center gap-2 h-10 px-6 rounded-xl text-sm font-bold transition-all active:scale-[0.96]", isRunning ? "bg-white/[0.08] text-white" : "accent-bg text-white shadow-lg shadow-blue-500/10")}>
                                                  {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                                  {isRunning ? "Duraklat" : "Başlat"}
                                                </button>
                                                {timeLeft < focusDuration && (
                                                  <button onClick={resetTimer} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.08] text-zinc-400 transition-all active:scale-90">
                                                    <RotateCcw className="w-4 h-4" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        <TaskCard 
                                          task={activeTask} 
                                          variant="focus"
                                          isPremium={true}
                                          onSelect={() => setSelectedTask(activeTask)}
                                          onToggle={handleToggle}
                                          onDelete={() => deleteTask(activeTask.id)}
                                        />
                                      </div>
                                    ) : (
                                        <TaskCard 
                                            task={activeTask} 
                                            isPremium={true}
                                            onToggle={handleToggle} 
                                            onSelect={() => setSelectedTask(activeTask)} 
                                            hideMore 
                                        />
                                    )}
                                  </motion.div>
                                </AnimatePresence>
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {allPendingCount > 0 && (
                      <section className="mt-8">
                        <div className="flex items-center justify-between mb-5 px-1">
                          <div 
                            className="flex items-center gap-2.5 cursor-pointer group"
                            onClick={() => setShowPendingList(!showPendingList)}
                          >
                            <ChevronRight className={cn("w-4 h-4 text-zinc-500 transition-transform group-hover:text-zinc-300", showPendingList && "rotate-90")} />
                            <h3 className="text-xs text-zinc-400 uppercase tracking-[0.2em] font-bold group-hover:text-zinc-200 transition-colors uppercaseTracking">{smartLabel}</h3>
                          </div>
                          {showPendingList && (
                            <div className="flex flex-wrap items-center gap-1 bg-white/[0.03] p-1 rounded-[16px] border border-white/[0.05]">
                              <div className="flex items-center gap-0.5">
                                {[
                                  { id: "smart", label: "Zeki" },
                                  { id: "all", label: "Tümü" },
                                  { id: "today", label: "Bugün" },
                                  { id: "tomorrow", label: "Yarın" },
                                ].map((f) => (
                                  <button key={f.id} onClick={() => setPendingFilter(f.id as any)} className={cn("text-[11px] px-3.5 py-1.5 rounded-[12px] transition-all font-bold tracking-wide", pendingFilter === f.id ? "bg-blue-500/15 text-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-blue-500/20" : "text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-white/5")}>
                                    {f.label}
                                  </button>
                                ))}
                              </div>
                              <div className="w-px h-5 bg-white/10 mx-1.5" />
                              <div className="relative z-30" ref={sortMenuRef}>
                                <button onClick={() => setSortMenuOpen(!sortMenuOpen)} className={cn("flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-[12px] hover:text-zinc-200 hover:bg-white/5 border border-transparent transition-all font-bold tracking-wide", sortMenuOpen ? "text-zinc-200 bg-white/5" : "text-zinc-400")}>
                                  <ArrowDownUp className="w-3.5 h-3.5" />
                                  <span>{SORT_OPTIONS.find((s) => s.key === sortBy)?.label || "Sırala"}</span>
                                </button>
                                <AnimatePresence>
                                  {sortMenuOpen && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute right-0 top-full mt-2 w-36 bg-[#12121a] border border-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] rounded-2xl p-1.5 origin-top z-50 pointer-events-auto"
                                    >
                                      {SORT_OPTIONS.map((s) => (
                                        <button 
                                          key={s.key} 
                                          onClick={() => { setSortBy(s.key); setSortMenuOpen(false); }} 
                                          className={cn("w-full text-left text-[11px] px-3 py-2 rounded-xl transition-all font-bold tracking-wide", sortBy === s.key ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5")}
                                        >
                                          {s.label}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          )}
                        </div>

                        <AnimatePresence>
                          {showPendingList && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, overflow: "hidden" }} 
                              animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: showPendingList ? "visible" : "hidden" } }} 
                              exit={{ opacity: 0, height: 0, overflow: "hidden" }} 
                              className="px-4 -mx-4 pb-2"
                            >
                              <Droppable droppableId="pending-list">
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1 pb-2">
                                    {pendingTasks.map((task, index) => (
                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                          {(p, s) => {
                                            const el = (
                                              <div ref={p.innerRef} {...p.draggableProps}>
                                                <TaskCard 
                                                  task={task} 
                                                  onToggle={handleToggle} 
                                                  onSelect={() => setSelectedTask(task)} 
                                                  onFocusStart={setTaskFocused} 
                                                  onDelete={handleDelete}
                                                  hideDate={pendingFilter !== "all"}
                                                  isDragging={s.isDragging}
                                                  dragHandleProps={p.dragHandleProps}
                                                />
                                              </div>
                                            )
                                            return s.isDragging ? createPortal(el, document.body) : el
                                          }}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    {pendingTasks.length === 0 && (
                                      <div className="py-8 text-center text-sm text-zinc-500">
                                        Bu filtreye uygun görev bulunamadı.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Droppable>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </section>
                    )}

                    {completedTasks.length > 0 && (
                      <section className="pt-2">
                        <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 text-sm text-zinc-600 font-medium px-1 hover:text-zinc-400 transition-colors group">
                          <ChevronRight className={cn("w-4 h-4 transition-transform", showCompleted && "rotate-90")} />
                          Tamamlananlar
                          <span className="text-[11px] glass-badge px-2 py-0.5 rounded-full ml-1 opacity-60">{completedTasks.length}</span>
                        </button>
                        <AnimatePresence>
                          {showCompleted && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, overflow: "hidden" }} 
                              animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: showCompleted ? "visible" : "hidden" } }} 
                              exit={{ opacity: 0, height: 0, overflow: "hidden" }} 
                              className="mt-2 space-y-0.5 px-4 -mx-4 pb-4"
                            >
                              {completedTasks.map((task) => (
                                <TaskCard key={task.id} task={task} onToggle={handleToggle} onSelect={() => setSelectedTask(task)} onDelete={handleDelete} variant="compact" />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </section>
                    )}
                  </div>
                )}
              </AnimatePresence>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>


      <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />

      <TaskContextMenu
        task={activeTask}
        open={menuOpen === (activeTask?.id || null)}
        coords={menuCoords}
        onClose={() => setMenuOpen(null)}
        onToggle={handleToggle}
        onSelect={() => { setSelectedTask(activeTask); setMenuOpen(null) }}
        onDelete={handleDelete}
        onChangeDate={async (id, dueDate) => {
          await updateTask(id, { dueDate })
        }}
        onAssignGroup={async (id, groupId, groupName, groupColor) => {
          await updateTask(id, { groupId, groupName: groupName || null, groupColor: groupColor || null })
        }}
      />

      <ConfirmDeleteModal 
        isOpen={deleteModal.isOpen}
        taskTitle={deleteModal.task?.title || ""}
        title="Görevi Sil"
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        onHardDelete={deleteModal.task ? async () => {
          await hardDeleteTask(deleteModal.task!.id);
          showToast({ type: "success", message: "🔥 Görev kalıcı olarak silindi" });
        } : undefined}
        defaultHard={deleteModal.isHard}
      />

      <GlobalContextMenu 
        open={globalMenuOpen}
        onClose={() => setGlobalMenuOpen(false)}
        coords={globalMenuCoords}
      />
    </div>
  )
}