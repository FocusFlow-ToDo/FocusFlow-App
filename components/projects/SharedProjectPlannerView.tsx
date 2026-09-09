"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Users,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Tag,
  Activity,
  ListTodo,
  Crown,
  UserCheck,
  Clock,
  Check,
  FolderKanban,
  GripVertical,
  Flag,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  X,
  Settings,
  Pencil,
  MoreVertical,
  CheckSquare,
  AlignLeft,
  ArrowRight,
  Layers
} from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import confetti from "canvas-confetti"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/contexts/ToastContext"
import { cn } from "@/lib/utils"
import type {
  SharedProject,
  SharedProjectTask,
  SharedCategory,
  SharedProjectActivity
} from "@/types"
import { EditSharedProjectModal } from "./EditSharedProjectModal"

interface SharedProjectPlannerViewProps {
  project: SharedProject
  onAddTask: (projectId: string, title: string, categoryId?: string | null, priority?: "low" | "medium" | "high" | "urgent") => Promise<any>
  onUpdateTask?: (projectId: string, taskId: string, updates: { title?: string; description?: string; priority?: "low" | "medium" | "high" | "urgent"; categoryId?: string | null }) => Promise<any>
  onToggleTask: (projectId: string, taskId: string) => Promise<any>
  onDeleteTask: (projectId: string, taskId: string) => Promise<any>
  onRestoreTask?: (projectId: string, task: SharedProjectTask) => Promise<any>
  onMoveTask?: (projectId: string, taskId: string, destCategoryId: string | null, newIndex: number) => Promise<any>
  onReorderTasks?: (projectId: string, newTasks: SharedProjectTask[]) => Promise<any>
  onAddCategory: (projectId: string, name: string, color: string) => Promise<any>
  onUpdateCategory?: (projectId: string, categoryId: string, updates: { name?: string; color?: string }) => Promise<any>
  onDeleteCategory?: (projectId: string, categoryId: string) => Promise<any>
  onUpdateProject?: (projectId: string, updates: any) => Promise<any>
  onUpdateStatus: (projectId: string, status: "planning" | "in_progress" | "completed") => Promise<any>
  onDeleteProject: (projectId: string) => Promise<any>
  onBackToPersonal?: () => void
}

const CATEGORY_COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#06B6D4"]

const PRIORITY_BAR: Record<string, { bar: string; glow: string }> = {
  urgent: { bar: "#ef4444", glow: "0 0 15px rgba(239,68,68,0.5)" },
  high: { bar: "#f97316", glow: "0 0 12px rgba(249,115,22,0.4)" },
  medium: { bar: "#3b82f6", glow: "0 0 8px rgba(59,130,246,0.3)" },
  low: { bar: "#10b981", glow: "0 0 8px rgba(16,185,129,0.3)" },
}

const PRIORITY_BADGES: Record<string, { label: string; text: string; bg: string; dot: string }> = {
  urgent: { label: "Acil", text: "text-red-400", bg: "bg-red-500/12 border-red-500/25", dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" },
  high: { label: "Yüksek", text: "text-orange-400", bg: "bg-orange-500/12 border-orange-500/25", dot: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" },
  medium: { label: "Orta", text: "text-blue-400", bg: "bg-blue-500/12 border-blue-500/25", dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" },
  low: { label: "Düşük", text: "text-emerald-400", bg: "bg-emerald-500/12 border-emerald-500/25", dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" },
}

export function SharedProjectPlannerView({
  project,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onRestoreTask,
  onMoveTask,
  onReorderTasks,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateProject,
  onUpdateStatus,
  onDeleteProject,
  onBackToPersonal
}: SharedProjectPlannerViewProps) {
  const { user } = useAuth()
  const { showToast } = useToast()

  // Display toggles
  const [showCompleted, setShowCompleted] = React.useState(true)
  const [showActivityDrawer, setShowActivityDrawer] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Local optimistic tasks state for instant updates
  const [optimisticTasks, setOptimisticTasks] = React.useState<SharedProjectTask[]>(project.tasks || [])
  React.useEffect(() => {
    setOptimisticTasks(project.tasks || [])
  }, [project.tasks])

  // Horizontal auto-scroll while dragging (exact Planner logic)
  React.useEffect(() => {
    if (!isDragging || !scrollContainerRef.current) return
    let animationFrameId: number
    let scrollSpeed = 0

    const handleMouseMove = (e: MouseEvent) => {
      const container = scrollContainerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const edgeThreshold = 120

      if (e.clientX < rect.left + edgeThreshold) {
        const intensity = Math.max(0, rect.left + edgeThreshold - e.clientX) / edgeThreshold
        scrollSpeed = -20 * intensity
      } else if (e.clientX > rect.right - edgeThreshold) {
        const intensity = Math.max(0, e.clientX - (rect.right - edgeThreshold)) / edgeThreshold
        scrollSpeed = 20 * intensity
      } else {
        scrollSpeed = 0
      }
    }

    const scrollStep = () => {
      if (scrollSpeed !== 0 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += scrollSpeed
      }
      animationFrameId = requestAnimationFrame(scrollStep)
    }

    window.addEventListener("mousemove", handleMouseMove)
    animationFrameId = requestAnimationFrame(scrollStep)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isDragging])

  // Inline task addition state per category column
  const [inlineAddCatId, setInlineAddCatId] = React.useState<string | null>(null)
  const [inlineTitle, setInlineTitle] = React.useState("")
  const [inlinePriority, setInlinePriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium")

  // Add Category column state
  const [showAddCat, setShowAddCat] = React.useState(false)
  const [newCatName, setNewCatName] = React.useState("")
  const [newCatColor, setNewCatColor] = React.useState(CATEGORY_COLORS[0])

  // Settings & Edit Project modal state
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

  // Detailed Task Drawer state (matching Planner's TaskDetailDrawer)
  const [selectedTask, setSelectedTask] = React.useState<SharedProjectTask | null>(null)
  const [drawerTitle, setDrawerTitle] = React.useState("")
  const [drawerDescription, setDrawerDescription] = React.useState("")
  const [drawerPriority, setDrawerPriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium")
  const [drawerCategoryId, setDrawerCategoryId] = React.useState<string | null>(null)

  // Context Menu state
  const [contextMenu, setContextMenu] = React.useState<{
    open: boolean
    x: number
    y: number
    task: SharedProjectTask | null
  }>({ open: false, x: 0, y: 0, task: null })

  // Open Task Detail Drawer
  const openDetailDrawer = (t: SharedProjectTask) => {
    setSelectedTask(t)
    setDrawerTitle(t.title)
    setDrawerDescription(t.description || "")
    setDrawerPriority(t.priority || "medium")
    setDrawerCategoryId(t.categoryId || null)
  }

  // Save changes from Task Detail Drawer
  const handleSaveDrawer = async () => {
    if (!selectedTask || !drawerTitle.trim() || !onUpdateTask) return
    const updatedTitle = drawerTitle.trim()
    const updatedDesc = drawerDescription.trim()
    const updatedPriority = drawerPriority
    const updatedCatId = drawerCategoryId

    setOptimisticTasks(prev =>
      prev.map(t =>
        t.id === selectedTask.id
          ? { ...t, title: updatedTitle, description: updatedDesc, priority: updatedPriority, categoryId: updatedCatId }
          : t
      )
    )

    await onUpdateTask(project.id, selectedTask.id, {
      title: updatedTitle,
      description: updatedDesc,
      priority: updatedPriority,
      categoryId: updatedCatId
    })

    setSelectedTask(null)
    showToast({ type: "success", message: "Görev güncellendi" })
  }

  const isLeader = user?.uid === project.leaderId
  const tasks = optimisticTasks
  const categories = project.categories || []
  const activities = project.activityLog || []

  const DEFAULT_CATEGORIES: SharedCategory[] = React.useMemo(() => [
    { id: "cat_genel", name: "Genel Görevler", color: "#3B82F6", createdBy: project.leaderId },
    { id: "cat_gelistirme", name: "Geliştirme & Fikirler", color: "#8B5CF6", createdBy: project.leaderId },
    { id: "cat_tasarim", name: "Tasarım & UI", color: "#EC4899", createdBy: project.leaderId }
  ], [project.leaderId])

  const displayCategories: SharedCategory[] = React.useMemo(() => {
    if (categories && categories.length > 0) {
      return categories
    }
    return DEFAULT_CATEGORIES
  }, [categories, DEFAULT_CATEGORIES])

  const completedTasks = tasks.filter((t) => t.completed)
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  // ══════════════════════════════════════════════════════════
  // TOGGLE TASK COMPLETION (Exact Planner logic + Undo Toast)
  // ══════════════════════════════════════════════════════════
  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    const isNowDone = !currentCompleted
    if (isNowDone) {
      confetti({ particleCount: 25, spread: 60, origin: { y: 0.7 } })
    }

    setOptimisticTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            completed: isNowDone,
            completedBy: isNowDone ? user?.uid || null : null,
            completedByName: isNowDone ? user?.displayName || "Kullanıcı" : null,
            completedAt: isNowDone ? new Date().toISOString() : null
          }
        }
        return t
      })
    )

    await onToggleTask(project.id, taskId)

    showToast({
      type: "success",
      message: isNowDone ? "✅ Görev tamamlandı" : "↩️ Görev geri alındı",
      action: {
        label: "Geri Al",
        onClick: () => handleToggle(taskId, isNowDone)
      }
    })
  }

  // ══════════════════════════════════════════════════════════
  // DELETE TASK (Exact Planner logic + Undo Toast)
  // ══════════════════════════════════════════════════════════
  const handleDeleteTaskWithUndo = async (taskId: string) => {
    const taskToDelete = optimisticTasks.find(t => t.id === taskId)
    if (!taskToDelete) return

    setOptimisticTasks(prev => prev.filter(t => t.id !== taskId))
    await onDeleteTask(project.id, taskId)

    showToast({
      type: "success",
      message: "🗑 Görev silindi",
      action: {
        label: "Geri Al",
        onClick: async () => {
          if (onRestoreTask) {
            await onRestoreTask(project.id, taskToDelete)
          } else {
            await onAddTask(project.id, taskToDelete.title, taskToDelete.categoryId, taskToDelete.priority)
          }
          setOptimisticTasks(prev => [...prev, taskToDelete].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
        }
      }
    })
  }

  // ══════════════════════════════════════════════════════════
  // DRAG AND DROP (Exact Planner drop-handling logic)
  // ══════════════════════════════════════════════════════════
  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false)
    const { source, destination, draggableId } = result
    if (!destination) return

    // 1. Drag into Trash Zone (Exact Planner trash-zone)
    if (destination.droppableId === "trash-zone") {
      await handleDeleteTaskWithUndo(draggableId)
      return
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    // Decode target (active vs done) and category
    const isDestDone = destination.droppableId.endsWith("-done")
    const destCatId = destination.droppableId.replace("-active", "").replace("-done", "")

    const movedTask = optimisticTasks.find(t => t.id === draggableId)
    if (!movedTask) return

    const otherTasks = optimisticTasks.filter(t => t.id !== draggableId)
    const updatedMovedTask: SharedProjectTask = {
      ...movedTask,
      categoryId: destCatId === "uncategorized" ? null : destCatId,
      completed: isDestDone,
      completedBy: isDestDone ? (user?.uid || null) : null,
      completedByName: isDestDone ? (user?.displayName || "Kullanıcı") : null,
      completedAt: isDestDone ? new Date().toISOString() : null
    }

    if (isDestDone && !movedTask.completed) {
      confetti({ particleCount: 20, spread: 50, origin: { y: 0.7 } })
      showToast({
        type: "success",
        message: "✅ Görev tamamlandı",
        action: {
          label: "Geri Al",
          onClick: () => handleToggle(draggableId, true)
        }
      })
    }

    // Insert at destination index within the target list
    otherTasks.splice(destination.index, 0, updatedMovedTask)
    const nextTasks = otherTasks.map((t, idx) => ({ ...t, order: idx }))

    setOptimisticTasks(nextTasks)

    if (onReorderTasks) {
      await onReorderTasks(project.id, nextTasks)
    } else if (onMoveTask) {
      await onMoveTask(project.id, draggableId, destCatId, destination.index)
    }
  }

  // ══════════════════════════════════════════════════════════
  // INLINE TASK ADDITION (Exact Planner inline UX)
  // ══════════════════════════════════════════════════════════
  const handleInlineSubmit = async (catId: string | null) => {
    if (!inlineTitle.trim()) return
    const title = inlineTitle.trim()
    const priority = inlinePriority

    setInlineTitle("")
    setInlinePriority("medium")

    await onAddTask(project.id, title, catId, priority)
    showToast({ type: "success", message: `Görev eklendi: "${title}"` })
  }

  // Submit category add
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    await onAddCategory(project.id, newCatName.trim(), newCatColor)
    setNewCatName("")
    setShowAddCat(false)
  }

  const handleDeleteProj = async () => {
    if (window.confirm(`"${project.title}" projesini kalıcı olarak silmek istediğinden emin misin? Her iki kullanıcı için de silinecektir.`)) {
      await onDeleteProject(project.id)
    }
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-0 relative select-none"
      onClick={() => setContextMenu({ open: false, x: 0, y: 0, task: null })}
    >
      {/* ══════════════════════════════════════════════════════ */}
      {/* TOP HEADER (Matches Planner layout styling)            */}
      {/* ══════════════════════════════════════════════════════ */}
      <header
        className="px-4 sm:px-6 pt-3.5 pb-2.5 border-b border-white/[0.05] relative overflow-hidden flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${project.color}15 0%, transparent 60%)`
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          {/* Left: Back & Project Title */}
          <div className="flex items-center gap-3 min-w-0">
            {onBackToPersonal && (
              <button
                onClick={onBackToPersonal}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-white/10 shrink-0 shadow-sm"
                title="Tüm Projelerime Dön"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Projelerim</span>
              </button>
            )}

            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-inner border border-white/10 flex-shrink-0"
              style={{ backgroundColor: `${project.color}25` }}
            >
              {project.emoji || "🤝"}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  {project.title}
                </h1>
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${project.color}20`,
                    color: project.color,
                    border: `1px solid ${project.color}40`
                  }}
                >
                  {project.status === "completed"
                    ? "Tamamlandı"
                    : project.status === "in_progress"
                    ? "Devam Ediyor"
                    : "Planlama"}
                </span>
                {project.inviteStatus === "pending" && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Davet Bekleniyor ⏳
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 truncate max-w-md">
                {project.description || "Ortak Görev ve Planlama Panosu"}
              </p>
            </div>
          </div>

          {/* Right: Actions (Planner style toggle, activity, settings) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Show Completed Toggle (Exact Planner Header Feature) */}
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold active:scale-95",
                showCompleted
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-white/[0.04] border-white/[0.08] text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{showCompleted ? "Bitenler Açık" : "Bitenler Gizli"}</span>
            </button>

            {/* Members Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
              <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[80px]">
                {project.leaderName}
              </span>
              <span className="text-zinc-600 font-bold">🤝</span>
              <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[80px]">
                {project.memberName}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>

            {/* Activity Stream Button */}
            <button
              onClick={() => setShowActivityDrawer(!showActivityDrawer)}
              className={cn(
                "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95",
                showActivityDrawer
                  ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20"
                  : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white"
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Aktivite ({activities.length})</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Proje & Alan Ayarları"
            >
              <Settings className="w-3.5 h-3.5 text-purple-400" />
              <span>Ayarlar</span>
            </button>

            {isLeader && (
              <button
                onClick={handleDeleteProj}
                title="Projeyi Sil"
                className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: project.color || "#8B5CF6"
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-purple-300 flex-shrink-0">
            %{progressPercent} ({completedTasks.length}/{tasks.length} Tamamlandı)
          </span>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════ */}
      {/* PLANNER LANES / BOARD (Matches Planner column styling) */}
      {/* ══════════════════════════════════════════════════════ */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-3 sm:p-6 flex flex-col min-h-0"
      >
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-h-full items-start pb-4">
            {displayCategories.map((cat, catIdx) => {
              const isFirst = catIdx === 0
              const catTasks = tasks
                .filter((t) => {
                  if (t.categoryId === cat.id) return true
                  if (isFirst && (!t.categoryId || !displayCategories.some((c) => c.id === t.categoryId))) {
                    return true
                  }
                  return false
                })
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              const catActive = catTasks.filter((t) => !t.completed)
              const catDone = catTasks.filter((t) => t.completed)
              const isInlineOpen = inlineAddCatId === cat.id

              return (
                <div
                  key={cat.id}
                  className={cn(
                    "flex flex-col rounded-[24px] transition-all duration-300 relative group/col shadow-xl flex-shrink-0",
                    "w-[300px] sm:w-[330px] max-h-full",
                    "bg-white/[0.015] hover:bg-white/[0.025] border border-white/[0.05]"
                  )}
                  style={{
                    borderTopColor: cat.color,
                    borderTopWidth: "3px"
                  }}
                >
                  {/* Column Header (Exact Planner visual language) */}
                  <div className="px-4 py-3.5 border-b border-white/[0.04] text-center flex-shrink-0 select-none relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]"
                          style={{ backgroundColor: cat.color, color: cat.color }}
                        />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-300 truncate">
                          {cat.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/5">
                          {catActive.length} aktif
                        </span>
                        <button
                          onClick={() => setInlineAddCatId(isInlineOpen ? null : cat.id)}
                          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90"
                          title="Hızlı Görev Ekle"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Column Active Priority Indicators */}
                    <div className="flex justify-center items-center gap-1.5 mt-2 h-2 min-h-[8px]">
                      {catActive.slice(0, 6).map((t, i) => {
                        const pColor = PRIORITY_BAR[t.priority || "medium"]?.bar || "#3B82F6"
                        return (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: pColor,
                              boxShadow: `0 0 6px ${pColor}80`
                            }}
                          />
                        )
                      })}
                      {catActive.length > 6 && (
                        <span className="text-[9px] text-zinc-500 ml-0.5 font-bold">
                          +{catActive.length - 6}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Column Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 min-h-[140px]">
                    {/* SECTION 1: Active Droppable Zone */}
                    <Droppable droppableId={`${cat.id}-active`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "space-y-2 min-h-[70px] rounded-xl transition-colors",
                            snapshot.isDraggingOver && "bg-blue-500/[0.04] ring-1 ring-blue-500/20 p-1"
                          )}
                        >
                          {catActive.map((t, index) => {
                            const pData = PRIORITY_BADGES[t.priority || "medium"] || PRIORITY_BADGES.medium
                            const pBar = PRIORITY_BAR[t.priority || "medium"] || PRIORITY_BAR.medium

                            return (
                              <Draggable key={t.id} draggableId={t.id} index={index}>
                                {(dp, ds) => (
                                  <div
                                    ref={dp.innerRef}
                                    {...dp.draggableProps}
                                    style={dp.draggableProps.style}
                                    onClick={() => openDetailDrawer(t)}
                                    onContextMenu={(e) => {
                                      e.preventDefault()
                                      setContextMenu({ open: true, x: e.clientX, y: e.clientY, task: t })
                                    }}
                                    className={cn(
                                      "group/task relative flex flex-col cursor-pointer overflow-hidden transition-all duration-300 w-full select-none",
                                      "px-3.5 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.15)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
                                      "hover:bg-white/[0.05] hover:border-white/[0.1]",
                                      ds.isDragging && "!bg-[#1a1a27] !border-purple-500/50 shadow-2xl scale-[1.02] z-50 ring-2 ring-purple-500/30"
                                    )}
                                  >
                                    {/* Left priority vertical glow bar */}
                                    <div
                                      className="absolute left-0 w-1.5 top-3 bottom-3 rounded-r-full transition-all duration-300"
                                      style={{
                                        backgroundColor: pBar.bar,
                                        boxShadow: pBar.glow
                                      }}
                                    />

                                    {/* Top Row: Checkbox + Title + Actions */}
                                    <div className="flex items-start gap-2.5">
                                      {/* Checkbox (Exact TaskCard compact styling) */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleToggle(t.id, t.completed)
                                        }}
                                        className="w-5 h-5 rounded-full border-[1.5px] border-white/[0.18] hover:border-blue-400 bg-black/20 hover:bg-black/30 flex items-center justify-center transition-all active:scale-90 shrink-0 mt-0.5 group/chk"
                                      >
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400/20 scale-0 group-hover/chk:scale-100 transition-transform" />
                                      </button>

                                      {/* Task Title & Description snippet */}
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className="font-bold leading-snug tracking-wide text-[13.5px] text-zinc-100 group-hover/task:text-white transition-colors"
                                        >
                                          {t.title}
                                        </p>
                                        {t.description && (
                                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                                            {t.description}
                                          </p>
                                        )}
                                      </div>

                                      {/* Hover Action Icons */}
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            openDetailDrawer(t)
                                          }}
                                          className="p-1 text-zinc-500 hover:text-purple-300 transition-colors"
                                          title="Detay & Düzenle"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteTaskWithUndo(t.id)
                                          }}
                                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                          title="Sil"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <div
                                          {...dp.dragHandleProps}
                                          className="p-1 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing"
                                          title="Sürükle"
                                        >
                                          <GripVertical className="w-3.5 h-3.5" />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Bottom Metadata Badges */}
                                    <div className="flex items-center gap-1.5 mt-2.5 pl-7">
                                      <span
                                        className={cn(
                                          "px-2 py-0.5 rounded-md text-[9px] font-bold border flex items-center gap-1",
                                          pData.bg,
                                          pData.text
                                        )}
                                      >
                                        <span className={cn("w-1 h-1 rounded-full", pData.dot)} />
                                        <span>{pData.label}</span>
                                      </span>

                                      <span className="text-[10px] text-zinc-500 font-medium px-1.5 py-0.5 rounded-md bg-white/[0.02]">
                                        👤 {t.addedByName}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}

                          {provided.placeholder}

                          {catActive.length === 0 && !isInlineOpen && (
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

                    {/* SECTION 2: Completed Tasks Divider & Drop Zone */}
                    {showCompleted && (
                      <div className="pt-2">
                        <div className="my-2 flex items-center gap-2 select-none">
                          <div className="h-px flex-1 bg-white/[0.06]" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            Bitenler ({catDone.length})
                          </span>
                          <div className="h-px flex-1 bg-white/[0.06]" />
                        </div>

                        <Droppable droppableId={`${cat.id}-done`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                "space-y-1.5 pb-2 min-h-[40px] rounded-xl transition-colors",
                                snapshot.isDraggingOver && "bg-emerald-500/[0.06] ring-1 ring-emerald-500/30 p-2"
                              )}
                            >
                              {catDone.map((t, tIdx) => (
                                <Draggable key={t.id} draggableId={t.id} index={tIdx}>
                                  {(dp, ds) => (
                                    <div
                                      ref={dp.innerRef}
                                      {...dp.draggableProps}
                                      style={dp.draggableProps.style}
                                      onClick={() => openDetailDrawer(t)}
                                      onContextMenu={(e) => {
                                        e.preventDefault()
                                        setContextMenu({ open: true, x: e.clientX, y: e.clientY, task: t })
                                      }}
                                      className={cn(
                                        "group/task relative flex flex-col cursor-pointer overflow-hidden transition-all duration-200 w-full select-none",
                                        "px-3.5 py-2.5 bg-white/[0.01] border border-white/5 rounded-[16px] opacity-60 hover:opacity-100",
                                        ds.isDragging && "!bg-[#1a1a27] !border-emerald-500/50 shadow-2xl scale-[1.02] z-50 ring-2 ring-emerald-500/30 opacity-100"
                                      )}
                                    >
                                      <div className="flex items-start gap-2.5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleToggle(t.id, t.completed)
                                          }}
                                          className="w-5 h-5 rounded-full bg-emerald-500 border border-emerald-500 flex items-center justify-center transition-all active:scale-90 shrink-0 mt-0.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                        >
                                          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                                        </button>

                                        <div className="flex-1 min-w-0">
                                          <p
                                            className="font-medium text-[13px] leading-snug line-through text-zinc-500 decoration-emerald-500/40"
                                          >
                                            {t.title}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDeleteTaskWithUndo(t.id)
                                            }}
                                            className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                          <div
                                            {...dp.dragHandleProps}
                                            className="p-1 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing"
                                          >
                                            <GripVertical className="w-3.5 h-3.5" />
                                          </div>
                                        </div>
                                      </div>

                                      {t.completedByName && (
                                        <div className="pl-7 mt-1 text-[9px] font-bold text-emerald-400">
                                          ✅ {t.completedByName} tamamladı
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}

                              {snapshot.isDraggingOver && catDone.length === 0 && (
                                <div className="text-[10px] text-emerald-400 text-center py-2 font-bold uppercase tracking-wider animate-pulse">
                                  Tamamlamak için buraya bırakın ✦
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </div>

                  {/* Inline Add Task Form (Exact Planner inline UX) */}
                  <AnimatePresence>
                    {isInlineOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden px-3 pb-3"
                      >
                        <div className="bg-[#181824] border border-white/[0.08] rounded-[20px] p-3 shadow-2xl ring-1 ring-white/5">
                          <input
                            autoFocus
                            value={inlineTitle}
                            onChange={(e) => setInlineTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && inlineTitle.trim()) handleInlineSubmit(cat.id)
                              if (e.key === "Escape") setInlineAddCatId(null)
                            }}
                            placeholder="Yeni görev adı..."
                            className="w-full bg-transparent text-[13.5px] font-medium text-white placeholder:text-zinc-600 outline-none focus:outline-none mb-3"
                          />

                          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                            {/* Priority Flags Picker */}
                            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5">
                              {(["low", "medium", "high", "urgent"] as const).map((p) => {
                                const isActive = inlinePriority === p
                                const colors = {
                                  low: isActive ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-600 hover:text-zinc-400",
                                  medium: isActive ? "bg-blue-500/20 text-blue-400" : "text-zinc-600 hover:text-zinc-400",
                                  high: isActive ? "bg-orange-500/20 text-orange-400" : "text-zinc-600 hover:text-zinc-400",
                                  urgent: isActive ? "bg-red-500/20 text-red-400" : "text-zinc-600 hover:text-zinc-400",
                                }
                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setInlinePriority(p)}
                                    className={cn("w-6 h-6 flex items-center justify-center rounded-md transition-all active:scale-90", colors[p])}
                                    title={PRIORITY_BADGES[p].label}
                                  >
                                    <Flag className="w-3 h-3" />
                                  </button>
                                )
                              })}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInlineAddCatId(null)}
                                className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 font-bold"
                              >
                                İptal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInlineSubmit(cat.id)}
                                disabled={!inlineTitle.trim()}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                              >
                                Ekle
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}

            {/* "+ Yeni Alan Ekle" Column */}
            <div className="w-[260px] flex-shrink-0">
              {showAddCat ? (
                <form
                  onSubmit={handleAddCategorySubmit}
                  className="rounded-[24px] bg-white/[0.02] border border-white/10 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Yeni Alan / Kategori</span>
                    <button
                      type="button"
                      onClick={() => setShowAddCat(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Alan adı..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
                  />
                  <div className="flex items-center gap-2">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className={cn(
                          "w-5 h-5 rounded-full transition-transform",
                          newCatColor === c ? "scale-125 ring-2 ring-white" : "opacity-60 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCat(false)}
                      className="px-3 py-1 text-xs text-zinc-500 hover:text-white"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={!newCatName.trim()}
                      className="px-3.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-40"
                    >
                      Oluştur
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddCat(true)}
                  className="w-full h-32 rounded-[24px] border-2 border-dashed border-white/10 hover:border-purple-500/40 bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-purple-300 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-purple-500/20 flex items-center justify-center text-zinc-400 group-hover:text-purple-400 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">Yeni Alan / Kategori Ekle</span>
                </button>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════ */}
          {/* FLOATING TRASH ZONE (Matches Planner trash mechanism)  */}
          {/* ══════════════════════════════════════════════════════ */}
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
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* TASK DETAIL DRAWER (Exact TaskDetailDrawer UX)         */}
      {/* ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 z-[119] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: 500 }}
              animate={{ x: 0 }}
              exit={{ x: 500 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="fixed inset-y-0 right-0 z-[120] w-full max-w-lg bg-[#0e0e13]/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col"
            >
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(selectedTask.id, selectedTask.completed)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedTask.completed
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        : "border-white/20 hover:border-blue-400"
                    )}
                  >
                    {selectedTask.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <span className="text-xs font-bold text-zinc-400">
                    {selectedTask.completed ? "Tamamlandı" : "Devam Ediyor"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleDeleteTaskWithUndo(selectedTask.id)
                      setSelectedTask(null)
                    }}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Görevi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
                {/* Title Input */}
                <div className="space-y-1">
                  <input
                    value={drawerTitle}
                    onChange={(e) => setDrawerTitle(e.target.value)}
                    placeholder="Görev adı..."
                    className="w-full text-xl font-bold bg-transparent border-none text-white focus:outline-none placeholder:text-zinc-600"
                  />
                </div>

                {/* Priority Selection Pills */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-purple-400" />
                    <span>Öncelik Seviyesi</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["low", "medium", "high", "urgent"] as const).map((p) => {
                      const isSelected = drawerPriority === p
                      const pData = PRIORITY_BADGES[p]
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setDrawerPriority(p)}
                          className={cn(
                            "px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5",
                            isSelected
                              ? `${pData.bg} ${pData.text} ring-1 ring-white/20 shadow-md`
                              : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span className="text-[11px]">{pData.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Category / Lane Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Alan / Kategori</span>
                  </label>
                  <select
                    value={drawerCategoryId || ""}
                    onChange={(e) => setDrawerCategoryId(e.target.value || null)}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500/50 cursor-pointer"
                  >
                    {displayCategories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description Textarea */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-purple-400" />
                    <span>Açıklama & Notlar</span>
                  </label>
                  <textarea
                    rows={4}
                    value={drawerDescription}
                    onChange={(e) => setDrawerDescription(e.target.value)}
                    placeholder="Bu göreve dair detaylar, bağlantılar veya notlar..."
                    className="w-full bg-[#181824] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/50 resize-none leading-relaxed"
                  />
                </div>

                {/* Attribution Metadata */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Ekleyen:</span>
                    <span className="font-bold text-white">{selectedTask.addedByName}</span>
                  </div>
                  {selectedTask.completed && selectedTask.completedByName && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Tamamlayan:</span>
                      <span className="font-bold">✅ {selectedTask.completedByName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                    <span>Oluşturulma:</span>
                    <span>{new Date(selectedTask.createdAt).toLocaleDateString("tr-TR")}</span>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={handleSaveDrawer}
                  disabled={!drawerTitle.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all active:scale-95"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════ */}
      {/* CONTEXT MENU (Exact TaskContextMenu right-click UX)    */}
      {/* ══════════════════════════════════════════════════════ */}
      {contextMenu.open && contextMenu.task && (
        <div
          style={{
            position: "fixed",
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            top: Math.min(contextMenu.y, window.innerHeight - 260)
          }}
          className="z-[130] w-52 bg-[#121218]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl space-y-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              if (contextMenu.task) handleToggle(contextMenu.task.id, contextMenu.task.completed)
              setContextMenu({ open: false, x: 0, y: 0, task: null })
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-white/10 hover:text-white transition-colors text-left"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{contextMenu.task.completed ? "Geri Al (Yapılmadı)" : "Tamamlandı İşaretle"}</span>
          </button>

          <button
            onClick={() => {
              if (contextMenu.task) openDetailDrawer(contextMenu.task)
              setContextMenu({ open: false, x: 0, y: 0, task: null })
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-white/10 hover:text-white transition-colors text-left"
          >
            <Pencil className="w-4 h-4 text-purple-400" />
            <span>Detayları Gör & Düzenle</span>
          </button>

          {/* Submenu for priorities */}
          <div className="pt-1 border-t border-white/5">
            <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Öncelik Belirle
            </div>
            <div className="grid grid-cols-4 gap-1 px-2 py-1">
              {(["low", "medium", "high", "urgent"] as const).map((p) => {
                const pData = PRIORITY_BADGES[p]
                return (
                  <button
                    key={p}
                    onClick={async () => {
                      if (!contextMenu.task || !onUpdateTask) return
                      const taskId = contextMenu.task.id
                      setOptimisticTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: p } : t))
                      await onUpdateTask(project.id, taskId, { priority: p })
                      setContextMenu({ open: false, x: 0, y: 0, task: null })
                    }}
                    className={cn(
                      "py-1 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all",
                      contextMenu.task?.priority === p ? `${pData.bg} ${pData.text} ring-1 ring-white/20` : "hover:bg-white/10 text-zinc-400"
                    )}
                  >
                    {pData.label[0]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-1 border-t border-white/5">
            <button
              onClick={() => {
                if (contextMenu.task) handleDeleteTaskWithUndo(contextMenu.task.id)
                setContextMenu({ open: false, x: 0, y: 0, task: null })
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <Trash2 className="w-4 h-4" />
              <span>Görevi Sil</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ACTIVITY LOG DRAWER                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showActivityDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActivityDrawer(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: 380 }}
              animate={{ x: 0 }}
              exit={{ x: 380 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-[#111116] border-l border-white/10 p-5 z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Activity className="w-4 h-4" />
                  <span>Aktivite Geçmişi</span>
                </div>
                <button
                  onClick={() => setShowActivityDrawer(false)}
                  className="p-1 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-3">
                {activities.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-10">Henüz bir aktivite gerçekleşmedi</p>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="font-bold text-purple-300">{act.userName}</span>
                        <span>{new Date(act.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-zinc-300">{act.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════ */}
      {/* EDIT / SETTINGS MODAL                                  */}
      {/* ══════════════════════════════════════════════════════ */}
      <EditSharedProjectModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={project}
        onUpdateProject={onUpdateProject || (async () => {})}
        onDeleteProject={onDeleteProject}
        onAddCategory={onAddCategory}
        onUpdateCategory={onUpdateCategory || (async () => {})}
        onDeleteCategory={onDeleteCategory || (async () => {})}
      />
    </div>
  )
}
