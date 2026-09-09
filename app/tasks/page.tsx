"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search, ChevronDown, ChevronRight, List, LayoutGrid,
  X, CheckSquare, AlertTriangle, Calendar, Check
} from "lucide-react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/useTasks"
import { useToast } from "@/contexts/ToastContext"
import { useRouter } from "next/navigation"
import { TaskCard } from "@/components/tasks/TaskCard"
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer"
import { TaskInput, openGlobalTaskInput } from "@/components/focus/TaskInput"
import { useCategories } from "@/hooks/useCategories"
import type { Task } from "@/types"
import { isBefore, isToday, isTomorrow, isThisWeek, startOfDay, addDays, startOfWeek, isSameDay, format } from "date-fns"
import { tr } from "date-fns/locale"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { CategorySymbol } from "@/components/ui/CategorySymbol"
import { TaskContextMenu } from "@/components/tasks/TaskContextMenu"
import { StatusMilestones } from "@/components/focus/StatusMilestones"
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal"
import { GlobalContextMenu } from "@/components/ui/GlobalContextMenu"
import { SearchInput } from "@/components/ui/SearchInput"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { CountBadge } from "@/components/ui/CountBadge"
import { Divider } from "@/components/ui/Divider"

type GroupKey = "overdue" | "today" | "tomorrow" | "thisWeek" | "nextWeek" | "later" | "noDate" | "done"
type PriorityFilter = "all" | "urgent" | "high" | "medium" | "low"
type StatusFilter = "all" | "active" | "done" | "overdue"

interface GroupDef { id: GroupKey; title: string; colorClass: string; icon?: React.ReactNode }


const GROUP_DEFS: GroupDef[] = [
  { id: "overdue", title: "Gecikmiş", colorClass: "text-red-400", icon: <AlertTriangle className="w-3 h-3" /> },
  { id: "today", title: "Bugün", colorClass: "text-blue-400" },
  { id: "tomorrow", title: "Yarın", colorClass: "text-zinc-400" },
  { id: "thisWeek", title: "Bu Hafta", colorClass: "text-zinc-500" },
  { id: "nextWeek", title: "Gelecek Hafta", colorClass: "text-zinc-500" },
  { id: "later", title: "Daha Sonra", colorClass: "text-zinc-500" },
  { id: "noDate", title: "Tarihsiz", colorClass: "text-zinc-600" },
]

function FilterDropdown({ label, options, value, onChange }: {
  label: string; options: { id: string; label: string; dot?: string }[]; value: string; onChange: (v: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [])
  const active = options.find((o) => o.id === value)
  const filtered = value !== "all"

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className={cn(
        "flex items-center gap-2 h-9 px-3 rounded-lg border text-sm transition-all active:scale-[0.97]",
        filtered ? "accent-bg-soft accent-border accent-text" : "glass-input text-zinc-400 hover:text-zinc-300",
      )}>
        {active?.dot && <span className={cn("w-2 h-2 rounded-full", active.dot)} />}
        {filtered ? active?.label : label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12 }} className="absolute top-full mt-1.5 left-0 z-50 glass-dropdown rounded-xl py-1.5 min-w-[160px]">
            {options.map((opt) => (
              <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false) }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg mx-1.5 transition-colors",
                  value === opt.id ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200",
                )} style={{ width: "calc(100% - 12px)" }}>
                {opt.dot && <span className={cn("w-2 h-2 rounded-full", opt.dot)} />}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TasksPage() {
  const { tasks, completeTask, uncompleteTask, setTaskFocused, batchUpdateTasks, deleteTask, hardDeleteTask } = useTasks()
  const { showToast } = useToast()
  const router = useRouter()

  const [view, setView] = React.useState<"list" | "kanban">("kanban")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [priorityFilter, setPriorityFilter] = React.useState<PriorityFilter>("all")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [dateFilter, setDateFilter] = React.useState<"today" | "tomorrow" | "all">("today")
  const [showCompleted, setShowCompleted] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [deleteModal, setDeleteModal] = React.useState<{ isOpen: boolean, task: Task | null, isHard: boolean }>({ isOpen: false, task: null, isHard: false })
  const [globalMenuOpen, setGlobalMenuOpen] = React.useState(false)
  const [globalMenuCoords, setGlobalMenuCoords] = React.useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleGlobalContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.group')) return
    e.preventDefault()
    setGlobalMenuCoords({ x: e.clientX, y: e.clientY })
    setGlobalMenuOpen(true)
  }

  const todayDate = React.useMemo(() => startOfDay(new Date()), [])

  const handleToggle = React.useCallback(async (id: string, completed: boolean) => {
    if (completed) {
      await completeTask(id)
      showToast({ type: "success", message: "✅ Görev tamamlandı", action: { label: "Geri Al", onClick: () => uncompleteTask(id) } })
    } else { await uncompleteTask(id) }
  }, [completeTask, uncompleteTask, showToast])

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
  }

  const handleFocusStart = React.useCallback(async (id: string) => {
    await setTaskFocused(id); router.push("/")
  }, [setTaskFocused, router])

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      // 🚩 IMPORTANT: Always exclude trash from main view
      if (t.status === "trash") return false

      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
      if (statusFilter === "active" && t.status === "done") return false
      if (statusFilter === "done" && t.status !== "done") return false
      
      if (dateFilter !== "all" && t.status !== "done") {
        const d = t.dueDate ? startOfDay(new Date(t.dueDate)) : null;
        if (dateFilter === "today") {
          if (d && !isSameDay(d, todayDate) && !isBefore(d, todayDate)) return false;
          if (!d) return false;
        } else if (dateFilter === "tomorrow") {
          if (!d || !isSameDay(d, addDays(todayDate, 1))) return false;
        }
      }

      if (statusFilter === "overdue") {
        if (t.status === "done") return false
        if (!t.dueDate || !isBefore(startOfDay(new Date(t.dueDate)), todayDate)) return false
      }
      return true
    })
  }, [tasks, searchQuery, priorityFilter, statusFilter, dateFilter, todayDate])

  const groups = React.useMemo(() => {
    const result: Record<GroupKey, Task[]> = { overdue: [], today: [], tomorrow: [], thisWeek: [], nextWeek: [], later: [], noDate: [], done: [] }
    filteredTasks.forEach((t) => {
      if (t.status === "done") { result.done.push(t); return }
      if (!t.dueDate) { result.noDate.push(t); return }
      const d = startOfDay(new Date(t.dueDate))
      if (isBefore(d, todayDate)) result.overdue.push(t)
      else if (isToday(d)) result.today.push(t)
      else if (isTomorrow(d)) result.tomorrow.push(t)
      else if (isThisWeek(d, { weekStartsOn: 1 })) result.thisWeek.push(t)
      else if (isThisWeek(addDays(d, -7), { weekStartsOn: 1 })) result.nextWeek.push(t)
      else result.later.push(t)
    })
    Object.values(result).forEach((arr) => arr.sort((a, b) => a.order - b.order))
    return result
  }, [filteredTasks, todayDate])

  const handleDragEnd = React.useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    const destKey = destination.droppableId as GroupKey
    if (destKey === "done") return
    if (source.droppableId === destination.droppableId) {
      const list = Array.from(groups[destKey])
      const [moved] = list.splice(source.index, 1)
      list.splice(destination.index, 0, moved)
      await batchUpdateTasks(list.map((t, i) => ({ id: t.id, changes: { order: i } })))
    } else {
      const movedTask = tasks.find((t) => t.id === draggableId)
      if (!movedTask) return
      let newDueDate: Date | null = movedTask.dueDate
      if (destKey === "today") newDueDate = todayDate
      else if (destKey === "tomorrow") newDueDate = addDays(todayDate, 1)
      else if (destKey === "noDate") newDueDate = null
      else if (destKey === "thisWeek") newDueDate = addDays(todayDate, 3)
      else if (destKey === "nextWeek") newDueDate = addDays(startOfWeek(todayDate, { weekStartsOn: 1 }), 7)
      else if (destKey === "later") newDueDate = addDays(todayDate, 14)
      const destList = Array.from(groups[destKey]).filter((t) => t.id !== draggableId)
      destList.splice(destination.index, 0, { ...movedTask, dueDate: newDueDate })
      await batchUpdateTasks(destList.map((t, i) => ({
        id: t.id, changes: t.id === draggableId ? { order: i, dueDate: newDueDate } : { order: i },
      })))
    }
  }, [groups, tasks, batchUpdateTasks, todayDate])

  const hasActiveFilters = searchQuery || priorityFilter !== "all" || statusFilter !== "all"
  const clearFilters = () => { setSearchQuery(""); setPriorityFilter("all"); setStatusFilter("all") }
  const totalActive = tasks.filter((t) => t.status !== "done" && t.status !== "trash").length

  return (
    <div 
      className="h-full flex flex-col relative overflow-hidden"
      onContextMenu={handleGlobalContextMenu}
    >
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <span className="text-zinc-500 text-sm font-medium">{totalActive} aktif görev</span>
          <div className="flex items-center gap-0.5 glass-surface p-1 rounded-xl">
            <button onClick={() => setView("list")} className={cn("p-2 rounded-lg transition-all", view === "list" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView("kanban")} className={cn("p-2 rounded-lg transition-all", view === "kanban" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 glass-surface p-1 rounded-xl mr-2">
            {[
              { id: "today", label: "Bugün" },
              { id: "tomorrow", label: "Yarın" },
              { id: "all", label: "Tümü" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as any)}
                className={cn(
                  "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                  dateFilter === d.id
                    ? "bg-white text-zinc-900 shadow-xl"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/[0.05] mx-1" />

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Görev ara..."
            className="flex-1 min-w-[150px] max-w-[240px]"
          />
          <FilterDropdown label="Öncelik" value={priorityFilter} onChange={(v) => setPriorityFilter(v as PriorityFilter)}
            options={[{ id: "all", label: "Tümü" }, { id: "urgent", label: "Acil", dot: "bg-red-500" }, { id: "high", label: "Yüksek", dot: "bg-orange-500" }, { id: "medium", label: "Orta", dot: "bg-blue-500" }, { id: "low", label: "Düşük", dot: "bg-emerald-500" }]} />
          <FilterDropdown label="Durum" value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[{ id: "all", label: "Tümü" }, { id: "active", label: "Aktif" }, { id: "done", label: "Tamamlanan" }, { id: "overdue", label: "Gecikmiş", dot: "bg-red-500" }]} />
          {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 px-2 h-9"><X className="w-3 h-3" />Temizle</button>}
        </div>
      </div>

      <Divider className="mx-4 sm:mx-6 lg:mx-8" />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="px-4 sm:px-6 lg:px-8 pb-32 pt-4">
          <StatusMilestones />
          {!isMounted ? null : view === "list" ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                {GROUP_DEFS.map((gDef) => {
                  const groupTasks = groups[gDef.id]
                  if (groupTasks.length === 0) return null
                  return (
                    <div key={gDef.id} className={cn("mb-2", gDef.id === "overdue" && "glass-surface !border-red-500/10 -mx-2 px-2 py-2 rounded-xl mb-4")}>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2.5">
                          {gDef.icon}
                          <SectionLabel className="mb-0">
                            {gDef.title}
                          </SectionLabel>
                        </div>
                        <CountBadge count={groupTasks.length} />
                      </div>
                      <Droppable droppableId={gDef.id}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className={cn("space-y-2 min-h-[8px] rounded-2xl transition-all duration-300", snapshot.isDraggingOver && "bg-white/[0.02] p-2")}>
                            {groupTasks.map((task, idx) => (
                              <Draggable key={task.id} draggableId={task.id} index={idx}>
                                {(dp, ds) => {
                                  const el = (
                                    <div ref={dp.innerRef} {...dp.draggableProps} className={cn(ds.isDragging && "z-50")}>
                                      <TaskCard task={task} onToggle={handleToggle} onSelect={() => setSelectedTask(task)} onFocusStart={handleFocusStart} onDelete={handleDelete} hideDate={dateFilter !== "all"} isDragging={ds.isDragging} dragHandleProps={dp.dragHandleProps} />
                                    </div>
                                  )
                                  return ds.isDragging ? createPortal(el, document.body) : el
                                }}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )
                })}

                {groups.done.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/[0.04]">
                    {statusFilter === "done" ? (
                      <div className="space-y-2">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-400 mb-4 px-1">Tamamlanan</h3>
                        {groups.done.map((task) => (
                          <TaskCard key={task.id} task={task} onToggle={handleToggle} onSelect={() => setSelectedTask(task)} onDelete={handleDelete} hideDate={dateFilter !== "all"} />
                        ))}
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 font-bold transition-all group px-1">
                          <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", showCompleted && "rotate-90")} />
                          Tamamlananlar
                          <span className="text-[11px] font-black bg-white/[0.03] text-zinc-600 px-2 py-0.5 rounded-lg ml-1 tabular-nums border border-white/[0.03]">
                            {groups.done.length}
                          </span>
                        </button>
                        <AnimatePresence>
                          {showCompleted && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="mt-4 space-y-2 overflow-hidden border-l-2 border-white/[0.03] ml-2 pl-4">
                              {groups.done.map((task) => (<TaskCard key={task.id} task={task} onToggle={handleToggle} onSelect={() => setSelectedTask(task)} onDelete={handleDelete} hideDate={dateFilter !== "all"} />))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                )}

                {filteredTasks.length === 0 && (
                  <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-6 shadow-2xl">
                      {hasActiveFilters ? <Search className="w-7 h-7 text-zinc-700" strokeWidth={1.5} /> : <CheckSquare className="w-7 h-7 text-zinc-700" strokeWidth={1.5} />}
                    </div>
                    <h3 className="text-zinc-300 font-bold text-base mb-2">{hasActiveFilters ? "Sonuç bulunamadı" : "Henüz görev yok"}</h3>
                    <p className="text-[13px] text-zinc-600 max-w-xs leading-relaxed">{hasActiveFilters ? "Filtrelerinizi değiştirmeyi deneyin." : "Aşağıdan yeni görev ekleyerek başlayın."}</p>
                    {hasActiveFilters ? <button onClick={clearFilters} className="mt-5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">Filtreleri Temizle</button> : <button onClick={() => openGlobalTaskInput()} className="mt-5 text-sm font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-4 py-2 rounded-xl transition-all">Görev Ekle</button>}
                  </div>
                )}
              </div>
            </DragDropContext>
          ) : (
            <KanbanView tasks={filteredTasks} onToggle={handleToggle} onSelect={setSelectedTask} onFocusStart={handleFocusStart} onDelete={handleDelete} onHardDelete={hardDeleteTask} batchUpdateTasks={batchUpdateTasks} hideDate={dateFilter !== "all"} />
          )}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="bg-gradient-to-t from-background via-background/80 to-transparent pt-12 pb-4 sm:pb-5 px-4 sm:px-6">
          <div className="pointer-events-auto w-full max-w-xl mx-auto"><TaskInput /></div>
        </div>
      </div>
      <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
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

function KanbanView({ tasks, onToggle, onSelect, onFocusStart, onDelete, onHardDelete, batchUpdateTasks, hideDate }: {
  tasks: Task[]; onToggle: (id: string, done: boolean) => void; onSelect: (t: Task) => void
  onFocusStart?: (id: string) => void; onDelete: (id: string) => void; onHardDelete: (id: string) => void
  batchUpdateTasks: (u: { id: string; changes: Partial<Task> }[]) => Promise<void>; hideDate?: boolean
}) {
  const columns = React.useMemo(() => ({
    todo: { title: "Yapılacak", color: "border-zinc-500", dot: "bg-zinc-500", tasks: tasks.filter((t) => t.status === "todo").sort((a, b) => a.order - b.order) },
    in_progress: { title: "Devam Eden", color: "border-amber-500", dot: "bg-amber-500", tasks: tasks.filter((t) => t.status === "in_progress").sort((a, b) => a.order - b.order) },
    done: { title: "Tamamlanan", color: "border-emerald-500", dot: "bg-emerald-500", tasks: tasks.filter((t) => t.status === "done").sort((a, b) => a.order - b.order) },
  }), [tasks])

  const handleDragEnd = React.useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    const destKey = destination.droppableId as keyof typeof columns
    const destTasks = Array.from(columns[destKey].tasks).filter((t) => t.id !== draggableId)
    const movedTask = tasks.find((t) => t.id === draggableId)
    if (!movedTask) return
    destTasks.splice(destination.index, 0, movedTask)
    const newStatus = destKey === "todo" ? "todo" : destKey === "in_progress" ? "in_progress" : "done"
    await batchUpdateTasks(destTasks.map((t, i) => ({
      id: t.id, changes: t.id === draggableId
        ? { order: i, status: newStatus, ...(newStatus === "done" ? { completedAt: new Date() } : { completedAt: null }) }
        : { order: i },
    })))
  }, [columns, tasks, batchUpdateTasks])

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[500px]">
        {(Object.entries(columns) as [string, typeof columns.todo][]).map(([key, col]) => (
          <div key={key} className="flex flex-col group/col">
            <div className={cn(
              "flex items-center justify-between mb-5 pb-3 px-1 border-b-[1.5px] transition-all duration-500",
              col.color,
              "group-hover/col:border-white/20"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", col.dot)} />
                <span className="text-sm font-bold tracking-tight text-zinc-100 uppercase tracking-[0.1em]">{col.title}</span>
              </div>
              <span className="text-[10px] font-black tabular-nums bg-white/[0.05] border border-white/[0.05] text-zinc-500 px-2 py-0.5 rounded-lg">
                {col.tasks.length}
              </span>
            </div>
            
            <Droppable droppableId={key}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps} 
                  className={cn(
                    "flex-1 space-y-3 min-h-[200px] p-1 rounded-2xl transition-all duration-300 border-2 border-transparent",
                    snapshot.isDraggingOver 
                      ? "bg-white/[0.03] border-dashed !border-white/10 shadow-inner" 
                      : "hover:bg-white/[0.01]"
                  )}
                >
                  {col.tasks.map((task, idx) => (
                    <Draggable key={task.id} draggableId={task.id} index={idx}>
                      {(dp, ds) => {
                        const el = (
                          <div 
                            ref={dp.innerRef} 
                            {...dp.draggableProps} 
                            className={cn(ds.isDragging && "z-50")}
                          >
                            <TaskCard 
                              task={task} 
                              variant="kanban"
                              onToggle={onToggle} 
                              onSelect={() => onSelect(task)} 
                              onFocusStart={onFocusStart} 
                              onDelete={onDelete} 
                              onHardDelete={onHardDelete}
                              hideDate={hideDate}
                              isDragging={ds.isDragging}
                              dragHandleProps={dp.dragHandleProps}
                            />
                          </div>
                        )
                        return ds.isDragging ? createPortal(el, document.body) : el
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}