"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { createPortal } from "react-dom"
import { 
  Flag, Tag, AlignLeft, Calendar, 
  Check, EyeOff, Layout, Settings2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/useSettings"

interface TaskInputContextMenuProps {
  open: boolean
  onClose: () => void
  coords: { x: number; y: number }
}

export function TaskInputContextMenu({ open, onClose, coords }: TaskInputContextMenuProps) {
  const { settings, updateSettings } = useSettings()
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ x: coords.x, y: coords.y, side: "bottom" as "top" | "bottom" })

  React.useEffect(() => {
    if (!open) return
    
    const menuWidth = 256 // w-64
    const menuHeight = 220 // Estimated height
    
    let x = coords.x
    let y = coords.y
    let side: "top" | "bottom" = "bottom"

    // horizontal check
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }

    // vertical check
    if (y + menuHeight > window.innerHeight) {
      side = "top"
    }

    setPos({ x, y, side })

    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onClose, coords])

  if (typeof document === "undefined") return null

  const toggleFeature = (feature: keyof typeof settings.features) => {
    updateSettings({
      features: {
        ...settings.features,
        [feature]: !settings.features[feature]
      }
    })
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: pos.side === "bottom" ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: pos.side === "bottom" ? -10 : 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ 
            left: pos.x, 
            top: pos.side === "bottom" ? pos.y : "auto",
            bottom: pos.side === "top" ? (window.innerHeight - coords.y) : "auto" 
          }}
          data-context-menu="true"
          className="fixed z-[10000] w-64 glass-dropdown border border-white/10 rounded-2xl p-1.5 shadow-2xl shadow-black/60 overflow-hidden"
        >
          <div className="px-2.5 py-2 mb-1.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">
              <Settings2 className="w-3 h-3" />
              Giriş Alanını Özelleştir
            </div>
          </div>

          <div className="space-y-0.5">
            <ContextMenuItem 
              id="priorities" 
              label="Öncelik Sistemini Göster" 
              icon={Flag} 
              active={settings.features.priorities} 
              onClick={() => toggleFeature('priorities')} 
            />
            <ContextMenuItem 
              id="categories" 
              label="Kategorileri Göster" 
              icon={Tag} 
              active={settings.features.categories} 
              onClick={() => toggleFeature('categories')} 
            />
            <ContextMenuItem 
              id="subtasks" 
              label="Alt Görev Desteği" 
              icon={Layout} 
              active={settings.features.subtasks} 
              onClick={() => toggleFeature('subtasks')} 
            />
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-white/[0.05]">
            <p className="px-3 py-1.5 text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
              * Bu ayarlar tüm uygulama genelinde geçerli olacaktır.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function ContextMenuItem({ 
  label, 
  icon: Icon, 
  active, 
  onClick 
}: { 
  id: string; 
  label: string; 
  icon: any; 
  active: boolean; 
  onClick: () => void 
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group",
        active ? "text-zinc-100 bg-white/[0.03] hover:bg-white/[0.06]" : "text-zinc-600 hover:bg-white/[0.02] hover:text-zinc-400"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn(
          "w-4 h-4 transition-colors",
          active ? "text-blue-400" : "text-zinc-700 group-hover:text-zinc-500"
        )} />
        <span className="text-[13px] font-semibold">{label}</span>
      </div>
      <div className={cn(
        "w-5 h-5 rounded-lg flex items-center justify-center transition-all",
        active ? "bg-blue-500/10 text-blue-400" : "bg-white/[0.02] text-zinc-800"
      )}>
        {active ? <Check className="w-3 h-3 stroke-[3]" /> : <EyeOff className="w-3 h-3" />}
      </div>
    </button>
  )
}
