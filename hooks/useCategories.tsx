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
  orderBy,
  writeBatch,
  getDocs,
} from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "./useAuth"

export interface CategoryItem {
  id: string
  name: string
  color: string // Can be a preset name or a hex code
  emoji: string
  order: number
}

const DEFAULT_CATEGORIES: Omit<CategoryItem, "order">[] = [
  { id: "work",      name: "İş",        color: "#3B82F6",    emoji: "💼" },
  { id: "personal",  name: "Kişisel",   color: "#8B5CF6",    emoji: "👤" },
  { id: "health",    name: "Sağlık",    color: "#EF4444",    emoji: "❤️" },
]

interface CategoriesContextType {
  categories: CategoryItem[]
  loading: boolean
  addCategory: (cat: Omit<CategoryItem, "id" | "order">) => Promise<void>
  updateCategory: (id: string, updates: Partial<CategoryItem>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  reorderCategories: (cats: CategoryItem[]) => Promise<void>
}

const CategoriesContext = React.createContext<CategoriesContextType | undefined>(undefined)

export function useCategories(): CategoriesContextType {
  const ctx = React.useContext(CategoriesContext)
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider")
  return ctx
}

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [categories, setCategories] = React.useState<CategoryItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const collectionPath = user ? `users/${user.uid}/categories` : null

  // ── Sync with Firebase ──
  React.useEffect(() => {
    if (!user || !collectionPath) {
      setCategories([])
      setLoading(false)
      return
    }

    const q = query(collection(db, collectionPath), orderBy("order", "asc"))
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Check if we have already initialized for this user
        const initKey = `ff_cats_init_${user.uid}`
        const hasBeenInitialized = localStorage.getItem(initKey)
        
        if (!hasBeenInitialized) {
          // Initialize defaults for new users
          const batch = writeBatch(db)
          DEFAULT_CATEGORIES.forEach((cat, index) => {
            const ref = doc(db, collectionPath, cat.id)
            batch.set(ref, { ...cat, order: index })
          })
          await batch.commit()
          localStorage.setItem(initKey, "true")
        } else {
          // If we have already initialized, empty means the user explicitly deleted them
          setCategories([])
        }
      } else {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CategoryItem))
        setCategories(items)
        // Also ensure init key is set if they have items
        localStorage.setItem(`ff_cats_init_${user.uid}`, "true")
      }
      setLoading(false)
    }, (error) => {
      console.error("Categories listener error:", error)
      setLoading(false)
    })

    return unsubscribe
  }, [user, collectionPath])

  const addCategory = React.useCallback(async (data: Omit<CategoryItem, "id" | "order">) => {
    if (!collectionPath) return
    const id = `cat_${Date.now()}`
    const ref = doc(db, collectionPath, id)
    await setDoc(ref, {
      ...data,
      order: categories.length,
    })
  }, [collectionPath, categories.length])

  const updateCategory = React.useCallback(async (id: string, updates: Partial<CategoryItem>) => {
    if (!collectionPath) return
    const ref = doc(db, collectionPath, id)
    await updateDoc(ref, updates)
  }, [collectionPath])

  const deleteCategory = React.useCallback(async (id: string) => {
    if (!collectionPath) return
    const ref = doc(db, collectionPath, id)
    await deleteDoc(ref)
  }, [collectionPath])

  const reorderCategories = React.useCallback(async (newOrder: CategoryItem[]) => {
    if (!collectionPath) return
    setCategories(newOrder) // Optimistic update
    const batch = writeBatch(db)
    let dirtyCount = 0
    newOrder.forEach((cat, index) => {
      const current = categories.find(c => c.id === cat.id)
      if (!current || current.order !== index) {
        const ref = doc(db, collectionPath, cat.id)
        batch.update(ref, { order: index })
        dirtyCount++
      }
    })
    if (dirtyCount > 0) await batch.commit()
  }, [collectionPath, categories])

  return (
    <CategoriesContext.Provider value={{ categories, loading, addCategory, updateCategory, deleteCategory, reorderCategories }}>
      {children}
    </CategoriesContext.Provider>
  )
}