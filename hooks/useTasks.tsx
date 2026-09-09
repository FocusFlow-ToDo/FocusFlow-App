"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  Timestamp,
  setDoc,
} from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "./useAuth"
import { useSettings } from "./useSettings"
import type { Task, Subtask, Priority, TaskStatus } from "@/types"
import { addDays, addWeeks, addMonths, isWeekend, startOfDay, isBefore, differenceInCalendarDays } from "date-fns"
import { calculateUserStats } from "@/lib/stats"

/* ═══════════════════════════════════════ */
/*  Types                                  */
/* ═══════════════════════════════════════ */
interface BatchUpdate {
  id: string
  changes: Partial<Task> & Record<string, any>
}

interface TaskContextType {
  tasks: Task[]
  rawTasks: Task[]
  activeTask: Task | null
  loading: boolean
  addTask: (data: Partial<Task>) => Promise<string | undefined>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<void>
  uncompleteTask: (id: string) => Promise<void>
  setTaskFocused: (id: string) => Promise<void>
  batchUpdateTasks: (updates: BatchUpdate[]) => Promise<void>
  restoreTask: (id: string) => Promise<void>
  hardDeleteTask: (id: string) => Promise<void>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

/* ═══════════════════════════════════════ */
/*  Hook                                   */
/* ═══════════════════════════════════════ */
export function useTasks(): TaskContextType {
  const context = useContext(TaskContext)
  if (!context) throw new Error("useTasks must be used within TaskProvider")
  return context
}

/* ═══════════════════════════════════════ */
/*  Helpers                                */
/* ═══════════════════════════════════════ */

/** Convert Firestore Timestamp or any date-like value to JS Date */
function toDate(val: any): Date {
  if (!val) return new Date()
  if (val instanceof Date) return val
  if (val?.toDate) return val.toDate() // Firestore Timestamp
  if (typeof val === "string" || typeof val === "number") return new Date(val)
  return new Date()
}

/** Convert nullable date-like to Date | null */
function toDateOrNull(val: any): Date | null {
  if (!val) return null
  return toDate(val)
}

/** Normalize a Firestore document into our Task type */
function normalizeTask(id: string, data: any): Task {
  return {
    id,
    title: data.title || "",
    description: data.description || "",
    priority: data.priority || "medium",
    status: normalizeStatus(data.status),
    categoryId: data.categoryId || null,
    groupId: data.groupId || null,
    groupName: data.groupName || null,
    groupColor: data.groupColor || null,
    groupIcon: data.groupIcon || null,
    dueDate: toDateOrNull(data.dueDate || data.plannedDate),
    dueTime: data.dueTime || null,
    recurrence: data.recurrence || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
    isFocused: Boolean(data.isFocused || data.isActive),
    focusTime: typeof data.focusTime === "number" ? data.focusTime : 0,
    order: typeof data.order === "number" ? data.order : 0,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    completedAt: toDateOrNull(data.completedAt),
    deletedAt: toDateOrNull(data.deletedAt),
    userId: data.userId || "",
  }
}

/** Map old status values to new ones */
function normalizeStatus(status: string): TaskStatus {
  switch (status) {
    case "completed":
    case "done":
      return "done"
    case "active":
    case "in_progress":
      return "in_progress"
    case "trash":
      return "trash"
    case "backlog":
    case "todo":
    default:
      return "todo"
  }
}

/** Convert Date to Firestore-safe value */
function dateToFirestore(val: Date | null | undefined): Timestamp | null {
  if (!val) return null
  return Timestamp.fromDate(val instanceof Date ? val : new Date(val))
}

/* ═══════════════════════════════════════ */
/*  Provider                               */
/* ═══════════════════════════════════════ */
export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { settings, updateSettings } = useSettings()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const collectionPath = user ? `users/${user.uid}/tasks` : null

  // Gamification: Streak logic with Streak Freeze protection
  const handleActionForStreak = useCallback(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const { lastActionDate, streakCount, streakFreezes = 3 } = settings;

    if (lastActionDate !== today) {
      let newStreak = streakCount || 0;
      let remainingFreezes = typeof streakFreezes === "number" ? streakFreezes : 3;
      let usedFreeze = false;

      if (lastActionDate) {
        const last = new Date(lastActionDate);
        const curr = new Date(today);
        const diffDays = differenceInCalendarDays(curr, last);

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays === 2) {
          // Missed exactly 1 day
          if (remainingFreezes > 0) {
            remainingFreezes -= 1;
            newStreak += 1; // Freeze saved the streak!
            usedFreeze = true;
          } else {
            newStreak = 1; // No freeze left
          }
        } else if (diffDays > 2) {
          const neededFreezes = diffDays - 1;
          if (remainingFreezes >= neededFreezes) {
            remainingFreezes -= neededFreezes;
            newStreak += 1;
            usedFreeze = true;
          } else {
            newStreak = 1;
          }
        }
      } else {
        newStreak = 1;
      }

      updateSettings({
        lastActionDate: today,
        streakCount: newStreak,
        streakFreezes: remainingFreezes,
        streakCelebratedDate: null,
      });
    }
  }, [settings, updateSettings]);

  // ── Real-time listener ──
  useEffect(() => {
    if (!user || !collectionPath) {
      setTasks([])
      setLoading(false)
      return
    }

    // Try loading from localStorage cache for instant render
    const cacheKey = `ff_tasks_${user.uid}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached) as Task[]
        setTasks(
          parsed.map((t) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
          })),
        )
        setLoading(false)
      }
    } catch {}

    const q = query(collection(db, collectionPath), orderBy("order", "asc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const normalized = snapshot.docs.map((d) =>
          normalizeTask(d.id, d.data()),
        ).sort((a, b) => (typeof a.order === "number" ? a.order : 0) - (typeof b.order === "number" ? b.order : 0))
        setTasks(normalized)

        // Update cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify(normalized))
        } catch {}

        // --- Auto Clean & Archive (Runs once per session) ---
        if (!(window as any)._ff_cleaned && normalized.length > 0) {
          (window as any)._ff_cleaned = true
          setTimeout(async () => {
            try {
              const now = new Date()
              const trashLimit = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) // 15 days
              const toDelete = normalized.filter(t => t.status === "trash" && t.deletedAt && new Date(t.deletedAt) < trashLimit)
              
              // === 1. SYNC PUBLIC PROFILE ON BOOT ===
              if (user && !(window as any)._ff_profile_synced) {
                (window as any)._ff_profile_synced = true;
                const stats = calculateUserStats(normalized);
                
                const profilePayload = {
                  displayName: user.displayName || "FocusFlow Kullanıcısı",
                  photoURL: user.photoURL || null,
                  level: stats.level,
                  rankName: stats.rankName,
                  totalXP: stats.totalXP,
                  completedTotal: stats.completedTotal,
                  focusMinsTotal: stats.focusMinsTotal,
                  currentStreak: settings.streakCount || stats.currentStreak, 
                  showcaseBadges: settings.showcaseBadges || [null, null, null],
                  focusCoins: settings.focusCoins || 100,
                  equippedFrame: settings.equippedFrame || null,
                  equippedTitle: settings.equippedTitle || null,
                  friendsCount: (settings.friends || []).length,
                  updatedAt: serverTimestamp()
                };

                setDoc(doc(db, "publicProfiles", user.uid), profilePayload, { merge: true })
                  .catch(e => console.error("Could not sync public profile:", e));
              }

              if (toDelete.length === 0) return

              // Erase only expired trash items from Firestore
              const batch = writeBatch(db)
              let count = 0
              for (const t of toDelete) {
                batch.delete(doc(db, collectionPath, t.id))
                count++
                if (count >= 400) break // Safe batch limit
              }
              if (count > 0) await batch.commit()
              console.log(`[FocusFlow] Cleaned ${toDelete.length} expired trash tasks. Completed tasks preserved.`);
            } catch (err) {
              console.error("Auto-cleanup failed:", err)
            }
          }, 4000) // Delay to save startup performance
        }

        setLoading(false)
      },
      (error) => {
        console.error("Tasks listener error:", error)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user, collectionPath])

  const filteredTasks = useMemo(
    () => tasks.filter(t => t.status !== "trash").sort((a, b) => (typeof a.order === "number" ? a.order : 0) - (typeof b.order === "number" ? b.order : 0)),
    [tasks]
  )

  // ── Active (focused) task ──
  const activeTask = useMemo(
    () => filteredTasks.find((t) => t.isFocused && t.status !== "done") || null,
    [filteredTasks],
  )

  const displayTask = useMemo(() => {
    if (activeTask) return activeTask;
    
    // Find today's first task or next available task
    const pending = filteredTasks.filter(t => t.status !== "done");
    if (pending.length === 0) return null;

    const todayTime = startOfDay(new Date()).getTime();
    
    // 1. Check for tasks due today or previously
    const todayTasks = pending.filter(t => t.dueDate && startOfDay(new Date(t.dueDate)).getTime() <= todayTime);
    if (todayTasks.length > 0) {
      return todayTasks.sort((a, b) => a.order - b.order)[0];
    }
    
    // 2. Fallback to any available task
    return pending.sort((a, b) => a.order - b.order)[0];
  }, [activeTask, filteredTasks]);

  // ── Electron Tray Sync ──
  // (Moved to the bottom of provider to avoid declaration order issues)

  // ═══════════════════════════════════
  //  CRUD Operations
  // ═══════════════════════════════════

  const addTask = useCallback(
    async (data: Partial<Task>): Promise<string | undefined> => {
      if (!user || !collectionPath) return

      const newDoc = {
        title: data.title || "Yeni Görev",
        description: data.description || "",
        priority: data.priority || "medium",
        status: data.status || "todo",
        categoryId: data.categoryId || null,
        groupId: data.groupId || null,
        groupName: data.groupName || null,
        groupColor: data.groupColor || null,
        groupIcon: data.groupIcon || null,
        dueDate: dateToFirestore(data.dueDate as any),
        dueTime: data.dueTime || null,
        recurrence: data.recurrence || null,
        tags: data.tags || [],
        subtasks: data.subtasks || [],
        isFocused: data.isFocused || false,
        order: typeof data.order === "number" ? data.order : tasks.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null,
        userId: user.uid,
      }

      const ref = await addDoc(collection(db, collectionPath), newDoc)
      return ref.id
    },
    [user, collectionPath, tasks.length],
  )

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (!user || !collectionPath) return

      // Optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t))

      const current = tasks.find((t) => t.id === id)
      if (!current) return

      // Clean updates and filter out unchanged values
      const cleanUpdates: Record<string, any> = {}
      let hasChanges = false

      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined) return
        
        // Deep check for identity to avoid redundant writes
        const currentVal = (current as any)[key]
        
        // Handling dates specially as they might be JS Date vs Firestore Timestamp
        if (val instanceof Date || currentVal instanceof Date) {
          const t1 = val instanceof Date ? val.getTime() : new Date(val as any).getTime()
          const t2 = currentVal instanceof Date ? currentVal.getTime() : new Date(currentVal as any).getTime()
          if (t1 === t2) return
        } else if (JSON.stringify(val) === JSON.stringify(currentVal)) {
          return
        }

        cleanUpdates[key] = val
        hasChanges = true
      })

      // Logic: If status becomes "done", complete all subtasks
      if (cleanUpdates.status === "done" && current.subtasks && current.subtasks.length > 0) {
        cleanUpdates.subtasks = current.subtasks.map(s => ({
          ...s,
          completed: true,
          completedAt: s.completedAt || new Date().toISOString()
        }))
        hasChanges = true
      }

      if (!hasChanges) return

      const firestoreUpdates: Record<string, any> = {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
      }

      // Convert Date fields to Firestore Timestamps
      if ("dueDate" in cleanUpdates) {
        firestoreUpdates.dueDate = dateToFirestore(cleanUpdates.dueDate as any)
      }
      if ("completedAt" in cleanUpdates) {
        firestoreUpdates.completedAt = cleanUpdates.completedAt
          ? dateToFirestore(cleanUpdates.completedAt as any)
          : null
      }

      await updateDoc(doc(db, collectionPath, id), firestoreUpdates)
    },
    [user, collectionPath, tasks, handleActionForStreak],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      if (!user || !collectionPath) return
      const current = tasks.find((t) => t.id === id)
      if (!current) return

      if (current.status === "trash") {
        await deleteDoc(doc(db, collectionPath, id))
      } else {
        await updateDoc(doc(db, collectionPath, id), {
          status: "trash",
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isFocused: false,
        })
      }
    },
    [user, collectionPath, tasks],
  )

  const restoreTask = useCallback(
    async (id: string) => {
      if (!user || !collectionPath) return
      await updateDoc(doc(db, collectionPath, id), {
        status: "todo",
        deletedAt: null,
        updatedAt: serverTimestamp(),
      })
    },
    [user, collectionPath],
  )

  const hardDeleteTask = useCallback(
    async (id: string) => {
      if (!user || !collectionPath) return
      await deleteDoc(doc(db, collectionPath, id))
    },
    [user, collectionPath],
  )

  const completeTask = useCallback(
    async (id: string) => {
      if (!collectionPath) return
      const current = tasks.find(t => t.id === id)
      if (!current) return
      
      const now = new Date()
      
      // Auto-clone recurring tasks to the next valid date
      if (current.recurrence && current.dueDate) {
         try {
           let nextDate = new Date(current.dueDate)
           const todayStart = startOfDay(now)
           
           do {
             if (current.recurrence === "daily") {
               nextDate = addDays(nextDate, 1)
             } else if (current.recurrence === "weekdays") {
               do { nextDate = addDays(nextDate, 1) } while (isWeekend(nextDate))
             } else if (current.recurrence === "weekly") {
               nextDate = addWeeks(nextDate, 1)
             } else if (current.recurrence === "monthly") {
               nextDate = addMonths(nextDate, 1)
             }
           } while (isBefore(nextDate, todayStart)) // Prevent spawning a backlog of past recurrences
           
           const newDoc = {
             title: current.title,
             description: current.description,
             priority: current.priority,
             status: "todo",
             categoryId: current.categoryId,
             groupId: current.groupId || null,
             groupName: current.groupName || null,
             groupColor: current.groupColor || null,
             groupIcon: current.groupIcon || null,
             dueDate: dateToFirestore(nextDate),
             dueTime: current.dueTime,
             recurrence: current.recurrence,
             tags: [...current.tags],
             subtasks: (current.subtasks || []).map(s => ({ ...s, completed: false, completedAt: null, id: crypto.randomUUID() })),
             isFocused: false,
             order: current.order,
             createdAt: serverTimestamp(),
             updatedAt: serverTimestamp(),
             completedAt: null,
             userId: current.userId,
           }
           await addDoc(collection(db, collectionPath), newDoc)
         } catch (err) {
           console.error("Failed to clone recurring task", err)
         }
      }

      const updates: Record<string, any> = {
        status: "done",
        isFocused: false,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        recurrence: null // Strip recurrence off the finished log to prevent re-cloning upon un-complete toggles
      }

      // If task has subtasks, set them all to completed with current date
      if (current?.subtasks && current.subtasks.length > 0) {
        updates.subtasks = current.subtasks.map(s => ({ 
          ...s, 
          completed: true, 
          completedAt: s.completedAt || now.toISOString() 
        }))
      }

      await updateDoc(doc(db, collectionPath, id), updates)
      handleActionForStreak()
    },
    [collectionPath, tasks, handleActionForStreak],
  )

  const uncompleteTask = useCallback(
    async (id: string) => {
      if (!collectionPath) return
      
      const current = tasks.find(t => t.id === id)
      const updates: Record<string, any> = {
        status: "todo",
        completedAt: null,
        updatedAt: serverTimestamp(),
      }

      // If task has subtasks, reset them all to uncompleted AND wipe their completedAt
      if (current?.subtasks && current.subtasks.length > 0) {
        updates.subtasks = current.subtasks.map(s => ({ ...s, completed: false, completedAt: null }))
      }

      await updateDoc(doc(db, collectionPath, id), updates)

      // Streak revert: If this was the only "done" task completed today,
      // revert the streak so it's back in danger
      const today = new Date().toISOString().split("T")[0]
      if (settings.lastActionDate === today) {
        const otherDoneToday = tasks.filter(t => 
          t.id !== id && 
          t.status === "done" && 
          t.completedAt && 
          new Date(t.completedAt).toISOString().split("T")[0] === today
        )
        const addedToday = tasks.filter(t =>
          t.id !== id &&
          t.createdAt &&
          new Date(t.createdAt).toISOString().split("T")[0] === today
        )
        
        // If no other tasks were completed or added today, revert streak
        if (otherDoneToday.length === 0 && addedToday.length <= 0) {
          // Find what the previous lastActionDate should be
          const allDates = tasks
            .filter(t => t.id !== id && t.completedAt)
            .map(t => new Date(t.completedAt!).toISOString().split("T")[0])
            .filter(d => d !== today)
            .sort()
            .reverse()
          
          const previousDate = allDates[0] || null
          const prevDateObj = previousDate ? new Date(previousDate) : null
          const todayObj = new Date(today)
          
          let newStreak = settings.streakCount
          if (prevDateObj) {
            const diffDays = differenceInCalendarDays(todayObj, prevDateObj)
            if (diffDays > 1) {
              newStreak = 0 // gap too big, streak would have been broken
            } else {
              newStreak = Math.max(0, newStreak - 1)
            }
          } else {
            newStreak = 0
          }

          updateSettings({
            lastActionDate: previousDate,
            streakCount: newStreak,
            streakCelebratedDate: null, // Reset so warning shows
          })
        }
      }
    },
    [collectionPath, tasks, settings, updateSettings],
  )

  const setTaskFocused = useCallback(
    async (id: string) => {
      if (!user || !collectionPath) return

      const batch = writeBatch(db)

      // Unfocus all currently focused tasks
      tasks
        .filter((t) => t.isFocused && t.id !== id)
        .forEach((t) => {
          batch.update(doc(db, collectionPath, t.id), {
            isFocused: false,
            updatedAt: serverTimestamp(),
          })
        })

      // Focus the target task
      batch.update(doc(db, collectionPath, id), {
        isFocused: true,
        updatedAt: serverTimestamp(),
      })

      await batch.commit()
    },
    [user, collectionPath, tasks],
  )

  const batchUpdateTasks = useCallback(
    async (updates: BatchUpdate[]) => {
      if (!user || !collectionPath || updates.length === 0) return

      // Optimistic update for immediate visual feedback
      setTasks(prev => {
        const next = [...prev]
        updates.forEach(({ id, changes }) => {
          const idx = next.findIndex(t => t.id === id)
          if (idx !== -1) {
            next[idx] = { ...next[idx], ...changes, updatedAt: new Date() }
          }
        })
        return next.sort((a, b) => (typeof a.order === "number" ? a.order : 0) - (typeof b.order === "number" ? b.order : 0))
      })

      const batch = writeBatch(db)
      let count = 0

      updates.forEach(({ id, changes }) => {
        const current = tasks.find((t) => t.id === id)
        if (!current) return

        let dirty = false
        const clean: Record<string, any> = {}

        Object.entries(changes).forEach(([key, val]) => {
          if (val === undefined) return
          const cur = (current as any)[key]
          // Simple identity check for reordering efficiency
          if (val instanceof Date || cur instanceof Date) {
             const t1 = val instanceof Date ? val.getTime() : new Date(val as any).getTime()
             const t2 = cur instanceof Date ? cur.getTime() : new Date(cur as any).getTime()
             if (t1 !== t2) { clean[key] = val; dirty = true }
          } else if (JSON.stringify(val) !== JSON.stringify(cur)) {
            clean[key] = val; dirty = true
          }
        })

        if (dirty) {
          const ref = doc(db, collectionPath, id)
          const firestoreChanges: Record<string, any> = { ...clean, updatedAt: serverTimestamp() }

          if ("dueDate" in clean) firestoreChanges.dueDate = dateToFirestore(clean.dueDate as any)
          if ("completedAt" in clean) firestoreChanges.completedAt = clean.completedAt ? dateToFirestore(clean.completedAt as any) : null

          batch.update(ref, firestoreChanges)
          count++
        }
      })

      if (count > 0) await batch.commit()
    },
    [user, collectionPath, tasks],
  )

  // ═══════════════════════════════════

  const value: TaskContextType = {
    tasks: filteredTasks,
    rawTasks: tasks,
    activeTask,
    loading,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    setTaskFocused,
    batchUpdateTasks,
    restoreTask,
    hardDeleteTask,
  }

  // ── Electron Tray Sync ──
  const trayCallbackRef = useRef<() => void>(undefined)

  useEffect(() => {
    trayCallbackRef.current = () => {
      if (displayTask) completeTask(displayTask.id)
    }
  }, [displayTask, completeTask])

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electron) {
      const handleGlobalTray = () => {
        if (trayCallbackRef.current) trayCallbackRef.current()
      }
      ;(window as any).electron.ipcRenderer.on("tray-complete-task", handleGlobalTray)
      return () => {
        ;(window as any).electron.ipcRenderer.removeListener("tray-complete-task", handleGlobalTray)
      }
    }
  }, []) // Bind only once to prevent memory leak

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electron) {
      ;(window as any).electron.ipcRenderer.send("update-tray", {
        title: displayTask?.title || null,
      })
    }
  }, [displayTask])

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}