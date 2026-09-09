"use client"

import * as React from "react"
import { UserSettings } from "@/types"
import { auth, db } from "@/firebase/config"
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore"

/* ═══════════════════════════════════════ */
/*  Types                                  */
/* ═══════════════════════════════════════ */

export type AppSettings = UserSettings & {
  aiApiKey: string
  closeAction: 'ask' | 'exit' | 'tray'
  keybinds: {
    newTask: string
    quickSearch: string
  }
  statusMilestonesEnabled: boolean
  statusMilestonesMinimized: boolean

  // App State persistence
  showCompleted: boolean
  sortBy: "order" | "priority" | "date" | "name"
  focusMode: "large" | "compact"
  pomodoroTimeLeft: number | null
  pomodoroEnabled: boolean
  pomodoroInterval: number // Mapping from pomodoroLongBreakInterval

  // Legacy / Notifications
  notificationsDesktop: boolean
  notificationsSound: boolean
}

const DEFAULTS: AppSettings = {
  theme: "dark",
  accentColor: "blue",
  pomodoroFocus: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroLongBreakInterval: 4,
  pomodoroInterval: 4, // Sync with above
  notificationsEnabled: true,
  soundEnabled: true,
  aiEnabled: true,
  aiApiKey: "",
  sidebarCollapsed: false,
  trashRetentionDays: 15,
  tabs: {
    focus: true,
    planner: true,
    tasks: true,
    analytics: true,
    trash: true,
    archive: true,
    community: true,
    projects: true,
    shop: true,
    profile: true,
  },
  features: {
    subtasks: true,
    priorities: true,
    categories: true,
    pomodoro: true,
    aiGeneration: true,
    notifications: true,
    milestones: true,
  },
  appearance: {
    compactMode: false,
    blurIntensity: "medium",
    showTaskMetadata: {
      createdAt: true,
      priorityBadge: true,
      categoryBadge: true,
      dueDate: true,
    }
  },
  audio: {
    taskComplete: true,
    timerEnd: true,
    clickSound: false,
  },

  // App specific
  showCompleted: false,
  sortBy: "order",
  focusMode: "large",
  pomodoroTimeLeft: null,
  pomodoroEnabled: true,
  notificationsDesktop: true,
  notificationsSound: true,
  closeAction: "ask",
  keybinds: {
    newTask: "Ctrl+n",
    quickSearch: "Ctrl+k",
  },
  statusMilestonesEnabled: true,
  statusMilestonesMinimized: false,
  earnedBadges: [],
  showcaseBadges: [null, null, null],
  lastActionDate: null,
  streakCount: 0,
  streakCelebratedDate: null,
  lastWarningDate: null,
  streakFreezes: 3, // 3 free gifts for every user
  lastFrozenDate: null,
  focusCoins: 100, // Starter coins
  equippedFrame: null,
  equippedTitle: null,
  equippedProfileEffect: null,
  inventory: [],
  friends: [],
  purchases: [],
}

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
}

const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined)

/* ═══════════════════════════════════════ */
/*  Hook                                   */
/* ═══════════════════════════════════════ */
export function useSettings(): SettingsContextType {
  const ctx = React.useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}

/* ═══════════════════════════════════════ */
/*  Provider                               */
/* ═══════════════════════════════════════ */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULTS)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ff_settings")
      if (raw) {
        const parsed = JSON.parse(raw)
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          tabs: { ...prev.tabs, ...(parsed.tabs || {}) },
          features: { ...prev.features, ...(parsed.features || {}) },
          appearance: {
            ...prev.appearance,
            ...(parsed.appearance || {}),
            showTaskMetadata: {
              ...prev.appearance.showTaskMetadata,
              ...((parsed.appearance?.showTaskMetadata) || {})
            }
          },
          audio: { ...prev.audio, ...(parsed.audio || {}) },
          keybinds: { ...DEFAULTS.keybinds, ...(parsed.keybinds || {}) }
        }))
      }
    } catch { }
    setHydrated(true)
  }, [])

  // Helper to safely parse coins value from Firestore (supports number, "50000", "50k", etc.)
  const parseCoinsValue = React.useCallback((val: any): number | null => {
    if (typeof val === "number" && !isNaN(val)) return Math.round(val)
    if (typeof val === "string") {
      const s = val.trim().toLowerCase()
      if (s.endsWith("k")) {
        const n = parseFloat(s.slice(0, -1))
        if (!isNaN(n)) return Math.round(n * 1000)
      }
      if (s.endsWith("m")) {
        const n = parseFloat(s.slice(0, -1))
        if (!isNaN(n)) return Math.round(n * 1000000)
      }
      const n = parseFloat(s)
      if (!isNaN(n)) return Math.round(n)
    }
    return null
  }, [])

  // Real-time bidirectional sync from Firestore on auth state change
  React.useEffect(() => {
    let unsubConfig: (() => void) | null = null
    let unsubUser: (() => void) | null = null
    let unsubPublic: (() => void) | null = null

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Clean up any existing document listeners
      if (unsubConfig) { unsubConfig(); unsubConfig = null }
      if (unsubUser) { unsubUser(); unsubUser = null }
      if (unsubPublic) { unsubPublic(); unsubPublic = null }

      if (user) {
        const applyFirestoreUpdates = (sourceData: any) => {
          if (!sourceData) return

          setSettings((prev) => {
            const updates: Partial<AppSettings> = {}

            // Coins parsing (handles manual Firestore inputs like 50000, "50000", "50k")
            if (sourceData.focusCoins !== undefined && sourceData.focusCoins !== null) {
              const parsed = parseCoinsValue(sourceData.focusCoins)
              if (parsed !== null && parsed !== prev.focusCoins) {
                updates.focusCoins = parsed
              }
            }

            // Streak Count
            if (sourceData.streakCount !== undefined && typeof sourceData.streakCount === "number") {
              if (sourceData.streakCount !== prev.streakCount) {
                updates.streakCount = sourceData.streakCount
              }
            }

            // Streak Freezes
            if (sourceData.streakFreezes !== undefined) {
              const parsed = parseCoinsValue(sourceData.streakFreezes)
              if (parsed !== null && parsed !== prev.streakFreezes) {
                updates.streakFreezes = parsed
              }
            }

            // Inventory
            if (sourceData.inventory !== undefined && Array.isArray(sourceData.inventory)) {
              updates.inventory = sourceData.inventory
            }

            // Equipped cosmetics
            if (sourceData.equippedFrame !== undefined) {
              updates.equippedFrame = sourceData.equippedFrame
            }
            if (sourceData.equippedTitle !== undefined) {
              updates.equippedTitle = sourceData.equippedTitle
            }
            if (sourceData.equippedProfileEffect !== undefined) {
              updates.equippedProfileEffect = sourceData.equippedProfileEffect
            }
            if (sourceData.showcaseBadges !== undefined && Array.isArray(sourceData.showcaseBadges)) {
              updates.showcaseBadges = sourceData.showcaseBadges
            }
            if (sourceData.bio !== undefined && typeof sourceData.bio === "string") {
              updates.bio = sourceData.bio
            }
            if (sourceData.friends !== undefined && Array.isArray(sourceData.friends)) {
              updates.friends = sourceData.friends
            }

            // Tabs, Features & Appearance (if from config doc)
            if (sourceData.tabs) updates.tabs = { ...prev.tabs, ...(sourceData.tabs || {}) }
            if (sourceData.features) updates.features = { ...prev.features, ...(sourceData.features || {}) }
            if (sourceData.appearance) updates.appearance = { ...prev.appearance, ...(sourceData.appearance || {}) }
            if (sourceData.audio) updates.audio = { ...prev.audio, ...(sourceData.audio || {}) }
            if (sourceData.theme) updates.theme = sourceData.theme
            if (sourceData.accentColor) updates.accentColor = sourceData.accentColor

            if (Object.keys(updates).length === 0) return prev

            const next = { ...prev, ...updates }
            localStorage.setItem("ff_settings", JSON.stringify(next))
            if (typeof window !== "undefined" && (window as any).electron) {
              ; (window as any).electron.ipcRenderer?.send("settings-updated", next)
            }
            return next
          })
        }

        // 1. Config Doc (users/{uid}/userSettings/config)
        const configRef = doc(db, "users", user.uid, "userSettings", "config")
        unsubConfig = onSnapshot(
          configRef,
          (snap) => {
            if (snap.exists()) {
              applyFirestoreUpdates(snap.data())
            }
          },
          (err) => console.warn("Config doc snapshot listener notice:", err)
        )

        // 2. User Doc (users/{uid} - where admins/users most commonly edit in Firebase Console)
        const userRef = doc(db, "users", user.uid)
        unsubUser = onSnapshot(
          userRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data()
              applyFirestoreUpdates(data)

              // If user edited focusCoins in users/{uid}, synchronize to config doc as well
              if (data.focusCoins !== undefined) {
                const parsedCoins = parseCoinsValue(data.focusCoins)
                if (parsedCoins !== null) {
                  setDoc(configRef, { focusCoins: parsedCoins }, { merge: true }).catch(() => { })
                }
              }
            }
          },
          (err) => console.warn("User doc snapshot listener notice:", err)
        )

        // 3. Public Profile Doc (publicProfiles/{uid})
        const publicRef = doc(db, "publicProfiles", user.uid)
        unsubPublic = onSnapshot(
          publicRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data()
              applyFirestoreUpdates(data)

              if (data.focusCoins !== undefined) {
                const parsedCoins = parseCoinsValue(data.focusCoins)
                if (parsedCoins !== null) {
                  setDoc(configRef, { focusCoins: parsedCoins }, { merge: true }).catch(() => { })
                }
              }
            }
          },
          (err) => console.warn("Public profile snapshot listener notice:", err)
        )
      }
    })

    return () => {
      unsubAuth()
      if (unsubConfig) unsubConfig()
      if (unsubUser) unsubUser()
      if (unsubPublic) unsubPublic()
    }
  }, [parseCoinsValue])

  const updateSettings = React.useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      // Map pomodoroInterval back to UserSettings field if updated
      const next = { ...prev, ...updates }
      if (updates.pomodoroInterval !== undefined) {
        next.pomodoroLongBreakInterval = updates.pomodoroInterval
      }

      localStorage.setItem("ff_settings", JSON.stringify(next))
      if (typeof window !== "undefined" && (window as any).electron) {
        ; (window as any).electron.ipcRenderer.send("settings-updated", next)
      }

      const currentUser = auth.currentUser
      if (currentUser) {
        const ref = doc(db, "users", currentUser.uid, "userSettings", "config")
        setDoc(ref, next, { merge: true }).catch(err => console.error("Firebase settings sync failed:", err))

        // Sync equipped cosmetics and badges to publicProfiles & users immediately
        if (
          updates.equippedFrame !== undefined ||
          updates.equippedTitle !== undefined ||
          updates.equippedProfileEffect !== undefined ||
          updates.showcaseBadges !== undefined ||
          updates.focusCoins !== undefined
        ) {
          const publicPayload: any = {}
          if (updates.equippedFrame !== undefined) publicPayload.equippedFrame = next.equippedFrame ?? null
          if (updates.equippedTitle !== undefined) publicPayload.equippedTitle = next.equippedTitle ?? null
          if (updates.equippedProfileEffect !== undefined) publicPayload.equippedProfileEffect = next.equippedProfileEffect ?? null
          if (updates.showcaseBadges !== undefined) publicPayload.showcaseBadges = next.showcaseBadges
          if (updates.focusCoins !== undefined) publicPayload.focusCoins = next.focusCoins

          const pubRef = doc(db, "publicProfiles", currentUser.uid)
          setDoc(pubRef, publicPayload, { merge: true }).catch(err => console.error("Public profile sync failed:", err))

          const userDocRef = doc(db, "users", currentUser.uid)
          setDoc(userDocRef, publicPayload, { merge: true }).catch(err => console.error("User doc sync failed:", err))
        }
      }
      return next
    })
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    const html = document.documentElement
    const apply = (dark: boolean) => {
      html.classList.toggle("dark", dark)
      html.classList.toggle("light", !dark)
    }
    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      apply(mq.matches)
      const handler = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
    apply(settings.theme === "dark")
  }, [settings.theme, hydrated])

  React.useEffect(() => {
    if (!hydrated) return
    document.documentElement.setAttribute("data-accent", settings.accentColor)
    document.documentElement.setAttribute("data-blur", settings.appearance.blurIntensity)
    document.documentElement.classList.toggle("compact-mode", settings.appearance.compactMode)
  }, [settings.accentColor, settings.appearance.blurIntensity, settings.appearance.compactMode, hydrated])

  const value = React.useMemo(() => ({ settings, updateSettings }), [settings, updateSettings])

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}