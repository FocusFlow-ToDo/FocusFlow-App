"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { createPortal } from "react-dom"
import { 
  Flag, Tag, AlignLeft, Calendar, Clock,
  Check, EyeOff, Layout, Settings2,
  Target, CalendarDays, ListTodo, BarChart2, Trash2, Archive,
  Maximize2, Minimize2, Sparkles, Volume2, Palette,
  ChevronDown, ChevronRight, Bell, Wand2, MousePointer2,
  Activity, Zap, ShieldAlert, Layers, Command, Monitor
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/useSettings"

interface GlobalContextMenuProps {
  open: boolean
  onClose: () => void
  coords: { x: number; y: number }
}

export function GlobalContextMenu({ open, onClose, coords }: GlobalContextMenuProps) {
  const { settings, updateSettings } = useSettings()
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ x: coords.x, y: coords.y, side: "bottom" as "top" | "bottom" })
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    const menuWidth = 330 
    const menuHeight = 350 
    let x = coords.x
    let y = coords.y
    let side: "top" | "bottom" = "bottom"

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 15
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

  const toggleFeature = (feature: keyof typeof settings.features) => {
    updateSettings({ features: { ...settings.features, [feature]: !settings.features[feature] } })
  }

  const toggleTab = (tabId: keyof typeof settings.tabs) => {
    updateSettings({ tabs: { ...settings.tabs, [tabId]: !settings.tabs[tabId] } })
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)", y: pos.side === "bottom" ? -15 : 15 }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, scale: 0.9, filter: "blur(20px)", y: pos.side === "bottom" ? -15 : 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ 
            left: pos.x, 
            top: pos.side === "bottom" ? pos.y : "auto",
            bottom: pos.side === "top" ? (window.innerHeight - coords.y + 12) : "auto" 
          }}
          data-context-menu="true"
          className="fixed z-[10000] w-[330px] glass-dropdown border border-white/10 rounded-[28px] p-4 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden select-none"
        >
          <div className="flex items-center justify-between mb-2.5 px-1 truncate">
             <p className="text-[9px] font-black text-zinc-600 tracking-[0.2em] uppercase truncate">SAYFALAR</p>
             <AnimatePresence mode="wait">
                 {hoveredTab && (
                     <motion.span 
                        key={hoveredTab}
                        initial={{ opacity: 0, x: 5 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -5 }}
                        className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]"
                     >
                        {hoveredTab}
                     </motion.span>
                 )}
             </AnimatePresence>
          </div>
          
          <div className="flex items-center justify-between gap-1 mb-4 bg-white/[0.03] p-1 rounded-[22px] border border-white/[0.05]">
             <NavIcon icon={Target} active={settings.tabs.focus} onClick={() => toggleTab('focus')} label="Focus" color="blue" onHover={setHoveredTab} />
             <NavIcon icon={CalendarDays} active={settings.tabs.planner} onClick={() => toggleTab('planner')} label="Planlar" color="emerald" onHover={setHoveredTab} />
             <NavIcon icon={ListTodo} active={settings.tabs.tasks} onClick={() => toggleTab('tasks')} label="Havuz" color="purple" onHover={setHoveredTab} />
             <NavIcon icon={BarChart2} active={settings.tabs.analytics} onClick={() => toggleTab('analytics')} label="Veri" color="rose" onHover={setHoveredTab} />
             <NavIcon icon={Archive} active={settings.tabs.archive} onClick={() => toggleTab('archive')} label="Arşiv" color="amber" onHover={setHoveredTab} />
             <NavIcon icon={Trash2} active={settings.tabs.trash} onClick={() => toggleTab('trash')} label="Çöp" color="zinc" onHover={setHoveredTab} />
          </div>

          <SectionTitle label="YETENEKLER" />
          
          <div className="grid grid-cols-2 gap-2 mb-4">
             <FeatureCard label="Pomodoro" icon={Settings2} active={settings.features.pomodoro} onClick={() => toggleFeature('pomodoro')} color="blue" />
             <FeatureCard label="Hedefler" icon={Layers} active={settings.statusMilestonesEnabled} onClick={() => updateSettings({ statusMilestonesEnabled: !settings.statusMilestonesEnabled })} color="purple" />
             <FeatureCard label="Kategoriler" icon={Tag} active={settings.features.categories} onClick={() => toggleFeature('categories')} color="emerald" />
             <FeatureCard label="Öncelikler" icon={Flag} active={settings.features.priorities} onClick={() => toggleFeature('priorities')} color="orange" />
             <FeatureCard label="Alt Görevler" icon={AlignLeft} active={settings.features.subtasks} onClick={() => toggleFeature('subtasks')} color="rose" />
             <FeatureCard label="Saat" icon={Clock} active={!!settings.appearance?.showTaskMetadata?.createdAt} onClick={() => updateSettings({ appearance: { ...settings.appearance, showTaskMetadata: { ...settings.appearance.showTaskMetadata, createdAt: !settings.appearance?.showTaskMetadata?.createdAt } } })} color="amber" />
          </div>

          <div className="space-y-2">
              <div className="flex gap-2">
                 <button 
                   onClick={() => updateSettings({ appearance: { ...settings.appearance, compactMode: !settings.appearance.compactMode } })}
                   className={cn(
                     "flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl border transition-all text-[11px] font-bold",
                     settings.appearance.compactMode ? "bg-white text-black border-white" : "bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:text-zinc-200"
                   )}
                 >
                    {settings.appearance.compactMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    Kompakt Mod
                 </button>
                 <button 
                   onClick={() => toggleFeature('notifications')}
                   className={cn(
                     "flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl border transition-all text-[11px] font-bold",
                     settings.features.notifications ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:text-zinc-200"
                   )}
                 >
                    <Bell className="w-4 h-4" />
                    Bildirimler
                 </button>
              </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function SectionTitle({ label }: { label: string }) {
    return <p className="text-[9px] font-black text-zinc-600 tracking-[0.2em] mb-2 px-1 uppercase">{label}</p>
}

function NavIcon({ icon: Icon, active, onClick, label, color, onHover }: { icon: any, active: boolean, onClick: () => void, label: string, color: string, onHover: (v: string | null) => void }) {
    const colors: any = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/15 shadow-[0_0_8px_rgba(59,130,246,0.15)]",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/15 shadow-[0_0_8px_rgba(168,85,247,0.15)]",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/15 shadow-[0_0_8px_rgba(244,63,94,0.15)]",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/15 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
        zinc: "text-zinc-200 bg-zinc-500/15 border-zinc-500/20 shadow-[0_0_8px_rgba(113,113,122,0.15)]",
    }

    const dotColors: any = {
        blue: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]",
        emerald: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
        purple: "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]",
        rose: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]",
        amber: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
        zinc: "bg-zinc-400 shadow-[0_0_6px_rgba(113,113,122,0.4)]",
    }

    return (
        <button
            onMouseEnter={() => onHover(label)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className={cn(
                "flex-1 h-11 flex items-center justify-center rounded-[18px] transition-all duration-300 relative border border-transparent",
                active ? colors[color] : "text-zinc-700 hover:text-zinc-500 hover:bg-white/[0.02]"
            )}
        >
            <Icon className={cn("w-[18px] h-[18px] transition-transform duration-500", active && "scale-105")} />
            
            {active && (
                <div className={cn("absolute -bottom-1 w-1.5 h-1.5 rounded-full", dotColors[color])} />
            )}
        </button>
    )
}

function FeatureCard({ label, icon: Icon, active, onClick, color }: { label: string, icon: any, active: boolean, onClick: () => void, color: string }) {
    const colors: any = {
        blue: active ? "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-sm" : "bg-white/[0.02] border-white/[0.04]",
        purple: active ? "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-sm" : "bg-white/[0.02] border-white/[0.04]",
        emerald: active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-sm" : "bg-white/[0.02] border-white/[0.04]",
        orange: active ? "bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-sm" : "bg-white/[0.02] border-white/[0.04]",
        rose: active ? "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-sm" : "bg-white/[0.02] border-white/[0.04]",
        amber: active ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-sm" : "bg-white/[0.02] border-white/[0.04]",
    }
    
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className={cn(
                "flex items-center gap-2.5 px-3 h-11 rounded-2xl border transition-all duration-300 group select-none",
                colors[color] || colors.blue
            )}
        >
            <div className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center transition-all",
                active ? "bg-black/10" : "bg-white/[0.01] group-hover:bg-white/[0.03]"
            )}>
                <Icon className={cn("w-[14px] h-[14px]", active && "scale-105")} />
            </div>
            <span className="text-[11px] font-bold tracking-tight truncate">{label}</span>
            {active && <div className={cn("ml-auto w-1 h-1 rounded-full bg-current shadow-[0_0_6px_currentColor]")} />}
        </button>
    )
}
