"use client"

import * as React from "react"
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy
} from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "./useAuth"
import type { TaskGroup } from "@/types"

interface TaskGroupsContextType {
  groups: TaskGroup[]
  loading: boolean
  addGroup: (data: { name: string; color: string; icon?: string }) => Promise<TaskGroup | undefined>
  updateGroup: (id: string, updates: Partial<TaskGroup>) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
}

const TaskGroupsContext = React.createContext<TaskGroupsContextType | undefined>(undefined)

export function useTaskGroups(): TaskGroupsContextType {
  const ctx = React.useContext(TaskGroupsContext)
  if (!ctx) throw new Error("useTaskGroups must be used within TaskGroupsProvider")
  return ctx
}

export function TaskGroupsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [groups, setGroups] = React.useState<TaskGroup[]>([])
  const [loading, setLoading] = React.useState(true)

  const collectionPath = user ? `users/${user.uid}/taskGroups` : null

  React.useEffect(() => {
    if (!user || !collectionPath) {
      const cacheKey = "ff_groups_guest"
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) setGroups(JSON.parse(cached))
      } catch {}
      setLoading(false)
      return
    }

    // Load from local storage cache
    const cacheKey = `ff_groups_${user.uid}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) setGroups(JSON.parse(cached))
    } catch {}

    const q = query(collection(db, collectionPath))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TaskGroup))
        setGroups(items)
        try {
          localStorage.setItem(cacheKey, JSON.stringify(items))
        } catch {}
        setLoading(false)
      },
      (error) => {
        console.error("TaskGroups listener error:", error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, collectionPath])

  const addGroup = React.useCallback(
    async (data: { name: string; color: string; icon?: string }): Promise<TaskGroup | undefined> => {
      const id = `grp_${Date.now()}`
      const newGroup: TaskGroup = {
        id,
        name: data.name,
        color: data.color,
        icon: data.icon || "📁",
        userId: user ? user.uid : "guest",
        createdAt: new Date()
      }
      setGroups((prev) => [...prev, newGroup])
      const cacheKey = user ? `ff_groups_${user.uid}` : "ff_groups_guest"
      try {
        const cached = localStorage.getItem(cacheKey)
        const current: TaskGroup[] = cached ? JSON.parse(cached) : []
        localStorage.setItem(cacheKey, JSON.stringify([...current, newGroup]))
      } catch {}

      if (collectionPath && user) {
        try {
          const ref = doc(db, collectionPath, id)
          await setDoc(ref, newGroup)
        } catch (err) {
          console.error("Error adding task group to firestore:", err)
        }
      }
      return newGroup
    },
    [collectionPath, user]
  )

  const updateGroup = React.useCallback(
    async (id: string, updates: Partial<TaskGroup>) => {
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)))
      const cacheKey = user ? `ff_groups_${user.uid}` : "ff_groups_guest"
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const current: TaskGroup[] = JSON.parse(cached)
          localStorage.setItem(cacheKey, JSON.stringify(current.map((g) => (g.id === id ? { ...g, ...updates } : g))))
        }
      } catch {}

      if (collectionPath) {
        try {
          const ref = doc(db, collectionPath, id)
          await updateDoc(ref, updates)
        } catch (err) {
          console.error("Error updating task group in firestore:", err)
        }
      }
    },
    [collectionPath, user]
  )

  const deleteGroup = React.useCallback(
    async (id: string) => {
      setGroups((prev) => prev.filter((g) => g.id !== id))
      const cacheKey = user ? `ff_groups_${user.uid}` : "ff_groups_guest"
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const current: TaskGroup[] = JSON.parse(cached)
          localStorage.setItem(cacheKey, JSON.stringify(current.filter((g) => g.id !== id)))
        }
      } catch {}

      if (collectionPath) {
        try {
          const ref = doc(db, collectionPath, id)
          await deleteDoc(ref)
        } catch (err) {
          console.error("Error deleting task group from firestore:", err)
        }
      }
    },
    [collectionPath, user]
  )

  return (
    <TaskGroupsContext.Provider value={{ groups, loading, addGroup, updateGroup, deleteGroup }}>
      {children}
    </TaskGroupsContext.Provider>
  )
}
