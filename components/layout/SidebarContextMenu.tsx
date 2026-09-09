"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { createPortal } from "react-dom"
import { 
  Target, CalendarDays, ListTodo, BarChart2, Trash2, Archive,
  Check, Eye, EyeOff, Plus, Layout, Zap, ChevronDown, ChevronRight,
  FolderKanban, ShoppingBag, Award, Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/useSettings"

interface SidebarContextMenuProps {
  open: boolean
  onClose: () => void
  coords: { x: number; y: number }
}

const TABS_CONFIG = [
  { id: "focus", name: "Focus", icon: Target, color: "blue" },
  { id: "planner", name: "Planlar", icon: CalendarDays, color: "emerald" },
  { id: "tasks", name: "Görevler", icon: ListTodo, color: "purple" },
  { id: "projects", name: "Projeler", icon: FolderKanban, color: "indigo" },
  { id: "shop", name: "Mağaza", icon: ShoppingBag, color: "amber" },
  { id: "achievements", name: "Başarımlar", icon: Award, color: "rose" },
  { id: "community", name: "Topluluk", icon: Users, color: "teal" },
  { id: "analytics", name: "Veri", icon: BarChart2, color: "rose" },
  { id: "archive", name: "Arşiv", icon: Archive, color: "zinc" },
  { id: "trash", name: "Çöp", icon: Trash2, color: "zinc" },
] as const

export function SidebarContextMenu({ open, onClose, coords }: SidebarContextMenuProps) {
  const { settings, updateSettings } = useSettings()
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ x: coords.x, y: coords.y, side: "bottom" as "top" | "bottom" })

  React.useEffect(() => {
    if (!open) return
    const menuWidth = 320 
    const menuHeight = 140 
    let x = coords.x + 12
    let y = coords.y
    let side: "top" | "bottom" = "bottom"

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 20
    if (y + menuHeight > window.innerHeight) {
        side = "top"
        y = coords.y - 12
    } else {
        y = coords.y + 12
    }
    setPos({ x, y, side })

    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler, true)
    return () => document.removeEventListener("mousedown", handler, true)
  }, [open, onClose, coords])

  if (typeof document === "undefined") return null

  const toggleTab = (tabId: string) => {
    const currentTabs = settings.tabs || {
      focus: true,
      planner: true,
      tasks: true,
      projects: true,
      shop: true,
      profile: true,
      achievements: true,
      community: true,
      analytics: true,
      archive: true,
      trash: true
    }
    updateSettings({
      tabs: { ...currentTabs, [tabId]: !currentTabs[tabId as keyof typeof currentTabs] }
    })
  }

  const colors: any = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/15 shadow-[0_0_8px_rgba(59,130,246,0.15)]",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/15 shadow-[0_0_8px_rgba(168,85,247,0.15)]",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/15 shadow-[0_0_8px_rgba(99,102,241,0.15)]",
    teal: "text-teal-400 bg-teal-500/10 border-teal-500/15 shadow-[0_0_8px_rgba(20,184,166,0.15)]",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/15 shadow-[0_0_8px_rgba(244,63,94,0.15)]",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/15 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    zinc: "text-zinc-200 bg-zinc-500/15 border-zinc-500/20 shadow-[0_0_8px_rgba(113,113,122,0.15)]",
  }

  const dotColors: any = {
    blue: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]",
    emerald: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
    purple: "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]",
    indigo: "bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]",
    teal: "bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.5)]",
    rose: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]",
    amber: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
    zinc: "bg-zinc-400 shadow-[0_0_6px_rgba(113,113,122,0.5)]",
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)", y: pos.side === "bottom" ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)", y: pos.side === "bottom" ? -10 : 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ 
            left: pos.x, 
            top: pos.side === "bottom" ? pos.y : "auto",
            bottom: pos.side === "top" ? (window.innerHeight - coords.y + 10) : "auto" 
          }}
          className="fixed z-[10000] w-[260px] glass-dropdown border border-white/10 rounded-[24px] p-2.5 shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden select-none"
        >
          <div className="flex items-center gap-2 mb-2 px-1 text-zinc-600 opacity-60">
             <Layout className="w-3 h-3" />
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">SAYFALAR</span>
          </div>
          
          <div className="grid grid-cols-5 p-1 bg-white/[0.02] rounded-[20px] gap-1.5 border border-white/[0.04]">
            {TABS_CONFIG.map((tab) => {
              const isVisible = (settings.tabs as any)?.[tab.id] !== false
              return (
                <button
                  key={tab.id}
                  onClick={(e) => { e.stopPropagation(); toggleTab(tab.id) }}
                  title={tab.name}
                  className={cn(
                    "h-10 flex flex-col items-center justify-center rounded-[14px] transition-all duration-300 relative border border-transparent",
                    isVisible ? colors[tab.color] : "text-zinc-700 hover:text-zinc-500 hover:bg-white/[0.02]"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4 transition-transform duration-500", isVisible && "scale-105")} />
                  {isVisible && (
                    <div className={cn("absolute bottom-0.5 w-1.5 h-1.5 rounded-full", dotColors[tab.color])} />
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
