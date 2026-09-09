"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Sparkles, ArrowUp, Calendar, Check, X,
  AlignLeft, ListTodo, Plus, Trash2,
  GripVertical
} from "lucide-react"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { CalendarPicker } from "../ui/CalendarPicker"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/useTasks"
import { useCategories } from "@/hooks/useCategories"
import { useSettings } from "@/hooks/useSettings"
import { TaskInputContextMenu } from "./TaskInputContextMenu"
import { 
  startOfDay, addDays, nextMonday, format, 
} from "date-fns"
import { tr } from "date-fns/locale"

const PRIORITY_STYLES = {
  low:    { active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25", dot: "bg-emerald-500" },
  medium: { active: "bg-blue-500/15 text-blue-400 border border-blue-500/25", dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" },
  high:   { active: "bg-orange-500/15 text-orange-400 border border-orange-500/25", dot: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" },
  urgent: { active: "bg-red-500/15 text-red-400 border border-red-500/25", dot: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" },
} as const

type Priority = "urgent" | "high" | "medium" | "low"

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "low", label: "DÜŞÜK" },
  { id: "medium", label: "ORTA" },
  { id: "high", label: "YÜKSEK" },
  { id: "urgent", label: "ACİL" },
]

export function TaskInput({ defaultDate, focusTrigger, className }: { defaultDate?: Date | null, focusTrigger?: number, className?: string }) {
  const { settings } = useSettings()
  const { addTask } = useTasks()
  const { categories } = useCategories()
  const today = React.useMemo(() => startOfDay(new Date()), [])

  const [isOpen, setIsOpen] = React.useState(false)
  const [text, setText] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [showDesc, setShowDesc] = React.useState(false)
  const [priority, setPriority] = React.useState<Priority>("medium")
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [dueDate, setDueDate] = React.useState<Date | null>(today)
  const [showCalendar, setShowCalendar] = React.useState(false)
  const [tempSubtasks, setTempSubtasks] = React.useState<{id: string, title: string}[]>([])
  const [showSubtasks, setShowSubtasks] = React.useState(false)
  const [subtaskInput, setSubtaskInput] = React.useState("")
  const [recurrence, setRecurrence] = React.useState<"none" | "daily" | "weekdays" | "weekly" | "monthly">("none")
  
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [menuCoords, setMenuCoords] = React.useState({ x: 0, y: 0 })

  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const calendarRef = React.useRef<HTMLDivElement>(null)
  const calendarButtonRef = React.useRef<HTMLDivElement>(null)

  // External trigger handle (e.g. from Planner)
  React.useEffect(() => {
    if (focusTrigger !== undefined && focusTrigger > 0) {
      setIsOpen(true)
      if (defaultDate) setDueDate(startOfDay(new Date(defaultDate)))
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [focusTrigger, defaultDate])

  const resetForm = React.useCallback(() => {
    setText("")
    setDescription("")
    setShowDesc(false)
    setPriority("medium")
    setSelectedCategory(null)
    setDueDate(today)
    setTempSubtasks([])
    setShowSubtasks(false)
    setSubtaskInput("")
    setRecurrence("none")
    setShowCalendar(false)
    setIsOpen(false)
  }, [today])

  const handleSubmit = React.useCallback(async () => {
    const title = text.trim()
    if (!title) return
    await addTask({
      title,
      description: description.trim(),
      priority,
      categoryId: selectedCategory || null,
      dueDate: dueDate || today,
      recurrence: recurrence === "none" ? null : recurrence,
      subtasks: tempSubtasks.map((s, idx) => ({ id: s.id, title: s.title, completed: false, order: idx + 1 }))
    })
    resetForm()
  }, [text, description, priority, selectedCategory, dueDate, recurrence, today, addTask, resetForm, tempSubtasks])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const target = e.target as HTMLElement
      const isTextarea = target.tagName === "TEXTAREA"
      const isSubtaskInput = (target as HTMLInputElement).placeholder?.includes("Enter'a bas")

      // If in subtask input and it has text, let the subtask addition logic handle it.
      if (isSubtaskInput && subtaskInput.trim()) return

      // Submit only if not in a newline-requiring field OR if Ctrl/Cmd is pressed
      if (!isTextarea || e.ctrlKey || e.metaKey) {
        e.preventDefault()
        handleSubmit()
      }
    }
  }

  return (
    <div 
      ref={containerRef} 
      className={cn("relative w-full mx-auto max-w-2xl px-2", isOpen ? "z-50" : "z-10", className)}
      onContextMenu={(e) => { e.preventDefault(); setMenuCoords({ x: e.clientX, y: e.clientY }); setMenuOpen(true) }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { 
                setShowCalendar(false)
                if (!text.trim()) setIsOpen(false) 
            }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[-1]"
          />
        )}
      </AnimatePresence>

        <motion.div
          layout
          onKeyDown={handleKeyDown}
          className={cn(
            "rounded-[28px] border transition-all duration-300 bg-[#121217] backdrop-blur-3xl p-2",
            isOpen ? "border-white/20 shadow-2xl bg-[#16161c]" : "border-white/10 shadow-lg",
          )}
        >
        {/* Input Area */}
        <div className="flex items-center h-12 px-3 gap-3">
          <Sparkles className={cn("w-5 h-5 transition-colors", isOpen ? "text-blue-400" : "text-zinc-400")} />
          <input
            ref={inputRef}
            type="text"
            data-task-input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Yeni görev ekle..."
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[15px] font-medium text-white placeholder:text-zinc-500 h-full focus:outline-none focus:ring-0"
          />
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-700 font-bold bg-white/[0.02] px-2 py-1 rounded-lg border border-white/[0.04]">
             <kbd className="opacity-60 font-mono">ENTER</kbd>
             <span className="opacity-20">|</span>
             <kbd className="opacity-60 font-mono">CTRL</kbd>
             <span className="opacity-30">+</span>
             <kbd className="opacity-60 font-mono">ENT</kbd>
             <span className="ml-1 opacity-40 font-medium whitespace-nowrap">Hızlı Kaydet</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
              text.trim() ? "bg-white/5 text-white hover:bg-white/10" : "text-zinc-800"
            )}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-1 overflow-hidden"
            >
              <div className="h-px bg-white/[0.04] mx-2 mb-3" />
              
              <div className="px-2 pb-4 space-y-5">
                {/* Control Row (Date + Priority + Quick Buttons) */}
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div
                        ref={calendarButtonRef}
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={cn(
                          "flex items-center gap-2 h-9 px-3.5 rounded-[12px] border text-[13px] font-bold transition-all",
                          dueDate ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/[0.02] border-white/[0.05] text-zinc-600"
                        )}
                      >
                         <Calendar className="w-4 h-4" />
                         <span>{dueDate ? (dueDate.getTime() === today.getTime() ? "Bugün" : format(dueDate, "d MMM", { locale: tr })) : "Tarih"}</span>
                         {dueDate && <X className="w-3 h-3 ml-1 opacity-60" onClick={(e) => { e.stopPropagation(); setDueDate(null) }} />}
                      </div>

                      <div className="flex items-center h-9 bg-white/[0.02] border border-white/[0.05] rounded-[14px] p-1">
                         {PRIORITIES.map((p) => {
                            const isActive = priority === p.id
                            const styles = PRIORITY_STYLES[p.id]
                            return (
                               <button 
                                 key={p.id}
                                 onClick={(e) => {
                                   setPriority(p.id)
                                   if (e.ctrlKey || e.metaKey) setTimeout(() => handleSubmit(), 0)
                                 }}
                                 className={cn(
                                   "flex items-center gap-2 px-3 h-full rounded-[10px] text-[9px] font-black transition-all",
                                   isActive ? styles.active : "text-zinc-700 hover:text-zinc-500"
                                 )}
                               >
                                  <div className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />
                                  {p.label}
                               </button>
                            )
                         })}
                      </div>
                   </div>

                   <div className="flex items-center gap-1.5 ml-auto">
                       <IconButton 
                          icon={AlignLeft} 
                          active={showDesc} 
                          onClick={() => setShowDesc(!showDesc)} 
                          title="Not Ekle"
                       />
                       {settings.features.subtasks && (
                         <IconButton 
                            icon={ListTodo} 
                            active={showSubtasks || tempSubtasks.length > 0} 
                            onClick={() => setShowSubtasks(!showSubtasks)} 
                            count={tempSubtasks.length}
                            title="Alt Görevler"
                         />
                       )}
                   </div>
                </div>

                <div className="flex flex-col gap-2">
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
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-1.5 flex-wrap ml-5">
                          {(["daily", "weekdays", "weekly", "monthly"] as const).map((r) => (
                            <button
                              type="button"
                              key={r}
                              onClick={() => setRecurrence(r)}
                              className={cn("text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all uppercase", 
                                recurrence === r ? "bg-purple-500/10 border-purple-500/25 text-purple-400" : "bg-transparent border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                              )}
                            >
                              {{ daily: "Her Gün", weekdays: "Hafta İçi", weekly: "Haftalık", monthly: "Aylık" }[r]}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="popLayout">
                  {showDesc && (
                    <motion.div key="input-desc" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="px-1 mb-4">
                        <textarea
                          autoFocus
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Görev notlarını buraya yazın..."
                          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-[18px] p-4 text-sm text-zinc-300 placeholder:text-zinc-800 resize-none outline-none focus:border-white/10 transition-all font-medium"
                          rows={2}
                        />
                    </motion.div>
                  )}

                  {showSubtasks && (
                    <motion.div key="input-subtasks" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3 px-1 mb-4">
                       <DragDropContext onDragEnd={(result) => {
                          if (!result.destination) return;
                          const items = Array.from(tempSubtasks);
                          const [reorderedItem] = items.splice(result.source.index, 1);
                          items.splice(result.destination.index, 0, reorderedItem);
                          setTempSubtasks(items);
                       }}>
                         <Droppable droppableId="temp-subtasks">
                           {(provided) => (
                             <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-1 px-2">
                               {tempSubtasks.map((s, idx) => (
                                 <Draggable key={s.id} draggableId={s.id} index={idx}>
                                   {(p, snap) => (
                                     <div 
                                       ref={p.innerRef} {...p.draggableProps} 
                                       className={cn(
                                         "flex items-center gap-2.5 group/sub rounded-xl p-2 transition-all", 
                                         snap.isDragging ? "bg-white/[0.08] shadow-2xl border border-white/10" : "text-zinc-300 hover:bg-white/[0.02] border border-transparent"
                                       )}
                                     >
                                        <div {...p.dragHandleProps} className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing p-1 -m-1">
                                           <GripVertical className="w-3.5 h-3.5" /> 
                                        </div>
                                        <span className="flex-1 text-[13px] font-medium">{s.title}</span>
                                        <button 
                                          onClick={() => setTempSubtasks(prev => prev.filter(item => item.id !== s.id))}
                                          className="text-zinc-600 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity p-1 -m-1"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                     </div>
                                   )}
                                 </Draggable>
                               ))}
                               {provided.placeholder}
                             </div>
                           )}
                         </Droppable>
                       </DragDropContext>
                       <div className="relative group mx-1">
                          <input 
                            autoFocus
                            value={subtaskInput}
                            onChange={(e) => setSubtaskInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && subtaskInput.trim()) {
                                    e.preventDefault()
                                    setTempSubtasks(p => [...p, { id: crypto.randomUUID(), title: subtaskInput.trim() }])
                                    setSubtaskInput("")
                                }
                            }}
                            placeholder="Alt görev yazıp Enter'a bas..."
                            className="w-full h-11 bg-white/[0.02] border border-white/[0.05] rounded-[18px] px-4 text-[13px] text-zinc-200 placeholder:text-zinc-700 outline-none focus:border-blue-500/20 transition-all font-medium"
                          />
                          <Plus className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-blue-500" />
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Category Section */}
                {settings.features.categories && (
                  <div className="space-y-3 px-1">
                    <p className="text-[9px] font-black text-zinc-700 tracking-[0.2em] uppercase px-1">KATEGORİ</p>
                    <CategoryManager 
                      selectedCategoryId={selectedCategory}
                      onSelect={(id, submit) => {
                        setSelectedCategory(id === selectedCategory ? null : id)
                        if (submit) setTimeout(() => handleSubmit(), 0)
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
         {showCalendar && (
            <motion.div
              ref={calendarRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-full mb-4 left-4 z-[100]"
            >
              <CalendarPicker 
                selectedDate={dueDate} onSelect={setDueDate} 
                onClose={() => setShowCalendar(false)} today={today} 
              />
            </motion.div>
         )}
      </AnimatePresence>

      <TaskInputContextMenu open={menuOpen} onClose={() => setMenuOpen(false)} coords={menuCoords} />
    </div>
  )
}

function IconButton({ icon: Icon, active, onClick, count, title }: { icon: any, active: boolean, onClick: () => void, count?: number, title: string }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            title={title}
            className={cn(
                "flex items-center justify-center w-10 h-10 rounded-[14px] border transition-all relative",
                active ? "bg-white/[0.08] border-white/20 text-zinc-200" : "bg-white/[0.02] border-white/[0.05] text-zinc-600 hover:text-zinc-400"
            )}
        >
            <Icon className="w-[18px] h-[18px]" />
            {count !== undefined && count > 0 && (
                <div className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-blue-500 text-[9px] font-black text-white flex items-center justify-center shadow-lg border-2 border-[#121216]">
                    {count}
                </div>
            )}
        </button>
    )
}