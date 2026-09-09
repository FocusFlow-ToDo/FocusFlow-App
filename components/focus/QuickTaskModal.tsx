"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  X, Plus, Calendar, Flag, Tag, Sparkles, Hash,
  Target, Zap, Star, Flame, Bookmark, Bell, Anchor, Crown,
  Briefcase, Laptop, LineChart, FileText, Layout, Code, Terminal, Database,
  User, Heart, Home, GraduationCap, Map, Camera, Music, Headphones,
  Activity, HeartPulse, Dumbbell, Apple, GlassWater,
  Palette, PenTool, Brush, Image as ImageIcon, Video, Mic,
  Clock, Hourglass, Timer,
  ShoppingBag, CreditCard, Gift, Sun, Moon, Cloud, TreePine, Coffee, RotateCcw, Check,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/useTasks"
import { useCategories } from "@/hooks/useCategories"
import { useToast } from "@/contexts/ToastContext"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { CalendarPicker } from "@/components/ui/CalendarPicker"
import { startOfDay, format } from "date-fns"
import { tr } from "date-fns/locale"

interface QuickTaskModalProps {
  open: boolean
  onClose: () => void
}

const PRIORITIES = [
  { id: "low", label: "Düşük", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "medium", label: "Orta", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "high", label: "Yüksek", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  { id: "urgent", label: "Acil", color: "text-red-400 bg-red-500/10 border-red-500/20" },
] as const

export function QuickTaskModal({ open, onClose }: QuickTaskModalProps) {
  const [title, setTitle] = React.useState("")
  const [priority, setPriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium")
  const [categoryId, setCategoryId] = React.useState<string | null>(null)
  const [dueDate, setDueDate] = React.useState<Date | null>(startOfDay(new Date()))
  const [recurrence, setRecurrence] = React.useState<"none" | "daily" | "weekdays" | "weekly" | "monthly">("none")
  const [showCalendar, setShowCalendar] = React.useState(false)
  
  
  const { addTask } = useTasks()
  const { categories } = useCategories()
  const { showToast } = useToast()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const priorityRef = React.useRef<HTMLDivElement>(null)
  const categoryRef = React.useRef<HTMLDivElement>(null)
  const cancelBtnRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (open) {
      setTitle("")
      setPriority("medium")
      setCategoryId(null)
      setDueDate(startOfDay(new Date()))
      setRecurrence("none")
      setShowCalendar(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      const elements = [inputRef.current, priorityRef.current, categoryRef.current].filter(Boolean) as HTMLElement[]
      const currentIdx = elements.indexOf(document.activeElement as HTMLElement)

      if (e.shiftKey) {
        if (currentIdx <= 0) {
          e.preventDefault()
          elements[elements.length - 1].focus()
        }
      } else {
        if (currentIdx === elements.length - 1 || currentIdx === -1) {
          e.preventDefault()
          elements[0].focus()
        }
      }
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") onClose()
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim()) return

    try {
      const cat = categories.find(c => c.id === categoryId)
      await addTask({
        title: title.trim(),
        priority,
        status: "todo",
        categoryId: categoryId || undefined,
        dueDate: dueDate || undefined,
        recurrence: recurrence === "none" ? null : recurrence,
        tags: cat ? [cat.name] : [],
        subtasks: []
      })
      showToast({ type: "success", message: "Görev hızlıca eklendi!" })
      onClose()
    } catch (err) {
      showToast({ type: "error", message: "Görev eklenirken hata oluştu." })
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-[111] flex items-start justify-center pt-[20vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onKeyDown={handleKeyDown}
              className="w-full max-w-xl pointer-events-auto bg-[#121217] backdrop-blur-3xl rounded-[32px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.7)] border border-white/10"
            >
              <div className="p-1">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-center px-5 h-16 gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <input
                      ref={inputRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSubmit()
                        }
                      }}
                      placeholder="Hızlıca bir görev ekle..."
                      className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-[17px] font-medium focus:outline-none focus:ring-0"
                    />
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-700 font-bold bg-white/[0.02] px-2 py-1 rounded-lg border border-white/[0.04]">
                       <kbd className="opacity-60 font-mono">ENTER</kbd>
                       <span className="opacity-20">|</span>
                       <kbd className="opacity-60 font-mono">CTRL</kbd>
                       <span className="opacity-30">+</span>
                       <kbd className="opacity-60 font-mono">ENT</kbd>
                    </div>
                  </div>

                  <div className="px-5 py-4 border-t border-white/[0.04] bg-white/[0.01] space-y-5">
                    {/* Priority Selector - Full Row */}
                    <div className="space-y-2.5">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                        <Flag className="w-3 h-3" /> Öncelik Seviyesi
                      </p>
                      <div 
                        ref={priorityRef}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          const idx = PRIORITIES.findIndex(p => p.id === priority)
                          if (e.key === "ArrowRight") {
                            e.preventDefault()
                            setPriority(PRIORITIES[(idx + 1) % PRIORITIES.length].id)
                          } else if (e.key === "ArrowLeft") {
                            e.preventDefault()
                            setPriority(PRIORITIES[(idx - 1 + PRIORITIES.length) % PRIORITIES.length].id)
                          } else if (e.key === "Enter") {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSubmit()
                          }
                        }}
                        className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05] outline-none focus:ring-1 focus:ring-blue-500/30 w-fit"
                      >
                        {PRIORITIES.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            tabIndex={-1}
                            onClick={() => setPriority(p.id)}
                            className={cn(
                              "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 border border-transparent",
                              priority === p.id 
                                ? cn(p.color, "shadow-sm scale-[1.05] border-white/5") 
                                : "text-zinc-600 hover:text-zinc-400"
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category Selector - Full Row */}
                    <div className="space-y-2.5 pb-2">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                        <Tag className="w-3 h-3" /> Kategori
                      </p>
                      <div 
                        ref={categoryRef}
                        className="px-0.5 outline-none focus:ring-1 focus:ring-blue-500/30 rounded-xl"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          const idx = categories.findIndex(c => c.id === categoryId)
                          if (e.key === "ArrowRight") {
                            e.preventDefault()
                            const nextIdx = idx === -1 ? 0 : (idx + 1) % categories.length
                            setCategoryId(categories[nextIdx].id)
                          } else if (e.key === "ArrowLeft") {
                            e.preventDefault()
                            const prevIdx = idx <= 0 ? categories.length - 1 : idx - 1
                            setCategoryId(categories[prevIdx].id)
                          } else if (e.key === "Enter") {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSubmit()
                          }
                        }}
                      >
                        <CategoryManager 
                          selectedCategoryId={categoryId} 
                          onSelect={setCategoryId} 
                        />
                      </div>
                    </div>

                    {/* Date Selector */}
                    <div className="space-y-2.5 pb-2 relative">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                        <Calendar className="w-3 h-3" /> Görev Tarihi
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowCalendar(!showCalendar)}
                          className={cn(
                            "flex items-center gap-2 h-9 px-3 rounded-xl border text-[12px] font-bold transition-all w-fit outline-none focus:ring-1 focus:ring-blue-500/30",
                            dueDate ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/[0.02] border-white/[0.05] text-zinc-600"
                          )}
                        >
                          {dueDate ? (dueDate.getTime() === startOfDay(new Date()).getTime() ? "Bugün" : format(dueDate, "d MMM", { locale: tr })) : "Tarih Seç"}
                          {dueDate && <X className="w-3 h-3 ml-1 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setDueDate(null) }} />}
                        </button>
                        
                        <AnimatePresence>
                          {showCalendar && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full left-0 mb-2 z-[120]"
                            >
                              <CalendarPicker 
                                selectedDate={dueDate} 
                                onSelect={(d) => { setDueDate(d); setShowCalendar(false); setTimeout(() => inputRef.current?.focus(), 50) }} 
                                onClose={() => setShowCalendar(false)} 
                                today={startOfDay(new Date())} 
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Recurrence Selector */}
                    <div className="space-y-2.5 pb-2 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setRecurrence(recurrence === "none" ? "daily" : "none")}
                        className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors w-fit px-1 focus:outline-none"
                      >
                        <div className={cn("w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all", 
                          recurrence !== "none" ? "bg-purple-500 border-purple-500 text-white" : "bg-white/[0.05] border-white/10 text-transparent"
                        )}>
                          <Check className="w-2.5 h-2.5 stroke-[4]" />
                        </div>
                        <span className="tracking-wide">Bu tekrarlayan bir görev mi?</span>
                      </button>

                      <AnimatePresence>
                        {recurrence !== "none" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05] w-fit mt-1 ml-5">
                              {(["daily", "weekdays", "weekly", "monthly"] as const).map((r) => {
                                const disabled = !dueDate;
                                return (
                                  <button
                                    key={r}
                                    type="button"
                                    tabIndex={-1}
                                    disabled={disabled}
                                    onClick={() => setRecurrence(r)}
                                    className={cn(
                                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 border border-transparent",
                                      recurrence === r 
                                        ? "bg-purple-500/10 border-purple-500/25 text-purple-400 shadow-sm scale-[1.05]" 
                                        : "text-zinc-600 hover:text-zinc-300",
                                      disabled && "opacity-30 cursor-not-allowed hover:text-zinc-600"
                                    )}
                                  >
                                    {{ daily: "Günlük", weekdays: "Hafta İçi", weekly: "Haftalık", monthly: "Aylık" }[r]}
                                  </button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.02]">
                       <p className="text-[10px] text-zinc-700 font-medium italic">
                          <kbd className="glass-badge px-1 py-0.5 rounded mr-1">TAB</kbd> ile alanlar arası, <kbd className="glass-badge px-1 py-0.5 rounded mx-1">← →</kbd> ile seçim yapın. <kbd className="glass-badge px-1 py-0.5 rounded ml-2">ENT</kbd> Kaydet.
                       </p>
                       <button
                          type="button"
                          onClick={onClose}
                          className="px-3 py-1 text-zinc-600 hover:text-zinc-400 text-[10px] font-bold uppercase tracking-widest transition-all outline-none focus:text-zinc-300"
                        >
                          İptal (ESC)
                        </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
