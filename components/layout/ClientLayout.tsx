"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { CommandPalette } from "@/components/layout/CommandPalette"
import { QuickTaskModal } from "@/components/focus/QuickTaskModal"
import { TaskInput } from "@/components/focus/TaskInput"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"
import { motion } from "motion/react"
import { LoadingScreen } from "@/components/ui/LoadingScreen"
import { CloseVerification } from "@/components/layout/CloseVerification"
import { StreakCelebrationModal } from "@/components/layout/StreakCelebrationModal"
import { UpdateNotification } from "@/components/updater/UpdateNotification"
import { matchShortcut } from "@/lib/shortcut"

const AUTH_PAGES = ["/login/", "/signup/", "/login", "/signup"]

const logActivity = (seconds: number) => {
  try {
    const now = new Date()
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}`
    const stored = localStorage.getItem("FF_ACTIVITY_LOG")
    const log = stored ? JSON.parse(stored) : {}
    log[key] = (log[key] || 0) + seconds
    
    // Keep only last 30 days to avoid storage bloat
    const keys = Object.keys(log).sort()
    if (keys.length > 30 * 24) {
      const toDelete = keys.slice(0, keys.length - 30 * 24)
      toDelete.forEach(k => delete log[k])
    }

    localStorage.setItem("FF_ACTIVITY_LOG", JSON.stringify(log))
  } catch (e) {
    console.warn("Activity log error:", e)
  }
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const { settings, updateSettings } = useSettings()
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [quickTaskOpen, setQuickTaskOpen] = React.useState(false)
  const [streakModalOpen, setStreakModalOpen] = React.useState(false)
  const [streakModalMode, setStreakModalMode] = React.useState<"celebration" | "warning">("celebration")

  // Minimum 2.5s loading screen so the animation is actually visible
  const MIN_LOADING_MS = 2500
  const [showLoader, setShowLoader] = React.useState(true)
  React.useEffect(() => {
    if (loading) return // still loading — keep showing
    const timer = setTimeout(() => setShowLoader(false), MIN_LOADING_MS)
    return () => clearTimeout(timer)
  }, [loading])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      
      // Allow modifier-based shortcuts (like Ctrl+K or Ctrl+N) even when an input is focused.
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        if (!e.ctrlKey && !e.metaKey) return
      }

      if (e.repeat) return


      const key = e.key.toLowerCase()
      
      // Dynamic keybinds from settings using our matching utility
      if (matchShortcut(e, settings.keybinds.quickSearch)) {
        e.preventDefault()
        setCommandOpen((o) => !o)
      }
      if (matchShortcut(e, settings.keybinds.newTask)) {
        e.preventDefault()
        setQuickTaskOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [settings.keybinds])

  React.useEffect(() => {
    if (!user || AUTH_PAGES.includes(pathname)) return
    
    let lastTick = Date.now()
    let lastSave = lastTick
    let accMs = 0

    const timer = setInterval(() => {
      const now = Date.now()
      const deltaMs = now - lastTick
      lastTick = now
      
      // If delta is huge (e.g. computer slept), don't count it. Max 5 mins gap allowed.
      if (deltaMs < 5 * 60 * 1000) {
        accMs += deltaMs
      }
      
      if (now - lastSave >= 5000) {
        if (accMs >= 1000) {
          const secs = Math.floor(accMs / 1000)
          logActivity(secs)
          accMs -= secs * 1000
        }
        lastSave = now
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [user, pathname])

  React.useEffect(() => {
    if (!loading && !user && !AUTH_PAGES.includes(pathname)) {
      router.push("/login")
    }
  }, [loading, user, pathname, router])

  // Save last visited tab
  React.useEffect(() => {
    if (user && !AUTH_PAGES.includes(pathname)) {
      try {
        localStorage.setItem("FF_LAST_ACTIVE_TAB", pathname)
      } catch {}
    }
  }, [user, pathname])

  // Restore last active tab on app launch
  const tabRestoredRef = React.useRef(false)
  React.useEffect(() => {
    if (!loading && user && !tabRestoredRef.current) {
      tabRestoredRef.current = true
      try {
        const lastTab = localStorage.getItem("FF_LAST_ACTIVE_TAB")
        if (lastTab && lastTab !== "/" && !AUTH_PAGES.includes(lastTab)) {
          if (pathname === "/") {
            router.replace(lastTab)
          }
        }
      } catch {}
    }
  }, [loading, user, pathname, router])

  // We wrap everything in a fragment to always show the LoadingScreen based on the loading state
  return (
    <>
      <LoadingScreen isVisible={showLoader} />
      
      {AUTH_PAGES.includes(pathname) ? (
        <>{children}</>
      ) : (
        <>
          {!loading && user && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              data-layout="app" 
              className="flex h-screen overflow-hidden"
            >
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <TopBar onSearchClick={() => setCommandOpen(true)} />
                <main className="flex-1 min-h-0 overflow-hidden relative">{children}</main>

                {/* Floating Global Task Input across all pages */}
                <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
                  <div className="pt-10 pb-4 sm:pb-5 px-4 sm:px-6 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
                    <div className="pointer-events-auto w-full max-w-xl mx-auto">
                      <TaskInput />
                    </div>
                  </div>
                </div>
              </div>
              <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
              <QuickTaskModal open={quickTaskOpen} onClose={() => setQuickTaskOpen(false)} />
              <CloseVerification />
              <UpdateNotification />
              {streakModalOpen && (
                <StreakCelebrationModal
                  mode={streakModalMode}
                  streakCount={settings.streakCount || 0}
                  onClose={() => {
                    setStreakModalOpen(false)
                  }}
                />
              )}
            </motion.div>
          )}

          {!loading && !user && <div className="h-screen w-full" />}
        </>
      )}
    </>
  )
}