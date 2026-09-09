"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Target, Calendar, ListTodo, BarChart2, Settings, Plus, ArrowRight, Hash } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useTasks } from "@/hooks/useTasks"
import { useCategories } from "@/hooks/useCategories"
import { CategorySymbol } from "@/components/ui/CategorySymbol"

interface CommandItem { id: string; title: string; icon: React.ReactNode; group: string; action: () => void; keywords?: string; subtitle?: React.ReactNode }
interface CommandPaletteProps { open: boolean; onOpenChange: (open: boolean) => void }

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { tasks, setTaskFocused } = useTasks()
  const { categories } = useCategories()

  React.useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false) }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [open, onOpenChange])

  React.useEffect(() => {
    if (open) { setQuery(""); setActiveIndex(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  const items = React.useMemo<CommandItem[]>(() => {
    const nav: CommandItem[] = [
      { id: "nav-focus", title: "Focus", icon: <Target className="w-4 h-4" />, group: "Sayfalar", action: () => router.push("/"), keywords: "odak home" },
      { id: "nav-planner", title: "Planlayıcı", icon: <Calendar className="w-4 h-4" />, group: "Sayfalar", action: () => router.push("/planner"), keywords: "plan hafta" },
      { id: "nav-tasks", title: "Görevler", icon: <ListTodo className="w-4 h-4" />, group: "Sayfalar", action: () => router.push("/tasks"), keywords: "görev task" },
      { id: "nav-analytics", title: "Analizler", icon: <BarChart2 className="w-4 h-4" />, group: "Sayfalar", action: () => router.push("/analytics"), keywords: "analiz" },
      { id: "nav-settings", title: "Ayarlar", icon: <Settings className="w-4 h-4" />, group: "Sayfalar", action: () => router.push("/settings"), keywords: "ayar tema" },
    ]
    const actions: CommandItem[] = [{
      id: "act-newtask", title: "Yeni Görev Ekle", icon: <Plus className="w-4 h-4" />, group: "Aksiyonlar",
      action: () => { router.push("/tasks"); setTimeout(() => document.querySelector<HTMLInputElement>("[data-task-input]")?.focus(), 300) },
      keywords: "ekle yeni",
    }]
    const recentTasks: CommandItem[] = tasks.filter((t) => t.status !== "done").slice(0, 10).map((t) => {
      const category = categories.find(c => c.id === t.categoryId) || 
        (t.tags?.[0] ? categories.find(c => c.name.toLowerCase() === t.tags[0].toLowerCase()) : null);

      return {
        id: `task-${t.id}`, title: t.title, 
        icon: category ? <CategorySymbol symbol={category.emoji} className="w-4 h-4" /> : <Hash className="w-4 h-4" />, 
        group: "Görevler",
        action: async () => { await setTaskFocused(t.id); router.push("/") }, 
        keywords: t.tags?.join(" "),
        subtitle: (
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-[8px] font-black uppercase tracking-widest", 
              t.priority === "urgent" ? "text-red-400" : t.priority === "high" ? "text-orange-400" : t.priority === "medium" ? "text-blue-400" : "text-emerald-400"
            )}>
              {t.priority === "urgent" ? "Acil" : t.priority === "high" ? "Yüksek" : t.priority === "medium" ? "Orta" : "Düşük"}
            </span>
            {t.dueDate && (
              <span className="text-[9px] text-zinc-600 font-medium">
                · {format(new Date(t.dueDate), "d MMM", { locale: tr })}
              </span>
            )}
          </div>
        )
      }
    })
    return [...nav, ...actions, ...recentTasks]
  }, [tasks, router, setTaskFocused])

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((i) => i.title.toLowerCase().includes(q) || i.keywords?.toLowerCase().includes(q))
  }, [items, query])

  const groups = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    filtered.forEach((i) => { const e = map.get(i.group) || []; e.push(i); map.set(i.group, e) })
    return map
  }, [filtered])

  React.useEffect(() => { setActiveIndex(0) }, [query])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === "Enter" && filtered[activeIndex]) { e.preventDefault(); filtered[activeIndex].action(); onOpenChange(false) }
  }, [filtered, activeIndex, onOpenChange])

  React.useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4 pointer-events-none">
            <motion.div initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-lg pointer-events-auto glass-dropdown rounded-2xl overflow-hidden">

              <div className="flex items-center px-4 h-14 border-b border-white/[0.06]">
                <Search className="w-[18px] h-[18px] text-zinc-500 mr-3 flex-shrink-0" />
                <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Sayfa, görev veya komut ara..." className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 outline-none text-[15px] focus:outline-none focus:ring-0" />
                <kbd className="text-[9px] text-zinc-600 glass-badge px-1.5 py-0.5 rounded font-mono ml-2">ESC</kbd>
              </div>

              <div ref={listRef} className="max-h-[320px] overflow-y-auto custom-scrollbar p-1.5">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-zinc-500">Sonuç bulunamadı</p>
                  </div>
                ) : (
                  Array.from(groups.entries()).map(([gName, gItems]) => (
                    <div key={gName} className="mb-1 last:mb-0">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-[0.1em] font-semibold px-3 py-1.5 select-none">{gName}</p>
                      {gItems.map((item) => {
                        const gIdx = filtered.indexOf(item)
                        const isActive = gIdx === activeIndex
                        return (
                          <button key={item.id} data-index={gIdx}
                            onClick={() => { item.action(); onOpenChange(false) }}
                            onMouseEnter={() => setActiveIndex(gIdx)}
                            className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-xl outline-none transition-colors",
                              isActive ? "bg-white/[0.06] text-zinc-100" : "text-zinc-400 hover:text-zinc-200")}>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={cn("flex-shrink-0 mt-0.5", isActive ? "accent-text" : "text-zinc-500")}>{item.icon}</span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-medium truncate leading-tight">{item.title}</span>
                                {item.subtitle && (
                                  <div className="flex items-center min-w-0">{item.subtitle}</div>
                                )}
                              </div>
                            </div>
                            <ArrowRight className={cn("w-3.5 h-3.5 flex-shrink-0 transition-opacity", isActive ? "opacity-50" : "opacity-0")} />
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-white/[0.04] px-4 py-2 flex items-center gap-4 text-[10px] text-zinc-700">
                <span className="flex items-center gap-1"><kbd className="glass-badge px-1 py-px rounded font-mono">↑↓</kbd>Gezin</span>
                <span className="flex items-center gap-1"><kbd className="glass-badge px-1 py-px rounded font-mono">↵</kbd>Seç</span>
                <span className="flex items-center gap-1"><kbd className="glass-badge px-1 py-px rounded font-mono">Esc</kbd>Kapat</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}