"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  X, Calendar, Trash2, Flag, Tag, AlignLeft, CheckCircle2, Circle, PlayCircle, Check, Plus, ListTodo, GripVertical, RotateCcw, Layers
} from "lucide-react"
import { Task } from "@/types"
import { useTasks } from "@/hooks/useTasks"
import { useSettings } from "@/hooks/useSettings"
import { useTaskGroups } from "@/hooks/useTaskGroups"
import { useToast } from "@/contexts/ToastContext"
import { 
  format, startOfDay, isToday, isTomorrow, isYesterday
} from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarPicker } from "../ui/CalendarPicker"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { cn } from "@/lib/utils"

function getFriendlyDate(date: Date) {
  if (isToday(date)) return "Bugün"
  if (isTomorrow(date)) return "Yarın"
  if (isYesterday(date)) return "Dün"
  return format(date, "d MMMM yyyy", { locale: tr })
}

const PRIORITY_CLASSES: Record<string, string> = {
  low:    "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20",
  medium: "bg-blue-500/10 border-blue-500/25 text-blue-400 hover:bg-blue-500/20",
  high:   "bg-orange-500/10 border-orange-500/25 text-orange-400 hover:bg-orange-500/20",
  urgent: "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25",
}

const INACTIVE = "bg-white/[0.02] border-white/[0.04] text-zinc-500 hover:bg-white/[0.06] hover:border-white/[0.1]"

interface TaskDetailDrawerProps {
  task: Task | null
  onClose: () => void
}

export function TaskDetailDrawer({ task: initialTask, onClose }: TaskDetailDrawerProps) {
  const { tasks, updateTask, deleteTask } = useTasks()
  const { settings } = useSettings()
  const { showToast } = useToast()
  const { groups } = useTaskGroups()

  const task = tasks.find((t) => t.id === initialTask?.id) || initialTask
  const today = React.useMemo(() => startOfDay(new Date()), [])

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [showCalendar, setShowCalendar] = React.useState(false)
  
  const [optimisticSubtasks, setOptimisticSubtasks] = React.useState(task?.subtasks || [])
  const [isRecurrenceOpen, setIsRecurrenceOpen] = React.useState(!!task?.recurrence)

  const calendarRef = React.useRef<HTMLDivElement>(null)
  const calendarButtonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (task) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setOptimisticSubtasks(task.subtasks || [])
      if (task.recurrence) setIsRecurrenceOpen(true)
    }
  }, [task?.id, task?.subtasks, task?.recurrence])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (showCalendar && 
          calendarRef.current && !calendarRef.current.contains(target) &&
          calendarButtonRef.current && !calendarButtonRef.current.contains(target)) {
        setShowCalendar(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showCalendar])

  const handleUpdate = async (updates: Partial<Task>) => {
    if (task) await updateTask(task.id, updates)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !optimisticSubtasks) return
    const items = Array.from(optimisticSubtasks).sort((a, b) => a.order - b.order)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    const newItems = items.map((t, idx) => ({ ...t, order: idx }))
    
    setOptimisticSubtasks(newItems)
    handleUpdate({ subtasks: newItems })
  }

  const handleDeleteDirect = async () => {
    if (!task) return
    await deleteTask(task.id)
    onClose()
    showToast({ type: "success", message: "Görev çöp kutusuna taşındı." })
  }

  return (
    <>
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed top-0 bottom-0 right-0 w-full max-w-[420px] z-[101] flex flex-col shadow-[[-24px_0_48px_rgba(0,0,0,0.5)]] bg-white/[0.03] backdrop-blur-3xl border-l border-white/[0.08]"
          >
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-5 flex-shrink-0">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <h2 className="text-zinc-500 text-[9px] uppercase tracking-[0.2em] font-extrabold">Görev Detayları</h2>
                </div>
                {task.createdAt && (
                  <span className="text-[10px] text-zinc-600 font-medium ml-3.5 italic">
                    {format(new Date(task.createdAt), "d MMMM yyyy · HH:mm", { locale: tr })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleDeleteDirect} className="w-8 h-8 flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-90" title="Görevi Çöp Kutusuna Gönder">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-white/5 hover:text-zinc-100 rounded-lg transition-all active:scale-90">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar px-6 pb-6 pt-2">
              <div className="flex flex-col gap-5">
                
                {/* Title Section */}
                <div className="relative group">
                  <textarea
                    ref={(el) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }
                    }}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    onBlur={() => handleUpdate({ title })}
                    rows={1}
                    className="w-full bg-transparent p-0 text-[26px] font-bold text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-0 leading-tight transition-all duration-200"
                    placeholder="Görev adı..."
                  />
                </div>

                {/* Properties List */}
                <div className="flex flex-col gap-0.5 pt-4 border-t border-white/[0.06]">
                  <FieldRow label="Durum" icon={CheckCircle2}>
                    <div className="p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05] flex gap-0.5 items-center">
                      {(["todo", "in_progress", "done"] as const).map((s) => {
                        const isActive = task.status === s
                        const colors = {
                          todo: isActive ? "text-zinc-200 bg-white/10 shadow-sm" : "text-zinc-500 hover:text-zinc-300",
                          in_progress: isActive ? "text-blue-400 bg-blue-500/15 shadow-sm" : "text-zinc-500 hover:text-zinc-300",
                          done: isActive ? "text-emerald-400 bg-emerald-500/15 shadow-sm" : "text-zinc-500 hover:text-zinc-300",
                        }
                        const Icon = { todo: Circle, in_progress: PlayCircle, done: CheckCircle2 }[s]

                        return (
                            <button
                              key={s}
                              onClick={() => handleUpdate({
                                status: s,
                                ...(s === "done" ? { completedAt: new Date(), isFocused: false } : { completedAt: null }),
                              })}
                              className={cn("flex px-3 py-1.5 items-center justify-center gap-1.5 text-[11px] font-bold tracking-wide rounded-md transition-all", colors[s])}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {s === "todo" ? "Hazır" : s === "in_progress" ? "Devam" : "Bitti"}
                            </button>
                        )
                      })}
                    </div>
                  </FieldRow>

                  <FieldRow label="Öncelik" icon={Flag}>
                    <div className="flex gap-1">
                      {(["low", "medium", "high", "urgent"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => handleUpdate({ priority: p })}
                          className={cn("text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1.5", task.priority === p ? PRIORITY_CLASSES[p] : "bg-transparent border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300")}
                        >
                          {{ low: "Düşük", medium: "Orta", high: "Yüksek", urgent: "Acil" }[p]}
                        </button>
                      ))}
                    </div>
                  </FieldRow>

                  <FieldRow label="Kategori" icon={Tag}>
                    <CategoryManager 
                      selectedCategoryId={task.categoryId}
                      onSelect={(id) => handleUpdate({ categoryId: id })}
                    />
                  </FieldRow>

                  <FieldRow label="Özel Grup" icon={Layers}>
                    <select
                      value={task.groupId || ""}
                      onChange={(e) => {
                        const gId = e.target.value
                        const grp = groups.find((g) => g.id === gId)
                        handleUpdate({
                          groupId: grp ? grp.id : null,
                          groupName: grp ? grp.name : null,
                          groupColor: grp ? grp.color : null,
                          groupIcon: grp ? (grp.icon || "📁") : null
                        })
                      }}
                      className="bg-white/[0.04] border border-white/[0.08] text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500/40"
                    >
                      <option value="" className="bg-[#141419] text-zinc-400">Grup Yok</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id} className="bg-[#141419] text-zinc-200">
                          {g.icon ? `${g.icon} ` : ""}{g.name}
                        </option>
                      ))}
                    </select>
                  </FieldRow>

                  <FieldRow label="Teslim Tarihi" icon={Calendar}>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          ref={calendarButtonRef}
                          onClick={() => setShowCalendar(!showCalendar)}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="text-[12px] font-medium text-zinc-300 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] flex items-center gap-2 transition-all"
                        >
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          {task.dueDate ? getFriendlyDate(new Date(task.dueDate)) : "Belirle"}
                        </button>

                        <AnimatePresence>
                          {showCalendar && (
                            <div ref={calendarRef} className="absolute bottom-full mb-3 left-0 z-[60]">
                              <CalendarPicker
                                selectedDate={task.dueDate ? new Date(task.dueDate) : null}
                                onSelect={(d) => handleUpdate({ dueDate: d })}
                                onClose={() => setShowCalendar(false)}
                                today={today}
                              />
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                      {task.dueDate && (
                        <button onClick={() => handleUpdate({ dueDate: null })} className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Kaldır">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </FieldRow>

                  <FieldRow label="Tekrar" icon={RotateCcw}>
                    <div className="flex flex-col w-full">
                      <button
                        type="button"
                        onClick={() => {
                           if (task.recurrence) {
                             handleUpdate({ recurrence: null })
                             setIsRecurrenceOpen(false)
                           } else {
                             setIsRecurrenceOpen(!isRecurrenceOpen)
                           }
                        }}
                        className="flex items-center gap-2 text-[12px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors w-fit focus:outline-none h-8"
                      >
                        <div className={cn("w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all", 
                          (task.recurrence || isRecurrenceOpen) ? "bg-purple-500 border-purple-500 text-white" : "bg-white/[0.05] border-white/10 text-transparent"
                        )}>
                          <Check className="w-2.5 h-2.5 stroke-[4]" />
                        </div>
                        <span className="tracking-wide">Bu tekrarlayan bir görev mi?</span>
                      </button>

                      <AnimatePresence>
                        {isRecurrenceOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="flex gap-1.5 flex-wrap ml-5">
                              {(["daily", "weekdays", "weekly", "monthly"] as const).map((r) => {
                                const disabled = !task.dueDate;
                                return (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => { 
                                      if (!disabled) handleUpdate({ recurrence: r }) 
                                    }}
                                    disabled={disabled}
                                    className={cn("text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5", 
                                      task.recurrence === r ? "bg-purple-500/10 border-purple-500/25 text-purple-400" : "bg-transparent border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
                                      disabled ? "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-zinc-500" : "active:scale-95 cursor-pointer"
                                    )}
                                  >
                                    {{ daily: "Her Gün", weekdays: "Hafta İçi", weekly: "Haftalık", monthly: "Aylık" }[r]}
                                  </button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </FieldRow>
                </div>

                  <div className="flex flex-col gap-2 pt-6 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                       <AlignLeft className="w-4 h-4 text-zinc-500" />
                       <span className="text-[12px] font-semibold text-zinc-400">Açıklama</span>
                    </div>
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.style.height = "auto";
                          const scrollH = el.scrollHeight;
                          el.style.height = (scrollH < 44 ? 44 : scrollH > 400 ? 400 : scrollH) + "px";
                        }
                      }}
                      rows={1}
                      className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 text-[13px] leading-relaxed text-zinc-300 placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all hover:bg-white/[0.05] focus:bg-white/[0.05]"
                      placeholder="Görev için açıklama veya not ekle..."
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        e.target.style.height = "auto";
                        const scrollH = e.target.scrollHeight;
                        e.target.style.height = (scrollH < 44 ? 44 : scrollH > 400 ? 400 : scrollH) + "px";
                      }}
                      onBlur={() => handleUpdate({ description })}
                    />
                  </div>

                  {settings.features.subtasks && (
                    <div className="flex flex-col gap-3 pt-6 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <ListTodo className="w-4 h-4 text-zinc-500" />
                           <span className="text-[12px] font-semibold text-zinc-400">Alt Görevler</span>
                        </div>
                        {task.subtasks && task.subtasks.length > 0 && task.subtasks.some(s => !s.completed) && (
                          <button 
                            onClick={() => {
                               const next = task.subtasks!.map(s => ({ ...s, completed: true, completedAt: s.completedAt || new Date().toISOString() }))
                               handleUpdate({ subtasks: next })
                            }}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                          >
                            Hepsini Bitir
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {/* Subtasks Progress */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black tracking-widest text-zinc-600 uppercase px-1">
                              <span>İlerleme</span>
                              <span>{Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                              />
                            </div>
                          </div>
                        )}

                        {/* Subtasks List */}
                        <div className="space-y-1.5">
                           <DragDropContext onDragEnd={handleDragEnd}>
                             <Droppable droppableId="subtasks-list">
                               {(provided) => (
                                 <div ref={provided.innerRef} {...provided.droppableProps}>
                                  <AnimatePresence mode="popLayout">
                                    {optimisticSubtasks.sort((a,b) => a.order - b.order).map((s, index) => (
                                      <SubtaskRow key={s.id} item={s} index={index} handleUpdate={handleUpdate} task={task} />
                                    ))}
                                    {provided.placeholder}
                                  </AnimatePresence>
                                 </div>
                               )}
                             </Droppable>
                           </DragDropContext>

                           {/* Add Subtask Input */}
                           <div className="relative group mt-3">
                              <input 
                                type="text"
                                placeholder="Yeni alt görev ekle..."
                                className="w-full h-11 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 pr-12 text-[13px] font-medium text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.08] transition-all"
                                onKeyDown={(e: any) => {
                                  if (e.key === "Enter" && e.target.value.trim()) {
                                    const newVal = e.target.value.trim()
                                    const newSubtask = {
                                      id: crypto.randomUUID(),
                                      title: newVal,
                                      completed: false,
                                      order: (task.subtasks?.length || 0) + 1
                                    }
                                    handleUpdate({ subtasks: [...(task.subtasks || []), newSubtask] })
                                    e.target.value = ""
                                  }
                                }}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                 <Plus className="w-4 h-4" />
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            <div className="px-6 py-4 bg-white/[0.03] border-t border-white/[0.06] flex items-center justify-center pointer-events-none">
              <div className="text-[9px] text-zinc-700 font-bold tracking-widest uppercase">ID: {task?.id.slice(-8)}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  )
}

function FieldRow({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center min-h-[40px] gap-4 w-full group/row">
      <div className="flex items-center gap-2 w-[110px] shrink-0">
        <Icon className="w-4 h-4 text-zinc-500 transition-colors group-hover/row:text-zinc-400" />
        <span className="text-[12px] font-semibold text-zinc-400 transition-colors group-hover/row:text-zinc-300">{label}</span>
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-start gap-2">
        {children}
      </div>
    </div>
  )
}

function SubtaskRow({ item, index, handleUpdate, task }: { item: any, index: number, handleUpdate: any, task: any }) {
  const [localTitle, setLocalTitle] = React.useState(item.title)
  React.useEffect(() => { setLocalTitle(item.title) }, [item.title])
  return (
      <Draggable key={item.id} draggableId={item.id} index={index}>
        {(p, snap) => {
          const child = (
            <div 
              ref={p.innerRef} {...p.draggableProps} 
              className={cn(
                "group flex items-center gap-2.5 p-2 rounded-xl border transition-all mb-1.5",
                item.completed ? "bg-emerald-500/[0.04] border-emerald-500/10 opacity-70" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10",
                snap.isDragging ? "shadow-[0_24px_64px_-16px_rgba(0,0,0,0.5)] bg-[#1a1a24] border-white/20 z-[99999] ring-2 ring-blue-500/20" : ""
              )}
              style={p.draggableProps.style}
            >
              <div {...p.dragHandleProps} className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing p-1 -m-1">
                 <GripVertical className="w-3.5 h-3.5" /> 
              </div>
              <button 
                onClick={() => {
                  const next = task.subtasks!.map((s:any) => s.id === item.id ? { 
                      ...s, 
                      completed: !s.completed,
                      completedAt: !s.completed ? new Date().toISOString() : null
                  } : s)
                  handleUpdate({ subtasks: next })
                }}
                className={cn(
                  "w-5 h-5 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer",
                  item.completed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white/5 border-white/10 text-transparent hover:border-white/30"
                )}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </button>
              <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={() => {
                   if (localTitle.trim() !== item.title) {
                      const next = task.subtasks!.map((s:any) => s.id === item.id ? { ...s, title: localTitle.trim() } : s)
                      handleUpdate({ subtasks: next })
                   }
                }}
                className={cn(
                  "flex-1 text-[13px] font-medium transition-all bg-transparent outline-none min-w-0 cursor-text", 
                  item.completed ? "text-zinc-500 line-through" : "text-zinc-200 focus:text-white"
                )}
                onKeyDown={(e) => {
                   e.stopPropagation()
                   if (e.key === "Enter") e.currentTarget.blur()
                }}
              />
              <button 
                onClick={() => {
                   const next = task.subtasks!.filter((s:any) => s.id !== item.id)
                   handleUpdate({ subtasks: next })
                }}
                className="w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );

          if (snap.isDragging && typeof document !== "undefined") {
            return require('react-dom').createPortal(child, document.body);
          }
          return child;
        }}
      </Draggable>
  )
}