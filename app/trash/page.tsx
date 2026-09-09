"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Trash2, RotateCcw, Trash, AlertTriangle, 
  Calendar, Clock, Filter, Search, MoreVertical 
} from "lucide-react"
import { useTasks } from "@/hooks/useTasks"
import { useSettings } from "@/hooks/useSettings"
import { cn } from "@/lib/utils"
import { format, differenceInDays, addDays } from "date-fns"
import { tr } from "date-fns/locale"
import { PageHeader } from "@/components/ui/PageHeader"
import { SearchInput } from "@/components/ui/SearchInput"
import { EmptyState } from "@/components/ui/EmptyState"
import { PriorityBadge } from "@/components/ui/PriorityBadge"
import { Button } from "@/components/ui/Button"
import { Divider } from "@/components/ui/Divider"

export default function TrashPage() {
  const { rawTasks, restoreTask, hardDeleteTask } = useTasks()
  const { settings } = useSettings()
  const [search, setSearch] = React.useState("")

  const trashTasks = React.useMemo(() => {
    const list = rawTasks
      .filter(t => t.status === "trash")
      .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.deletedAt?.getTime() || 0) - (a.deletedAt?.getTime() || 0))

    const uniqueMap = new Map<string, typeof list[0]>()
    for (const t of list) {
      if (t?.id && !uniqueMap.has(t.id)) {
        uniqueMap.set(t.id, t)
      }
    }
    return Array.from(uniqueMap.values())
  }, [rawTasks, search])

  const expiringSoonCount = React.useMemo(() => 
    trashTasks.filter(t => {
      const daysInTrash = t.deletedAt ? differenceInDays(new Date(), t.deletedAt) : 0
      return (settings.trashRetentionDays - daysInTrash) <= 1
    }).length
  , [trashTasks, settings.trashRetentionDays])

  const handleRestoreAll = async () => {
    if (confirm("Tüm görevleri geri yüklemek istediğinize emin misiniz?")) {
      for (const t of trashTasks) await restoreTask(t.id)
    }
  }

  const handleEmptyTrash = async () => {
    if (confirm("Çöp kutusunu tamamen boşaltmak istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      for (const t of trashTasks) await hardDeleteTask(t.id)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <PageHeader
          icon={Trash2}
          title="Çöp Kutusu"
          subtitle={`${trashTasks.length} görev silinmeyi bekliyor`}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={handleRestoreAll} disabled={trashTasks.length === 0}>
                Hepsini Kurtar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleEmptyTrash} disabled={trashTasks.length === 0}>
                Çöpü Boşalt
              </Button>
            </>
          }
          className="mb-5"
        />

        {/* SEARCH */}
        <SearchInput value={search} onChange={setSearch} placeholder="Çöpte ara..." />

        {expiringSoonCount > 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-4 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500 flex-shrink-0 animate-pulse">
               <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-400 uppercase tracking-tight">Kritik Silme Uyarısı</p>
              <p className="text-[12px] text-rose-300/70 mt-0.5 leading-relaxed font-medium">
                <span className="text-white font-black">{expiringSoonCount} GÖREVİN</span> süresi bitmek üzere! Bu görevler yarın kalıcı olarak sistemden silinecek.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="mt-4 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] flex items-start gap-3 opacity-60">
            <AlertTriangle className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-500 leading-relaxed uppercase tracking-wider font-bold">
              Görevler silindikten <span className="text-zinc-300 font-black px-1 underline decoration-white/10">{settings.trashRetentionDays} GÜN</span> sonra otomatik olarak kalıcı olarak silinecektir.
            </p>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-32">
        {trashTasks.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title="Çöp Kutusu Boş"
            description="Silinen görevler burada görüntülenir."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {trashTasks.map((task) => (
                <TrashTaskCard 
                  key={task.id} 
                  task={task} 
                  retentionDays={settings.trashRetentionDays}
                  onRestore={() => restoreTask(task.id)}
                  onDelete={() => hardDeleteTask(task.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function TrashTaskCard({ task, retentionDays, onRestore, onDelete }: any) {
  const daysInTrash = task.deletedAt ? differenceInDays(new Date(), task.deletedAt) : 0
  const daysLeft = Math.max(0, retentionDays - daysInTrash)
  const isUrgent = daysLeft <= 3

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card group p-4 rounded-2xl relative overflow-hidden"
    >
      {/* PROGRESS BAR (Time left) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/[0.02]">
        <div 
          className={cn("h-full transition-all duration-1000", isUrgent ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-zinc-700")} 
          style={{ width: `${(daysLeft / retentionDays) * 100}%` }}
        />
      </div>

      <div className="flex justify-between items-start mb-3 mt-1">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-zinc-300 truncate group-hover:text-white transition-colors">
            {task.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
              isUrgent ? "bg-rose-500/10 text-rose-500" : "bg-white/[0.05] text-zinc-500"
            )}>
              {daysLeft} gün kaldı
            </span>
          </div>
        </div>
        
        <div className="flex gap-1 ml-4 shadow-xl">
          <button 
            onClick={onRestore}
            title="Geri Yükle"
            className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={onDelete}
            title="Kalıcı Sil"
            className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 line-clamp-2 italic">
        {task.description || "Açıklama yok"}
      </p>

      <Divider spacing="sm" className="mt-4" />
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 text-zinc-600">
          <Calendar className="w-3 h-3" />
          <span className="text-[10px] font-medium">
            {task.deletedAt ? format(task.deletedAt, "d MMM yyyy", { locale: tr }) : "—"}
          </span>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>
    </motion.div>
  )
}
