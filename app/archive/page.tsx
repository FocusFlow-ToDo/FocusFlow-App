"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Archive, Search, X, ChevronLeft, ChevronRight,
  SortAsc, SortDesc, Calendar, Flag, Download, FolderOpen,
  RefreshCw, Inbox, CheckCircle2, Clock, Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/useTasks"
import { useCategories } from "@/hooks/useCategories"
import { useSettings } from "@/hooks/useSettings"
import { useToast } from "@/contexts/ToastContext"
import { format, formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import type { Task } from "@/types"
import { PageHeader } from "@/components/ui/PageHeader"
import { SearchInput } from "@/components/ui/SearchInput"
import { Button } from "@/components/ui/Button"
import { PriorityBadge, PriorityDot } from "@/components/ui/PriorityBadge"
import { EmptyState } from "@/components/ui/EmptyState"
import { PRIORITY_CONFIG, PRIORITY_ORDER } from "@/lib/design-tokens"

/* ── Types ── */
type SortKey = "completedAt" | "title" | "priority" | "dueDate"
type SortDir = "asc" | "desc"

/* Priority constants → @/lib/design-tokens */

const PAGE_SIZE = 20

function isElectron() {
  return typeof window !== "undefined" && !!(window as any).electron
}

/* ════════════════════════════════════════════════════════════ */
export default function ArchivePage() {
  const { tasks, rawTasks } = useTasks()
  const { categories } = useCategories()
  const { settings } = useSettings()
  const { showToast } = useToast()

  const [archivedTasks, setArchivedTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(false)
  const [backingUp, setBackingUp] = React.useState(false)

  // Filters / Sort
  const [search, setSearch] = React.useState("")
  const [sortKey, setSortKey] = React.useState<SortKey>("completedAt")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all")
  const [page, setPage] = React.useState(1)

  /* ── Load archived tasks from local FS ── */
  const loadArchives = React.useCallback(async () => {
    if (!isElectron()) return
    setLoading(true)
    try {
      const res = await (window as any).electron.ipcRenderer.invoke("read-archives")
      if (res?.success && Array.isArray(res.tasks)) {
        // Deduplicate tasks by id to prevent React duplicate key errors
        const taskMap = new Map<string, Task>()
        for (const t of res.tasks) {
          if (t?.id) {
            taskMap.set(t.id, t)
          }
        }
        setArchivedTasks(Array.from(taskMap.values()))
      }
    } catch (err) {
      console.error("Archive load error", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadArchives()
  }, [loadArchives])

  /* ── Filtered + Sorted + Paginated ── */
  const processed = React.useMemo(() => {
    let result = [...archivedTasks]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }

    if (priorityFilter !== "all") {
      result = result.filter(t => t.priority === priorityFilter)
    }

    // Ensure all items have unique IDs
    const uniqueMap = new Map<string, Task>()
    for (const t of result) {
      if (t?.id && !uniqueMap.has(t.id)) {
        uniqueMap.set(t.id, t)
      }
    }
    result = Array.from(uniqueMap.values())

    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "completedAt":
          cmp = (new Date(a.completedAt || 0).getTime()) - (new Date(b.completedAt || 0).getTime())
          break
        case "title":
          cmp = a.title.localeCompare(b.title, "tr")
          break
        case "priority":
          cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
          break
        case "dueDate":
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [archivedTasks, search, priorityFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const paginated = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  React.useEffect(() => { setPage(1) }, [search, priorityFilter, sortKey, sortDir])

  /* ── Backup ── */
  const handleBackup = async () => {
    if (!isElectron()) {
      showToast({ type: "warning", message: "Yedekleme yalnızca masaüstü uygulamasında çalışır." })
      return
    }
    setBackingUp(true)
    try {
      // Collect all data
      const activityLog = (() => {
        try { return JSON.parse(localStorage.getItem("FF_ACTIVITY_LOG") || "{}") } catch { return {} }
      })()

      const res = await (window as any).electron.ipcRenderer.invoke("create-full-backup", {
        tasks: rawTasks,
        categories,
        settings,
        activityLog,
      })

      if (res?.success) {
        showToast({ type: "success", message: `✅ Yedek kaydedildi: ${res.path?.split("\\").pop()}` })
      } else if (!res?.canceled) {
        showToast({ type: "error", message: "Yedekleme başarısız: " + res?.error })
      }
    } catch (err: any) {
      showToast({ type: "error", message: "Yedekleme hatası: " + err?.message })
    } finally {
      setBackingUp(false)
    }
  }

  const handleOpenFolder = () => {
    if (!isElectron()) return
    ;(window as any).electron.ipcRenderer.invoke("open-archives-folder")
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  /* ── Stat cards ── */
  const stats = React.useMemo(() => {
    const byPrio = archivedTasks.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1; return acc
    }, {} as Record<string, number>)
    return {
      total: archivedTasks.length,
      urgent: byPrio.urgent || 0,
      high: byPrio.high || 0,
      subtasks: archivedTasks.reduce((n, t) => n + (t.subtasks?.length || 0), 0),
    }
  }, [archivedTasks])

  /* ── Render ── */
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.04] flex-shrink-0">
        <PageHeader
          icon={Archive}
          title="Arşiv"
          subtitle="30 gün sonra otomatik arşivlenen tamamlanan görevler"
          iconColorClass="bg-purple-500/10 text-purple-400 border-purple-500/20"
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={loadArchives} disabled={loading}>
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                Yenile
              </Button>
              {isElectron() && (
                <Button variant="secondary" size="sm" onClick={handleOpenFolder}>
                  <FolderOpen className="w-3.5 h-3.5" />
                  Klasörü Aç
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleBackup} disabled={backingUp}>
                <Download className={cn("w-3.5 h-3.5", backingUp && "animate-bounce")} />
                {backingUp ? "Yedekleniyor..." : "Tüm Veriyi Yedekle"}
              </Button>
            </>
          }
        />

        {/* Stat row */}
        {archivedTasks.length > 0 && (
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {[
              { label: "Toplam Arşivlenen", value: stats.total, color: "text-purple-400" },
              { label: "Acil", value: stats.urgent, color: "text-red-400" },
              { label: "Yüksek", value: stats.high, color: "text-orange-400" },
              { label: "Alt Görev", value: stats.subtasks, color: "text-zinc-400" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <span className={cn("text-[13px] font-black tabular-nums", s.color)}>{s.value}</span>
                <span className="text-[11px] text-zinc-600 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 py-3 border-b border-white/[0.04] flex items-center gap-3 flex-wrap flex-shrink-0">
        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Arşivde ara..."
          className="flex-1 min-w-[180px] max-w-[320px]"
        />

        {/* Priority filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          {["all", "urgent", "high", "medium", "low"].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={cn(
                "flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-bold transition-all",
                priorityFilter === p
                  ? p === "all"
                    ? "bg-white/10 text-white"
                    : cn(PRIORITY_CONFIG[p]?.bg, PRIORITY_CONFIG[p]?.color)
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              {p !== "all" && <span className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_CONFIG[p]?.dot)} />}
              {p === "all" ? "Tümü" : PRIORITY_CONFIG[p]?.label}
            </button>
          ))}
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-1 ml-auto">
          {([
            { key: "completedAt" as SortKey, label: "Tarih" },
            { key: "priority" as SortKey, label: "Öncelik" },
            { key: "title" as SortKey, label: "İsim" },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => toggleSort(s.key)}
              className={cn(
                "flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold transition-all",
                sortKey === s.key
                  ? "bg-white/[0.08] text-white border border-white/[0.1]"
                  : "text-zinc-600 hover:text-zinc-300"
              )}
            >
              {s.label}
              {sortKey === s.key && (
                sortDir === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 pb-32">
        {!isElectron() ? (
          <EmptyState
            icon={Archive}
            title="Arşiv yalnızca masaüstü uygulamasında çalışır"
            description="Bu özellik, FocusFlow Desktop uygulamasına özeldir."
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-[13px] text-zinc-500">Arşiv dosyaları okunuyor...</p>
            </div>
          </div>
        ) : processed.length === 0 ? (
          <EmptyState
            icon={archivedTasks.length === 0 ? Inbox : Search}
            title={archivedTasks.length === 0 ? "Henüz arşivlenen görev yok" : "Sonuç bulunamadı"}
            description={archivedTasks.length === 0
              ? "30 günden eski tamamlanan görevler otomatik olarak buraya taşınır."
              : "Arama veya filtre kriterlerini değiştirmeyi dene."
            }
          />
        ) : (
          <>
            <div className="space-y-2 pb-4">
              <AnimatePresence mode="popLayout">
                {paginated.map((task, i) => (
                  <ArchiveCard
                    key={task.id}
                    task={task}
                    index={i}
                    categories={categories}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between py-4 border-t border-white/[0.05] mt-2">
                <p className="text-[12px] text-zinc-600 font-medium">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, processed.length)} / {processed.length} görev
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:text-white hover:bg-white/[0.07] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let num: number
                      if (totalPages <= 5) { num = i + 1 }
                      else if (page <= 3) { num = i + 1 }
                      else if (page >= totalPages - 2) { num = totalPages - 4 + i }
                      else { num = page - 2 + i }
                      return (
                        <button
                          key={num}
                          onClick={() => setPage(num)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-[12px] font-bold transition-all border",
                            page === num
                              ? "bg-white/[0.1] border-white/[0.15] text-white"
                              : "border-transparent text-zinc-600 hover:text-white hover:bg-white/[0.05]"
                          )}
                        >
                          {num}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:text-white hover:bg-white/[0.07] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Archive Card ── */
function ArchiveCard({ task, index, categories }: { task: Task; index: number; categories: any[] }) {
  const category = categories.find(c => c.id === task.categoryId)
  const completedDate = task.completedAt ? new Date(task.completedAt) : null
  const doneSubtasks = task.subtasks?.filter(s => s.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      className="group flex items-start gap-4 px-4 py-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
    >
      {/* Priority bar */}
      <div
        className={cn(
          "w-[3px] self-stretch rounded-full flex-shrink-0 mt-0.5",
          task.priority === "urgent" ? "bg-red-500"
          : task.priority === "high" ? "bg-orange-500"
          : task.priority === "medium" ? "bg-blue-500"
          : "bg-emerald-500"
        )}
      />

      {/* Done icon */}
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-zinc-300 leading-snug line-clamp-2">{task.title}</p>
        {task.description && (
          <p className="text-[12px] text-zinc-600 mt-0.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {/* Priority badge */}
          <PriorityBadge priority={task.priority} />

          {/* Category */}
          {category && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
              <Tag className="w-2.5 h-2.5" />
              {category.name}
            </span>
          )}

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <span className="text-[10px] text-zinc-600 font-medium">
              {doneSubtasks}/{totalSubtasks} alt görev
            </span>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {completedDate && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400/80 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            {format(completedDate, "d MMM yyyy", { locale: tr })}
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-1 text-[10px] text-zinc-600">
            <Calendar className="w-2.5 h-2.5" />
            {format(new Date(task.dueDate), "d MMM", { locale: tr })}
          </span>
        )}
        {completedDate && (
          <span className="text-[10px] text-zinc-700 italic">
            {formatDistanceToNow(completedDate, { addSuffix: true, locale: tr })}
          </span>
        )}
      </div>
    </motion.div>
  )
}

