"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/useTasks"
import { Target, Calendar, } from "lucide-react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

/* ═══════════════════════════════════════════ */
/*  Constants                                  */
/* ═══════════════════════════════════════════ */
const MAX_VISIBLE = 3

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-blue-400",
  low: "bg-emerald-400",
}

/* ═══════════════════════════════════════════ */
/*  NextTasks Component                        */
/* ═══════════════════════════════════════════ */
export function NextTasks() {
  const {
    tasks,
    activeTask,
    setTaskFocused,
    batchUpdateTasks,
  } = useTasks()

  /* ── Pending tasks (excluding active) ── */
  const pendingTasks = React.useMemo(() => {
    return tasks
      .filter((t) => t.status !== "done" && t.id !== activeTask?.id)
      .sort((a, b) => a.order - b.order)
  }, [tasks, activeTask?.id])

  const visibleTasks = pendingTasks.slice(0, MAX_VISIBLE)
  const remainingCount = Math.max(0, pendingTasks.length - MAX_VISIBLE)

  /* ── Drag & Drop ── */
  const handleDragEnd = React.useCallback(
    async (result: DropResult) => {
      const { source, destination } = result
      if (!destination) return
      if (source.index === destination.index) return

      const reordered = Array.from(pendingTasks)
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)

      await batchUpdateTasks(
        reordered.map((t, i) => ({ id: t.id, changes: { order: i } })),
      )
    },
    [pendingTasks, batchUpdateTasks],
  )

  /* ── Focus a task ── */
  const handleFocus = React.useCallback(
    async (taskId: string) => {
      await setTaskFocused(taskId)
    },
    [setTaskFocused],
  )

  /* ═══════════════════════════════ */
  /*  RENDER                         */
  /* ═══════════════════════════════ */

  if (pendingTasks.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[10px] text-zinc-600 uppercase tracking-[0.1em] font-semibold select-none">
          Sırada Bekleyenler
        </h3>
        <span className="text-[10px] text-zinc-700 font-medium tabular-nums">
          {pendingTasks.length} görev
        </span>
      </div>

      {/* ── DragDropContext wraps only this section ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="pendingTasks">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "space-y-1.5 transition-colors duration-200 rounded-xl",
                snapshot.isDraggingOver && "bg-zinc-800/10",
              )}
            >
              <AnimatePresence initial={false}>
                {visibleTasks.map((task, index) => (
                  <Draggable
                    key={task.id}
                    draggableId={task.id}
                    index={index}
                  >
                    {(dragProvided, dragSnapshot) => (
                      <motion.div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "group relative flex items-center gap-2",
                          "bg-zinc-900/50 border border-zinc-800/40",
                          "rounded-xl px-3 py-2.5 sm:px-4 sm:py-3",
                          "transition-all duration-150",
                          "hover:bg-zinc-800/40 hover:border-zinc-700/50",
                          // Dragging
                          dragSnapshot.isDragging &&
                            "!bg-zinc-800 !border-zinc-600 shadow-2xl shadow-black/50 scale-[1.02] rotate-[1deg] z-50",
                        )}
                      >
                        {/* Drag handle */}
                        <div
                          {...dragProvided.dragHandleProps}
                          className={cn(
                            "flex-shrink-0 cursor-grab active:cursor-grabbing",
                            "text-zinc-800 group-hover:text-zinc-600",
                            "transition-colors p-0.5 -ml-1",
                          )}
                        >
                        </div>

                        {/* Priority dot */}
                        <div
                          className={cn(
                            "w-[6px] h-[6px] rounded-full flex-shrink-0",
                            PRIORITY_DOT[task.priority] ?? "bg-zinc-600",
                          )}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] sm:text-sm text-zinc-300 truncate font-medium leading-tight">
                            {task.title}
                          </p>

                          {/* Meta info */}
                          {(task.dueDate || (task.tags && task.tags.length > 0)) && (
                            <div className="flex items-center gap-2 mt-0.5">
                              {task.dueDate && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600">
                                  <Calendar className="w-[10px] h-[10px]" />
                                  {format(task.dueDate, "d MMM", {
                                    locale: tr,
                                  })}
                                </span>
                              )}
                              {task.tags?.[0] && (
                                <span className="text-[10px] text-zinc-600">
                                  #{task.tags[0]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Focus button — visible on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFocus(task.id)
                          }}
                          title="Bu göreve odaklan"
                          className={cn(
                            "flex-shrink-0 p-1.5 rounded-lg",
                            "text-zinc-700 transition-all duration-150",
                            "opacity-0 group-hover:opacity-100",
                            "hover:text-blue-400 hover:bg-blue-500/10",
                            "active:scale-90",
                          )}
                        >
                          <Target className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* ── Remaining count ── */}
      <AnimatePresence>
        {remainingCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[11px] text-zinc-700 mt-2 select-none"
          >
            +{remainingCount} görev daha
          </motion.p>
        )}
      </AnimatePresence>
    </motion.section>
  )
}