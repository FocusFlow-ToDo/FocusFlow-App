"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  FolderKanban, Plus, Calendar, CheckCircle2, Circle,
  Trash2, Pencil, ChevronRight, Sparkles, Filter, X,
  Target, Layers, Rocket, Check, Users, Activity, Crown,
  UserCheck, Bell, ShieldCheck, Tag, ExternalLink,
  FileText, Palette, Flag
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/contexts/ToastContext"
import { db } from "@/firebase/config"
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
  updateDoc, query, orderBy, serverTimestamp
} from "firebase/firestore"
import { cn } from "@/lib/utils"
import type { ProjectItem, ProjectTask, SharedProject } from "@/types"
import confetti from "canvas-confetti"
import { useSharedProjects } from "@/hooks/useSharedProjects"
import { CreateSharedProjectModal } from "@/components/projects/CreateSharedProjectModal"
import { EditSharedProjectModal } from "@/components/projects/EditSharedProjectModal"
import { SharedProjectPlannerView } from "@/components/projects/SharedProjectPlannerView"
import { useRouter } from "next/navigation"

const PRESET_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#06B6D4"
]

const PRESET_EMOJIS = ["🚀", "💡", "📚", "🎬", "💻", "🎨", "🏋️", "🎯", "🌐", "⚡"]

export default function ProjectsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  // Project Scope Tab: "individual" | "shared"
  const [projectScope, setProjectScope] = React.useState<"individual" | "shared">("individual")

  // Shared projects hook
  const {
    sharedProjects,
    pendingInvites,
    loading: sharedLoading,
    createSharedProject,
    acceptInvite,
    rejectInvite,
    deleteProject: deleteSharedProject,
    updateProject: updateSharedProject,
    addTask: addSharedTask,
    updateTask: updateSharedTask,
    toggleTask: toggleSharedTask,
    deleteTask: deleteSharedTask,
    restoreTask: restoreSharedTask,
    moveTask: moveSharedTask,
    reorderTasks: reorderSharedTasks,
    addCategory: addSharedCategory,
    updateCategory: updateSharedCategory,
    deleteCategory: deleteSharedCategory,
    updateProjectStatus: updateSharedProjectStatus
  } = useSharedProjects()

  // Shared project modals
  const [isCreateSharedModalOpen, setIsCreateSharedModalOpen] = React.useState(false)
  const [editingSharedProject, setEditingSharedProject] = React.useState<SharedProject | null>(null)

  // Active shared project detail/planner view state (rendered inside /projects)
  const [activeSharedProjectId, setActiveSharedProjectId] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("ff_active_project_view")
      } catch {}
    }
    return null
  })

  const handleOpenSharedProject = (projectId: string) => {
    setActiveSharedProjectId(projectId)
    try {
      localStorage.setItem("ff_active_project_view", projectId)
    } catch {}
  }

  const handleCloseSharedProject = () => {
    setActiveSharedProjectId(null)
    try {
      localStorage.removeItem("ff_active_project_view")
    } catch {}
  }

  const activeSharedProject = React.useMemo(() => {
    if (!activeSharedProjectId) return null
    return sharedProjects.find((p) => p.id === activeSharedProjectId) || null
  }, [sharedProjects, activeSharedProjectId])

  // If active project was deleted or invalid after loading, clear state
  React.useEffect(() => {
    if (activeSharedProjectId && !sharedLoading && !activeSharedProject) {
      handleCloseSharedProject()
    }
  }, [activeSharedProjectId, sharedLoading, activeSharedProject])

  // Individual projects state
  const [projects, setProjects] = React.useState<ProjectItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<"all" | "planning" | "in_progress" | "completed">("all")

  // Create / Edit Individual Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<ProjectItem | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [color, setColor] = React.useState(PRESET_COLORS[0])
  const [emoji, setEmoji] = React.useState(PRESET_EMOJIS[0])
  const [status, setStatus] = React.useState<"planning" | "in_progress" | "completed">("planning")
  const [targetDate, setTargetDate] = React.useState("")

  // Quick milestone input state per individual project
  const [newMilestoneText, setNewMilestoneText] = React.useState<Record<string, string>>({})

  // Quick task input state per shared project
  const [newSharedTaskText, setNewSharedTaskText] = React.useState<Record<string, string>>({})

  const handleAddSharedQuickTask = async (projectId: string) => {
    const text = (newSharedTaskText[projectId] || "").trim()
    if (!text) return
    const proj = sharedProjects.find((p) => p.id === projectId)
    const firstCatId = proj?.categories?.[0]?.id || "cat_genel"
    await addSharedTask(projectId, text, firstCatId, "medium")
    setNewSharedTaskText(prev => ({ ...prev, [projectId]: "" }))
  }

  const collectionPath = user ? `users/${user.uid}/projects` : null

  // Real-time Firestore sync for individual projects
  React.useEffect(() => {
    if (!user || !collectionPath) {
      setProjects([])
      setLoading(false)
      return
    }

    const cacheKey = `ff_projects_${user.uid}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) setProjects(JSON.parse(cached))
    } catch {}

    const q = query(collection(db, collectionPath), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectItem))
        setProjects(items)
        try {
          localStorage.setItem(cacheKey, JSON.stringify(items))
        } catch {}
        setLoading(false)
      },
      (err) => {
        console.error("Projects listener error:", err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, collectionPath])

  // If there are pending invites and user hasn't switched, auto hint
  React.useEffect(() => {
    if (pendingInvites.length > 0 && projectScope === "individual") {
      // Keep individual but user sees the banner at top
    }
  }, [pendingInvites.length, projectScope])

  const openCreateModal = () => {
    setEditingProject(null)
    setTitle("")
    setDescription("")
    setColor(PRESET_COLORS[0])
    setEmoji(PRESET_EMOJIS[0])
    setStatus("planning")
    setTargetDate("")
    setIsModalOpen(true)
  }

  const openEditModal = (p: ProjectItem) => {
    setEditingProject(p)
    setTitle(p.title)
    setDescription(p.description || "")
    setColor(p.color || PRESET_COLORS[0])
    setEmoji(p.emoji || "🚀")
    setStatus(p.status || "planning")
    setTargetDate(p.targetDate || "")
    setIsModalOpen(true)
  }

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !collectionPath || !user) return

    try {
      if (editingProject) {
        const ref = doc(db, collectionPath, editingProject.id)
        await updateDoc(ref, {
          title: title.trim(),
          description: description.trim(),
          color,
          emoji,
          status,
          targetDate: targetDate || null,
          updatedAt: serverTimestamp()
        })
        showToast({ type: "success", message: "Proje güncellendi" })
      } else {
        const id = `prj_${Date.now()}`
        const ref = doc(db, collectionPath, id)
        const newProj: Partial<ProjectItem> = {
          id,
          title: title.trim(),
          description: description.trim(),
          color,
          emoji,
          status,
          targetDate: targetDate || null,
          tasks: [],
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        await setDoc(ref, newProj)
        showToast({ type: "success", message: "🎉 Yeni proje oluşturuldu!" })
        confetti({ particleCount: 25, spread: 60 })
      }
      setIsModalOpen(false)
    } catch (e) {
      showToast({ type: "error", message: "Proje kaydedilemedi." })
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!collectionPath) return
    try {
      await deleteDoc(doc(db, collectionPath, id))
      showToast({ type: "success", message: "Proje silindi." })
    } catch {
      showToast({ type: "error", message: "Proje silinemedi." })
    }
  }

  const handleAddMilestone = async (projectId: string) => {
    const text = (newMilestoneText[projectId] || "").trim()
    if (!text || !collectionPath) return

    const proj = projects.find(p => p.id === projectId)
    if (!proj) return

    const newMilestone: ProjectTask = {
      id: `ms_${Date.now()}`,
      title: text,
      completed: false
    }

    const nextTasks = [...(proj.tasks || []), newMilestone]
    await updateDoc(doc(db, collectionPath, projectId), {
      tasks: nextTasks,
      updatedAt: serverTimestamp()
    })

    setNewMilestoneText(prev => ({ ...prev, [projectId]: "" }))
  }

  const handleToggleMilestone = async (projectId: string, milestoneId: string) => {
    if (!collectionPath) return
    const proj = projects.find(p => p.id === projectId)
    if (!proj) return

    const nextTasks = (proj.tasks || []).map(t => {
      if (t.id === milestoneId) return { ...t, completed: !t.completed }
      return t
    })

    await updateDoc(doc(db, collectionPath, projectId), {
      tasks: nextTasks,
      updatedAt: serverTimestamp()
    })
  }

  const filteredIndividualProjects = React.useMemo(() => {
    if (filter === "all") return projects
    return projects.filter(p => p.status === filter)
  }, [projects, filter])

  const filteredSharedProjects = React.useMemo(() => {
    if (filter === "all") return sharedProjects
    return sharedProjects.filter(p => p.status === filter)
  }, [sharedProjects, filter])

  if (activeSharedProjectId && activeSharedProject) {
    return (
      <div className="h-full flex flex-col relative overflow-hidden">
        <SharedProjectPlannerView
          project={activeSharedProject}
          onAddTask={addSharedTask}
          onUpdateTask={updateSharedTask}
          onToggleTask={toggleSharedTask}
          onDeleteTask={deleteSharedTask}
          onRestoreTask={restoreSharedTask}
          onMoveTask={moveSharedTask}
          onReorderTasks={reorderSharedTasks}
          onAddCategory={addSharedCategory}
          onUpdateCategory={updateSharedCategory}
          onDeleteCategory={deleteSharedCategory}
          onUpdateProject={updateSharedProject}
          onUpdateStatus={updateSharedProjectStatus}
          onDeleteProject={async (id) => {
            await deleteSharedProject(id)
            handleCloseSharedProject()
          }}
          onBackToPersonal={handleCloseSharedProject}
        />
      </div>
    )
  }

  if (activeSharedProjectId && sharedLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Proje yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative overflow-y-auto custom-scrollbar select-none">
      {/* Background Glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 relative z-10 pb-24">
        
        {/* PENDING INVITES BANNER */}
        <AnimatePresence>
          {pendingInvites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-purple-900/40 border border-purple-500/30 shadow-xl backdrop-blur-md space-y-3"
            >
              <div className="flex items-center gap-2 text-purple-300 text-xs font-black uppercase tracking-wider">
                <Bell className="w-4 h-4 animate-bounce text-pink-400" />
                <span>Bekleyen Ortak Proje Davetleri ({pendingInvites.length})</span>
              </div>

              <div className="space-y-2">
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl flex-shrink-0">
                        {inv.projectEmoji || "🤝"}
                      </div>
                      <div>
                        <p className="text-xs text-white">
                          <span className="font-bold text-purple-300">{inv.fromName}</span> seni{" "}
                          <span className="font-bold text-white">"{inv.projectTitle}"</span> ortak projesine davet etti!
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Kabul ettiğinde her iki taraf da görevleri, geliştirme önerilerini ve ilerlemeyi anlık yönetecek.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => rejectInvite(inv)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition-all"
                      >
                        Reddet
                      </button>
                      <button
                        onClick={() => {
                          acceptInvite(inv)
                          setProjectScope("shared")
                        }}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Kabul Et & Katıl 🚀</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 text-purple-400 mb-1">
              <FolderKanban className="w-5 h-5" />
              <span className="text-[11px] font-black tracking-[0.2em] uppercase">VİZYON & YOL HARİTASI</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Projelerim</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Gelecekte yapmak istediğin büyük hedefleri planla veya arkadaşınla ortak projeler yürüt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scope Switcher: Individual vs Shared */}
            <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08]">
              <button
                onClick={() => setProjectScope("individual")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  projectScope === "individual"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Bireysel ({projects.length})</span>
              </button>

              <button
                onClick={() => setProjectScope("shared")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative",
                  projectScope === "shared"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Ortak Projeler 🤝 ({sharedProjects.length})</span>
                {pendingInvites.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08]">
              {(["all", "planning", "in_progress", "completed"] as const).map((f) => {
                const labels = {
                  all: "Tümü",
                  planning: "Planlanan",
                  in_progress: "Devam Eden",
                  completed: "Biten"
                }
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                      filter === f ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {labels[f]}
                  </button>
                )
              })}
            </div>

            {/* New Project Button */}
            {projectScope === "individual" ? (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Proje</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCreateSharedModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Yeni Ortak Proje 🤝</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: INDIVIDUAL PROJECTS GRID                         */}
        {/* ======================================================== */}
        {projectScope === "individual" && (
          <>
            {filteredIndividualProjects.length === 0 ? (
              <div className="py-24 text-center glass-card rounded-3xl border border-white/5 bg-white/[0.01]">
                <Rocket className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-300">Henüz bireysel proje eklenmedi</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Gelecekte yapmak istediğin şeyleri buraya ekleyerek adım adım gerçekleştirebilirsin.
                </p>
                <button
                  onClick={openCreateModal}
                  className="mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold inline-flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>İlk Projeni Oluştur</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredIndividualProjects.map((proj) => {
                  const tasks = proj.tasks || []
                  const completedCount = tasks.filter(t => t.completed).length
                  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

                  const statusBadge = {
                    planning: { label: "Planlanıyor", cls: "bg-sky-500/10 border-sky-500/20 text-sky-400" },
                    in_progress: { label: "Devam Ediyor", cls: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
                    completed: { label: "Tamamlandı", cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" }
                  }[proj.status || "planning"]

                  return (
                    <div
                      key={proj.id}
                      className="glass-card rounded-3xl p-5 border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all flex flex-col justify-between group shadow-xl"
                      style={{
                        borderTopColor: proj.color || "#3B82F6",
                        borderTopWidth: "3px"
                      }}
                    >
                      <div className="space-y-3">
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/10"
                              style={{ backgroundColor: `${proj.color || "#3B82F6"}20` }}
                            >
                              {proj.emoji || "🚀"}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-sm tracking-tight">{proj.title}</h3>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider inline-block mt-0.5", statusBadge.cls)}>
                                {statusBadge.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(proj)}
                              className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              className="p-1.5 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        {proj.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {proj.description}
                          </p>
                        )}

                        {/* Target Date */}
                        {proj.targetDate && (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <span>Hedef: {new Date(proj.targetDate).toLocaleDateString("tr-TR")}</span>
                          </div>
                        )}

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-zinc-500">İlerleme ({completedCount}/{tasks.length})</span>
                            <span className="text-zinc-300">%{progressPct}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${progressPct}%`,
                                backgroundColor: proj.color || "#3B82F6"
                              }}
                            />
                          </div>
                        </div>

                        {/* Milestones / Quick Tasks */}
                        <div className="space-y-1 pt-2">
                          {tasks.slice(0, 4).map((task) => (
                            <button
                              key={task.id}
                              onClick={() => handleToggleMilestone(proj.id, task.id)}
                              className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 text-left text-xs transition-colors group/item"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-zinc-600 group-hover/item:text-zinc-400 shrink-0" />
                              )}
                              <span className={cn("truncate flex-1", task.completed ? "line-through text-zinc-500" : "text-zinc-300")}>
                                {task.title}
                              </span>
                            </button>
                          ))}
                          {tasks.length > 4 && (
                            <p className="text-[10px] text-zinc-600 pl-2 font-bold">+{tasks.length - 4} adım daha</p>
                          )}
                        </div>
                      </div>

                      {/* Add Milestone Input */}
                      <div className="mt-4 pt-2 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5">
                          <input
                            value={newMilestoneText[proj.id] || ""}
                            onChange={(e) => setNewMilestoneText(prev => ({ ...prev, [proj.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddMilestone(proj.id) }}
                            placeholder="Yeni adım ekle..."
                            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1 text-xs text-white placeholder:text-zinc-600 outline-none"
                          />
                          <button
                            onClick={() => handleAddMilestone(proj.id)}
                            disabled={!(newMilestoneText[proj.id] || "").trim()}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-40"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* TAB 2: COLLABORATIVE / SHARED PROJECTS GRID             */}
        {/* ======================================================== */}
        {projectScope === "shared" && (
          <>
            {filteredSharedProjects.length === 0 ? (
              <div className="py-24 text-center glass-card rounded-3xl border border-white/5 bg-white/[0.01]">
                <Users className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-300">Henüz ortak proje bulunmuyor</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Bir arkadaşını seçerek ortak bir proje başlatabilir, görevleri ve geliştirme önerilerini anlık olarak birlikte yönetebilirsiniz.
                </p>
                <button
                  onClick={() => setIsCreateSharedModalOpen(true)}
                  className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/20 inline-flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Ortak Proje Başlat 🤝</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSharedProjects.map((sp) => {
                  const tasks = sp.tasks || []
                  const completedTasks = tasks.filter((t) => t.completed)
                  const progressPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
                  const categories = sp.categories || []
                  const lastActivity = sp.activityLog?.[0]

                  return (
                    <div
                      key={sp.id}
                      onClick={() => handleOpenSharedProject(sp.id)}
                      className="glass-card rounded-3xl p-5 border border-white/10 bg-white/[0.02] hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-xl cursor-pointer relative overflow-hidden"
                      style={{
                        borderTopColor: sp.color || "#8B5CF6",
                        borderTopWidth: "3px"
                      }}
                    >
                      <div className="space-y-3.5">
                        {/* Header: Emoji, Title, Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10"
                              style={{ backgroundColor: `${sp.color || "#8B5CF6"}25` }}
                            >
                              {sp.emoji || "🤝"}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-sm tracking-tight group-hover:text-purple-300 transition-colors">
                                {sp.title}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] px-2 py-0.2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 font-bold uppercase tracking-wider">
                                  {sp.status === "completed" ? "Tamamlandı" : sp.status === "in_progress" ? "Devam Ediyor" : "Planlama"}
                                </span>
                                {sp.inviteStatus === "pending" && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                                    Davet Bekleniyor
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingSharedProject(sp)
                              }}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all shadow-sm"
                              title="Projeyi & Ayarları Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <span className="p-1.5 rounded-xl bg-white/5 group-hover:bg-purple-600 text-zinc-400 group-hover:text-white transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {sp.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {sp.description}
                          </p>
                        )}

                        {/* Partners Bar */}
                        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
                          <div className="flex items-center gap-2">
                            {/* Leader Avatar */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[9px] font-black text-purple-300 overflow-hidden">
                                {sp.leaderPhotoURL ? (
                                  <img src={sp.leaderPhotoURL} alt={sp.leaderName} className="w-full h-full object-cover" />
                                ) : (
                                  sp.leaderName.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-white max-w-[80px] truncate">{sp.leaderName}</span>
                            </div>

                            <span className="text-zinc-600 font-bold text-xs">🤝</span>

                            {/* Member Avatar */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[9px] font-black text-blue-300 overflow-hidden">
                                {sp.memberPhotoURL ? (
                                  <img src={sp.memberPhotoURL} alt={sp.memberName} className="w-full h-full object-cover" />
                                ) : (
                                  sp.memberName.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-white max-w-[80px] truncate">{sp.memberName}</span>
                            </div>
                          </div>

                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Canlı</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-zinc-500">
                              Görevler ({completedTasks.length} / {tasks.length})
                            </span>
                            <span className="text-purple-300">%{progressPct}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${progressPct}%`,
                                backgroundColor: sp.color || "#8B5CF6"
                              }}
                            />
                          </div>
                        </div>

                        {/* Category Tags Preview */}
                        {categories.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {categories.slice(0, 3).map((c) => (
                              <span
                                key={c.id}
                                className="px-2 py-0.5 rounded-md text-[9px] font-bold"
                                style={{
                                  backgroundColor: `${c.color}15`,
                                  color: c.color,
                                  border: `1px solid ${c.color}30`
                                }}
                              >
                                {c.name}
                              </span>
                            ))}
                            {categories.length > 3 && (
                              <span className="text-[9px] text-zinc-600">+{categories.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Tasks list preview & quick management */}
                        <div className="space-y-1 pt-1.5 border-t border-white/[0.04]">
                          {tasks.length === 0 && (
                            <p className="text-[11px] text-zinc-600 pl-1 py-1 italic">Henüz görev eklenmemiş</p>
                          )}
                          {tasks.slice(0, 5).map((t) => (
                            <div
                              key={t.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSharedTask(sp.id, t.id)
                              }}
                              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 text-xs transition-colors group/item cursor-pointer"
                            >
                              {t.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-zinc-600 group-hover/item:text-purple-400 shrink-0 transition-colors" />
                              )}
                              <span className={cn("truncate flex-1 text-[11px]", t.completed ? "line-through text-zinc-500" : "text-zinc-200")}>
                                {t.title}
                              </span>
                              {t.completed && t.completedByName && (
                                <span className="text-[9px] text-emerald-400 shrink-0 font-medium">
                                  ✅ {t.completedByName}
                                </span>
                              )}
                            </div>
                          ))}
                          {tasks.length > 5 && (
                            <p className="text-[10px] text-zinc-600 pl-2 font-bold">+{tasks.length - 5} görev daha</p>
                          )}
                        </div>
                      </div>

                      {/* Add Quick Task Input on Shared Project Card */}
                      <div className="mt-3 pt-2 border-t border-white/[0.04]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <input
                            value={newSharedTaskText[sp.id] || ""}
                            onChange={(e) => setNewSharedTaskText(prev => ({ ...prev, [sp.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddSharedQuickTask(sp.id)
                              }
                            }}
                            placeholder="Yeni görev ekle..."
                            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/40 transition-colors"
                          />
                          <button
                            onClick={() => handleAddSharedQuickTask(sp.id)}
                            disabled={!(newSharedTaskText[sp.id] || "").trim()}
                            className="p-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 hover:text-white disabled:opacity-40 transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Footer: Last Activity & Open prompt */}
                      <div className="mt-4 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-500">
                        {lastActivity ? (
                          <span className="truncate max-w-[200px]">
                            ⚡ <b className="text-zinc-400">{lastActivity.userName}</b>: {lastActivity.detail}
                          </span>
                        ) : (
                          <span>Henüz aktivite yok</span>
                        )}
                        <span className="text-purple-400 font-bold group-hover:underline flex items-center gap-1">
                          Panoyu Aç 🚀 <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* CREATE / EDIT INDIVIDUAL PROJECT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md"
            />
            <div className="fixed inset-0 z-[111] flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="w-full max-w-xl pointer-events-auto bg-[#121217] backdrop-blur-3xl rounded-[32px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col max-h-[82vh]"
              >
                <form onSubmit={handleSaveProject} className="flex flex-col h-full">
                  {/* Top Input Header */}
                  <div className="flex items-center px-6 h-18 sm:h-20 gap-3.5 border-b border-white/[0.04] bg-white/[0.01]">
                    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-2.5 py-1.5 hover:bg-white/[0.08] transition-colors">
                      <span className="text-2xl">{emoji}</span>
                      <select
                        value={emoji}
                        onChange={(e) => setEmoji(e.target.value)}
                        className="bg-transparent text-xs text-white outline-none cursor-pointer"
                      >
                        {PRESET_EMOJIS.map(em => (
                          <option key={em} value={em} className="bg-zinc-900 text-white">{em}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      autoFocus
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Proje veya hedef başlığı..."
                      className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-[17px] font-medium"
                    />

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/[0.04]">
                        <kbd className="opacity-60 font-mono">ENTER</kbd>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="p-2 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-5 overflow-y-auto custom-scrollbar space-y-5 flex-1">
                    {/* Description */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                        <FileText className="w-3 h-3" /> Açıklama & Vizyon
                      </p>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Bu projede ne yapmak istiyorsun? Vizyonunu ve hedeflerini kısaca anlat..."
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/50 resize-none transition-colors"
                      />
                    </div>

                    {/* Status selection */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                        <Flag className="w-3 h-3" /> Proje Durumu
                      </p>
                      <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05] w-fit">
                        {[
                          { id: "planning", label: "Planlanıyor", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
                          { id: "in_progress", label: "Devam Ediyor", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                          { id: "completed", label: "Tamamlandı", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setStatus(st.id as any)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 border border-transparent",
                              status === st.id
                                ? cn(st.color, "shadow-sm scale-[1.03] border-white/5")
                                : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color & Target Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-2">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                          <Palette className="w-3 h-3" /> Renk Teması
                        </p>
                        <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] rounded-xl border border-white/[0.05] w-fit">
                          {PRESET_COLORS.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setColor(c)}
                              className={cn(
                                "w-6 h-6 rounded-full transition-transform duration-200",
                                color === c ? "scale-125 ring-2 ring-white shadow-md" : "opacity-60 hover:opacity-100"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                          <Calendar className="w-3 h-3" /> Hedef Tarih
                        </p>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.04] bg-white/[0.01]">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={!title.trim()}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all flex items-center gap-2 active:scale-95"
                    >
                      {editingProject ? "Projeyi Güncelle" : "Projeyi Oluştur 🚀"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* CREATE SHARED PROJECT MODAL */}
      <CreateSharedProjectModal
        isOpen={isCreateSharedModalOpen}
        onClose={() => setIsCreateSharedModalOpen(false)}
        onCreate={createSharedProject}
      />

      {/* EDIT SHARED PROJECT MODAL */}
      <EditSharedProjectModal
        isOpen={!!editingSharedProject}
        onClose={() => setEditingSharedProject(null)}
        project={editingSharedProject}
        onUpdateProject={updateSharedProject}
        onAddCategory={addSharedCategory}
        onUpdateCategory={updateSharedCategory}
        onDeleteCategory={deleteSharedCategory}
        onDeleteProject={deleteSharedProject}
      />
    </div>
  )
}
