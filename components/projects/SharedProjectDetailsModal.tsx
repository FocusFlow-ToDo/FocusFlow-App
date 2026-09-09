"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
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
  ChevronRight,
  PlusCircle
} from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import confetti from "canvas-confetti"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import type {
  SharedProject,
  SharedProjectTask,
  SharedCategory,
  SharedProjectActivity
} from "@/types"

interface SharedProjectDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  project: SharedProject | null
  onAddTask: (projectId: string, title: string, categoryId?: string | null, priority?: "low" | "medium" | "high" | "urgent") => Promise<any>
  onToggleTask: (projectId: string, taskId: string) => Promise<any>
  onDeleteTask: (projectId: string, taskId: string) => Promise<any>
  onMoveTask?: (projectId: string, taskId: string, destCategoryId: string | null, newIndex: number) => Promise<any>
  onReorderTasks?: (projectId: string, newTasks: SharedProjectTask[]) => Promise<any>
  onAddCategory: (projectId: string, name: string, color: string) => Promise<any>
  onUpdateStatus: (projectId: string, status: "planning" | "in_progress" | "completed") => Promise<any>
  onDeleteProject: (projectId: string) => Promise<any>
}

const CATEGORY_COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#06B6D4"]

const PRIORITY_BADGES: Record<string, { label: string; text: string; bg: string; dot: string }> = {
  urgent: { label: "Acil", text: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-500" },
  high: { label: "Yüksek", text: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", dot: "bg-orange-500" },
  medium: { label: "Orta", text: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", dot: "bg-blue-500" },
  low: { label: "Düşük", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" },
}

export function SharedProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onMoveTask,
  onReorderTasks,
  onAddCategory,
  onUpdateStatus,
  onDeleteProject
}: SharedProjectDetailsModalProps) {
  const { user } = useAuth()

  const [activeView, setActiveView] = React.useState<"planner" | "activity">("planner")

  // Inline task addition state per category column (like the Planner's inlineAdd)
  const [inlineAddCatId, setInlineAddCatId] = React.useState<string | null>(null)
  const [inlineTitle, setInlineTitle] = React.useState("")
  const [inlinePriority, setInlinePriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium")

  // New Category Modal / Input state
  const [showAddCat, setShowAddCat] = React.useState(false)
  const [newCatName, setNewCatName] = React.useState("")
  const [newCatColor, setNewCatColor] = React.useState(CATEGORY_COLORS[0])

  if (!isOpen || !project) return null

  const isLeader = user?.uid === project.leaderId

  const tasks = project.tasks || []
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

  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      confetti({ particleCount: 25, spread: 60, origin: { y: 0.7 } })
    }
    await onToggleTask(project.id, taskId)
  }

  // Handle Drag & Drop across categories and within columns
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const destCatId = destination.droppableId === "uncategorized" ? null : destination.droppableId

    if (onMoveTask) {
      await onMoveTask(project.id, draggableId, destCatId, destination.index)
    } else if (onReorderTasks) {
      const reordered = Array.from(tasks)
      const movedItem = reordered.find((t) => t.id === draggableId)
      if (!movedItem) return

      const withoutMoved = reordered.filter((t) => t.id !== draggableId)
      const updatedMovedItem = { ...movedItem, categoryId: destCatId }
      withoutMoved.splice(destination.index, 0, updatedMovedItem)
      const nextTasks = withoutMoved.map((t, idx) => ({ ...t, order: idx }))

      await onReorderTasks(project.id, nextTasks)
    }
  }

  // Submit inline task add
  const handleInlineSubmit = async (catId: string | null) => {
    if (!inlineTitle.trim()) return
    await onAddTask(project.id, inlineTitle.trim(), catId, inlinePriority)
    setInlineTitle("")
    setInlineAddCatId(null)
    setInlinePriority("medium")
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
    if (window.confirm(`"${project.title}" projesini kalıcı olarak silmek istediğinden emin misin? Her iki taraf için de silinecektir.`)) {
      await onDeleteProject(project.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-[#0c0c12] border border-white/10 rounded-[32px] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[92vh]"
      >
        {/* TOP BANNER / PROJECT HEADER */}
        <div
          className="p-5 sm:p-6 border-b border-white/5 relative overflow-hidden flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${project.color}18 0%, transparent 70%)`
          }}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10 flex-shrink-0"
                style={{ backgroundColor: `${project.color}25` }}
              >
                {project.emoji || "🤝"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white">{project.title}</h2>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Davet Bekleniyor ⏳
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-xs text-zinc-400 max-w-xl line-clamp-1">{project.description}</p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Members Bar & Controls */}
          <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {/* Leader */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-black text-purple-300 overflow-hidden">
                  {project.leaderPhotoURL ? (
                    <img src={project.leaderPhotoURL} alt={project.leaderName} className="w-full h-full object-cover" />
                  ) : (
                    project.leaderName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{project.leaderName}</span>
                  <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> Lider
                  </span>
                </div>
              </div>

              <span className="text-zinc-600 font-bold text-xs">🤝</span>

              {/* Member */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-300 overflow-hidden">
                  {project.memberPhotoURL ? (
                    <img src={project.memberPhotoURL} alt={project.memberName} className="w-full h-full object-cover" />
                  ) : (
                    project.memberName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{project.memberName}</span>
                  <span className="text-[9px] font-bold text-blue-400 flex items-center gap-0.5">
                    <UserCheck className="w-2.5 h-2.5" /> Ortak
                  </span>
                </div>
              </div>

              {/* Live sync pulse */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Canlı Senkronize</span>
              </div>
            </div>

            {/* Target Date, Status & View Toggle */}
            <div className="flex items-center gap-2">
              {project.targetDate && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>{new Date(project.targetDate).toLocaleDateString("tr-TR")}</span>
                </div>
              )}

              {/* View Switcher: Planner vs Activity */}
              <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08]">
                <button
                  onClick={() => setActiveView("planner")}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    activeView === "planner" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Planlayıcı Görünümü</span>
                </button>
                <button
                  onClick={() => setActiveView("activity")}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    activeView === "activity" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Aktivite ({activities.length})</span>
                </button>
              </div>

              {/* Status Select */}
              <select
                value={project.status}
                onChange={(e) => onUpdateStatus(project.id, e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-xs font-bold text-zinc-300 outline-none cursor-pointer hover:bg-white/10"
              >
                <option value="planning" className="bg-zinc-900 text-white">Planlama</option>
                <option value="in_progress" className="bg-zinc-900 text-white">Devam Ediyor</option>
                <option value="completed" className="bg-zinc-900 text-white">Tamamlandı</option>
              </select>

              {isLeader && (
                <button
                  onClick={handleDeleteProj}
                  title="Projeyi Sil"
                  className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-zinc-500">İlerleme: {completedTasks.length} / {tasks.length} Görev</span>
              <span className="text-purple-300">%{progressPercent}</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: project.color || "#8B5CF6"
                }}
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: PLANNER COLUMNS (Like app/planner/page.tsx)      */}
        {/* ======================================================== */}
        {activeView === "planner" && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-4 sm:p-6 flex flex-col min-h-0">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-4 min-h-full items-start pb-2">
                {/* Render Each Category as a Planner Column */}
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
                      className="flex flex-col rounded-[24px] bg-white/[0.015] hover:bg-white/[0.025] border border-white/[0.06] w-[310px] sm:w-[330px] flex-shrink-0 max-h-full transition-all duration-300 shadow-xl relative group/col"
                      style={{
                        borderTopColor: cat.color,
                        borderTopWidth: "3px"
                      }}
                    >
                      {/* Column Header (Planner Style) */}
                      <div className="px-4 py-3.5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0 select-none">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]"
                            style={{ backgroundColor: cat.color, color: cat.color }}
                          />
                          <div className="min-w-0">
                            <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">
                              {cat.name}
                            </h3>
                            <span className="text-[10px] text-zinc-500 font-bold">
                              {catActive.length} aktif • {catDone.length} bitti
                            </span>
                          </div>
                        </div>

                        {/* Priority Dots indicator */}
                        <div className="flex items-center gap-1">
                          {catActive.slice(0, 4).map((t) => {
                            const pDot = PRIORITY_BADGES[t.priority || "medium"]?.dot || "bg-blue-500"
                            return <span key={t.id} className={cn("w-1.5 h-1.5 rounded-full", pDot)} />
                          })}
                        </div>
                      </div>

                      {/* Droppable Task Area */}
                      <Droppable droppableId={cat.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "flex-1 px-3 py-3 space-y-2 overflow-y-auto custom-scrollbar min-h-[140px] transition-colors",
                              snapshot.isDraggingOver && "bg-purple-500/[0.03] ring-1 ring-purple-500/20 rounded-xl"
                            )}
                          >
                            {catTasks.length === 0 && !isInlineOpen && (
                              <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                                <p className="text-[11px] text-zinc-600 font-bold">Bu alanda görev yok</p>
                                <p className="text-[10px] text-zinc-700 mt-0.5">Aşağıdan hemen ekle</p>
                              </div>
                            )}

                            {catTasks.map((t, index) => {
                              const pInfo = PRIORITY_BADGES[t.priority || "medium"] || PRIORITY_BADGES.medium

                              return (
                                <Draggable key={t.id} draggableId={t.id} index={index}>
                                  {(dp, ds) => (
                                    <div
                                      ref={dp.innerRef}
                                      {...dp.draggableProps}
                                      style={dp.draggableProps.style}
                                      className={cn(
                                        "group/task rounded-[18px] border transition-all duration-200 p-3 select-none",
                                        t.completed
                                          ? "bg-white/[0.01] border-white/5 opacity-55"
                                          : "bg-[#13131c]/90 border-white/[0.07] hover:border-white/20 hover:bg-[#181824] shadow-md",
                                        ds.isDragging && "!bg-[#1f1f2e] !border-purple-500/50 shadow-2xl scale-[1.02] z-50 ring-2 ring-purple-500/30"
                                      )}
                                    >
                                      <div className="flex items-start gap-2.5">
                                        {/* Checkbox */}
                                        <button
                                          onClick={() => handleToggle(t.id, t.completed)}
                                          className="mt-0.5 text-zinc-500 hover:text-purple-400 transition-colors flex-shrink-0"
                                        >
                                          {t.completed ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                          ) : (
                                            <Circle className="w-4 h-4" />
                                          )}
                                        </button>

                                        {/* Task Details */}
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                          <p
                                            className={cn(
                                              "text-xs font-semibold leading-snug break-words",
                                              t.completed ? "line-through text-zinc-500" : "text-white"
                                            )}
                                          >
                                            {t.title}
                                          </p>

                                          {/* Badges & Attribution (Planner Style) */}
                                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                            {/* Priority Pill */}
                                            <span
                                              className={cn(
                                                "px-2 py-0.2 rounded-md font-bold text-[9px] border flex items-center gap-1",
                                                pInfo.bg,
                                                pInfo.text
                                              )}
                                            >
                                              <span className={cn("w-1 h-1 rounded-full", pInfo.dot)} />
                                              <span>{pInfo.label}</span>
                                            </span>

                                            {/* Added By / Completed By */}
                                            <span className="text-zinc-500">
                                              {t.completed && t.completedByName ? (
                                                <span className="text-emerald-400 font-bold">
                                                  ✅ {t.completedByName}
                                                </span>
                                              ) : (
                                                <span>{t.addedByName}</span>
                                              )}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Drag Handle & Delete */}
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => onDeleteTask(project.id, t.id)}
                                            className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                          <div
                                            {...dp.dragHandleProps}
                                            className="p-1 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing"
                                          >
                                            <GripVertical className="w-3.5 h-3.5" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {/* Column Bottom: Planner-Style Inline Add Task */}
                      <div className="p-3 border-t border-white/[0.04] bg-white/[0.01] rounded-b-[24px]">
                        {isInlineOpen ? (
                          <div className="space-y-2.5 p-2 rounded-2xl bg-[#13131c] border border-white/10 shadow-lg">
                            <input
                              autoFocus
                              type="text"
                              value={inlineTitle}
                              onChange={(e) => setInlineTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleInlineSubmit(cat.id)
                                if (e.key === "Escape") setInlineAddCatId(null)
                              }}
                              placeholder="Görev başlığı yazın..."
                              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none px-1"
                            />

                            {/* Priority Selectors */}
                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                              <div className="flex items-center gap-1">
                                {(["low", "medium", "high", "urgent"] as const).map((p) => {
                                  const isSel = inlinePriority === p
                                  const pObj = PRIORITY_BADGES[p]
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => setInlinePriority(p)}
                                      className={cn(
                                        "px-2 py-0.5 rounded-md text-[9px] font-bold transition-all border",
                                        isSel
                                          ? cn(pObj.bg, pObj.text, "scale-105 border-white/10")
                                          : "border-transparent text-zinc-600 hover:text-zinc-400"
                                      )}
                                    >
                                      {pObj.label}
                                    </button>
                                  )
                                })}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setInlineAddCatId(null)}
                                  className="text-[10px] text-zinc-500 hover:text-white px-1.5 py-0.5"
                                >
                                  İptal
                                </button>
                                <button
                                  type="button"
                                  disabled={!inlineTitle.trim()}
                                  onClick={() => handleInlineSubmit(cat.id)}
                                  className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shadow-md shadow-purple-600/20 disabled:opacity-40"
                                >
                                  Ekle
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setInlineAddCatId(cat.id)
                              setInlineTitle("")
                              setInlinePriority("medium")
                            }}
                            className="w-full py-2 rounded-xl border border-dashed border-white/10 hover:border-purple-500/40 text-xs font-bold text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-1.5 group/btn"
                          >
                            <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-purple-400 transition-colors" />
                            <span>Yeni Görev Ekle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* ADD NEW CATEGORY / STAGE COLUMN */}
                <div className="w-[280px] flex-shrink-0">
                  {showAddCat ? (
                    <form
                      onSubmit={handleAddCategorySubmit}
                      className="p-4 rounded-[24px] bg-[#121217] border border-white/10 shadow-2xl space-y-3"
                    >
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Yeni Alan / Kategori</h4>
                      <input
                        autoFocus
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Örn: Mobil Arayüz, Testler..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-purple-500"
                      />

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Renk</label>
                        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                          {CATEGORY_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewCatColor(c)}
                              className={cn(
                                "w-5 h-5 rounded-full transition-transform",
                                newCatColor === c ? "scale-125 ring-2 ring-white" : "opacity-60"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => setShowAddCat(false)}
                          className="px-3 py-1 text-xs text-zinc-500"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="submit"
                          disabled={!newCatName.trim()}
                          className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold disabled:opacity-40 shadow-md shadow-purple-600/20"
                        >
                          Alanı Oluştur
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddCat(true)}
                      className="w-full h-44 rounded-[24px] border-2 border-dashed border-white/10 hover:border-purple-500/40 bg-white/[0.01] hover:bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-purple-300 transition-all cursor-pointer group/addcol"
                    >
                      <PlusCircle className="w-8 h-8 group-hover/addcol:scale-110 transition-transform" />
                      <span className="text-xs font-bold">Yeni Alan / Kategori Ekle</span>
                    </button>
                  )}
                </div>
              </div>
            </DragDropContext>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: REAL-TIME ACTIVITY LOG                          */}
        {/* ======================================================== */}
        {activeView === "activity" && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">Canlı Proje Aktivite Akışı</h3>
                <p className="text-xs text-zinc-400">Her iki kullanıcının yaptığı tüm işlemler anlık kaydedilir.</p>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gerçek Zamanlı
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-16 text-xs text-zinc-500">
                Henüz aktivite kaydı yok.
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl mx-auto">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-300 leading-relaxed">
                        <b className="text-white font-bold">{act.userName}</b> {act.detail}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {new Date(act.timestamp).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })} • {new Date(act.timestamp).toLocaleDateString("tr-TR")}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
