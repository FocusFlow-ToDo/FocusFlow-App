"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { createPortal } from "react-dom"
import {
  Pencil, Target, Check, Trash2, Calendar, ChevronRight,
  X, Boxes, Plus, CheckCircle2, ArrowLeft, Search, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task, TaskGroup } from "@/types"
import { startOfDay } from "date-fns"
import { useTaskGroups } from "@/hooks/useTaskGroups"
import { CalendarPicker } from "@/components/ui/CalendarPicker"
import { CategorySymbol, SYMBOL_GROUPS } from "@/components/ui/CategorySymbol"

const EXTENDED_SYMBOL_GROUPS = [
  ...SYMBOL_GROUPS,
  {
    name: "Emojiler",
    icons: [
      "📁", "🚀", "💻", "🎯", "⚡", "🎨",
      "📚", "💼", "💎", "💡", "🔥", "🏆",
      "🌟", "🛠️", "☕", "🎮", "📌", "✨"
    ]
  }
]

const COLOR_PALETTE = [
  "#3B82F6", // Mavi
  "#6366F1", // İndigo
  "#8B5CF6", // Mor
  "#A855F7", // Fuşya
  "#EC4899", // Pembe
  "#EF4444", // Kırmızı
  "#F97316", // Turuncu
  "#F59E0B", // Kehribar
  "#10B981", // Zümrüt
  "#06B6D4", // Siyan
]

interface TaskContextMenuProps {
  task: Task | null
  coords: { x: number; y: number }
  open: boolean
  onClose: () => void
  onToggle?: (id: string, completed: boolean) => void
  onSelect?: () => void
  onFocusStart?: (id: string) => void
  onDelete?: (id: string) => void
  onChangeDate?: (id: string, date: Date | null) => void
  onAssignGroup?: (id: string, groupId: string | null, groupName?: string | null, groupColor?: string | null, groupIcon?: string | null) => void
}

export function TaskContextMenu({
  task,
  coords,
  open,
  onClose,
  onToggle,
  onSelect,
  onFocusStart,
  onDelete,
  onChangeDate,
  onAssignGroup,
}: TaskContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [activeSubmenu, setActiveSubmenu] = React.useState<"none" | "date" | "group">("none")
  const [groupSubmenuView, setGroupSubmenuView] = React.useState<"list" | "create" | "edit">("list")
  const [groupSearch, setGroupSearch] = React.useState("")
  const [selectedCategoryTab, setSelectedCategoryTab] = React.useState<string>("Tümü")
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null)
  const [formGroupName, setFormGroupName] = React.useState("")
  const [formGroupColor, setFormGroupColor] = React.useState("#3B82F6")
  const [formGroupIcon, setFormGroupIcon] = React.useState("Target")

  const { groups, addGroup, updateGroup, deleteGroup } = useTaskGroups()

  React.useEffect(() => {
    if (!open) {
      setActiveSubmenu("none")
      setGroupSubmenuView("list")
      setEditingGroupId(null)
      setGroupSearch("")
      return
    }
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onClose])

  const filteredGroups = React.useMemo(() => {
    if (!groupSearch.trim()) return groups
    return groups.filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase().trim()))
  }, [groups, groupSearch])

  if (typeof document === "undefined" || !task) return null

  const isDone = task.status === "done"
  const today = startOfDay(new Date())

  // Calculate submenu flip sides to prevent viewport overflow
  const submenuWidth = 320
  const openLeft = typeof window !== "undefined" ? coords.x + 220 + submenuWidth + 20 > window.innerWidth : false
  const alignBottom = typeof window !== "undefined" ? coords.y > window.innerHeight / 2 : false

  const handleSetDate = (d: Date | null) => {
    if (onChangeDate) onChangeDate(task.id, d)
    onClose()
  }

  const handleSelectGroup = (g: TaskGroup | null) => {
    if (onAssignGroup) {
      onAssignGroup(task.id, g ? g.id : null, g ? g.name : null, g ? g.color : null, g ? (g.icon || "📁") : null)
    }
    onClose()
  }

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formGroupName.trim()) return

    if (groupSubmenuView === "edit" && editingGroupId) {
      await updateGroup(editingGroupId, {
        name: formGroupName.trim(),
        color: formGroupColor,
        icon: formGroupIcon
      })
      if (task.groupId === editingGroupId && onAssignGroup) {
        onAssignGroup(task.id, editingGroupId, formGroupName.trim(), formGroupColor, formGroupIcon)
      }
      setGroupSubmenuView("list")
      setEditingGroupId(null)
    } else {
      const created = await addGroup({
        name: formGroupName.trim(),
        color: formGroupColor,
        icon: formGroupIcon
      })
      if (created && onAssignGroup) {
        onAssignGroup(task.id, created.id, created.name, created.color, created.icon || "📁")
      }
      onClose()
    }
  }

  const handleDeleteGroup = async (gId: string) => {
    if (task.groupId === gId && onAssignGroup) {
      onAssignGroup(task.id, null, null, null, null)
    }
    await deleteGroup(gId)
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          className="fixed z-[9999] glass-dropdown rounded-2xl py-2 min-w-[210px] shadow-2xl border border-white/10"
          style={{
            left: `${Math.min(coords.x, typeof window !== "undefined" ? window.innerWidth - 230 : coords.x)}px`,
            top: `${Math.min(coords.y, typeof window !== "undefined" ? window.innerHeight - 340 : coords.y)}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onSelect && (
            <MenuButton 
              icon={Pencil} 
              onClick={() => { onSelect(); onClose() }}
              onMouseEnter={() => setActiveSubmenu("none")}
            >
              Düzenle
            </MenuButton>
          )}

          {onFocusStart && !isDone && (
            <MenuButton
              icon={Target}
              onClick={() => { onFocusStart(task.id); onClose() }}
              onMouseEnter={() => setActiveSubmenu("none")}
              className="hover:bg-blue-500/10 hover:text-blue-400"
            >
              Odaklan
            </MenuButton>
          )}

          {onToggle && (
            <MenuButton
              icon={Check}
              onClick={() => { onToggle(task.id, !isDone); onClose() }}
              onMouseEnter={() => setActiveSubmenu("none")}
              className={isDone ? "hover:bg-emerald-500/20 hover:text-emerald-400" : "hover:bg-emerald-500/10 hover:text-emerald-400"}
            >
              {isDone ? "Geri Al" : "Tamamla"}
            </MenuButton>
          )}

          <div className="h-px bg-white/[0.04] my-1.5 mx-3" />

          {/* Günü Değiştir — Sağa Açılır Submenu */}
          {onChangeDate && (
            <div 
              className="relative px-2"
              onMouseEnter={() => setActiveSubmenu("date")}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveSubmenu(s => s === "date" ? "none" : "date")
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-200 group/item",
                  activeSubmenu === "date" ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Günü Değiştir</span>
                </div>
                <ChevronRight className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  activeSubmenu === "date" ? (openLeft ? "-rotate-180 text-blue-400" : "rotate-90 text-blue-400") : "text-zinc-500"
                )} />
              </button>

              {/* Sağa Açılan Takvim Alt Menüsü */}
              <AnimatePresence>
                {activeSubmenu === "date" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: openLeft ? 8 : -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: openLeft ? 8 : -8 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute z-[10000] shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden border border-white/10 bg-[#0e0e14]/98 backdrop-blur-2xl",
                      openLeft ? "right-full mr-2" : "left-full ml-2",
                      alignBottom ? "bottom-0" : "top-0"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setActiveSubmenu("date")}
                  >
                    <CalendarPicker
                      selectedDate={task.dueDate ? new Date(task.dueDate) : null}
                      onSelect={(d) => handleSetDate(d)}
                      onClose={onClose}
                      today={today}
                    />
                    {task.dueDate && (
                      <div className="p-2 pt-0 -mt-1 bg-transparent">
                        <button
                          type="button"
                          onClick={() => handleSetDate(null)}
                          className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-1.5 transition-all border border-white/[0.05]"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tarihi Kaldır</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Özel Grup Seç / Değiştir — Sağa / Sola Açılır Submenu */}
          {onAssignGroup && (
            <div 
              className="relative px-2"
              onMouseEnter={() => setActiveSubmenu("group")}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveSubmenu(s => s === "group" ? "none" : "group")
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-200 group/item",
                  activeSubmenu === "group" ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Boxes className="w-4 h-4 text-indigo-400" />
                  <span>Özel Grup</span>
                </div>
                <ChevronRight className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  activeSubmenu === "group" ? (openLeft ? "-rotate-180 text-indigo-400" : "rotate-90 text-indigo-400") : "text-zinc-500"
                )} />
              </button>

              {/* Sağa Açılan Grup Listesi Alt Menüsü */}
              <AnimatePresence>
                {activeSubmenu === "group" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: openLeft ? 8 : -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: openLeft ? 8 : -8 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute z-[10000] w-[320px] shadow-[0_24px_60px_rgba(0,0,0,0.85)] rounded-2xl border border-white/10 bg-[#0e0e14]/98 backdrop-blur-2xl flex flex-col overflow-hidden",
                      openLeft ? "right-full mr-2" : "left-full ml-2",
                      alignBottom ? "bottom-0 origin-bottom-left" : "top-0 origin-top-left"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setActiveSubmenu("group")}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        {groupSubmenuView !== "list" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setGroupSubmenuView("list")
                              setEditingGroupId(null)
                            }}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Geri Dön"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                            <Boxes className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="text-xs font-extrabold text-zinc-200 tracking-wide">
                          {groupSubmenuView === "create"
                            ? "Yeni Grup Oluştur"
                            : groupSubmenuView === "edit"
                            ? "Grubu Düzenle"
                            : "Özel Gruplar"}
                        </span>
                      </div>

                      {groupSubmenuView === "list" && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormGroupName("")
                            setFormGroupColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)])
                            setFormGroupIcon("Target")
                            setEditingGroupId(null)
                            setSelectedCategoryTab("Tümü")
                            setGroupSubmenuView("create")
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 text-[11px] font-bold transition-all border border-indigo-500/20 active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Yeni</span>
                        </button>
                      )}
                    </div>

                    {/* View: LIST */}
                    {groupSubmenuView === "list" && (
                      <div className="p-2 space-y-2 max-h-[380px] flex flex-col">
                        {/* Current Task's Group Badge (if assigned) */}
                        {task.groupId && (
                          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Mevcut:</span>
                              <div
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-black border truncate shadow-sm"
                                style={{
                                  backgroundColor: task.groupColor ? `${task.groupColor}20` : 'rgba(99,102,241,0.2)',
                                  borderColor: task.groupColor ? `${task.groupColor}40` : 'rgba(99,102,241,0.4)',
                                  color: task.groupColor || '#818CF8'
                                }}
                              >
                                <CategorySymbol symbol={task.groupIcon || "Target"} className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{task.groupName}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectGroup(null)}
                              className="px-2 py-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-[11px] font-bold flex items-center gap-1 transition-colors flex-shrink-0 border border-rose-500/20"
                            >
                              <X className="w-3 h-3" />
                              <span>Kaldır</span>
                            </button>
                          </div>
                        )}

                        {/* Search Bar if groups > 2 */}
                        {groups.length > 2 && (
                          <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
                            <input
                              type="text"
                              value={groupSearch}
                              onChange={(e) => setGroupSearch(e.target.value)}
                              placeholder="Grup ara..."
                              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none transition-all"
                            />
                            {groupSearch && (
                              <button
                                onClick={() => setGroupSearch("")}
                                className="absolute right-2.5 text-zinc-500 hover:text-zinc-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Groups List */}
                        {groups.length === 0 ? (
                          <div className="p-5 text-center space-y-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-300">Henüz özel grup yok</p>
                              <p className="text-[11px] text-zinc-500 mt-0.5">Görevlerinizi gruplamak için hemen oluşturun.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormGroupName("")
                                setFormGroupColor(COLOR_PALETTE[0])
                                setFormGroupIcon("Target")
                                setEditingGroupId(null)
                                setSelectedCategoryTab("Tümü")
                                setGroupSubmenuView("create")
                              }}
                              className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                            >
                              + İlk Grubu Oluştur
                            </button>
                          </div>
                        ) : filteredGroups.length === 0 ? (
                          <div className="py-4 text-center text-xs text-zinc-500">
                            Aramaya uygun grup bulunamadı.
                          </div>
                        ) : (
                          <div className="overflow-y-auto custom-scrollbar space-y-1 max-h-[220px] pr-0.5">
                            {filteredGroups.map((g) => {
                              const isSelected = task.groupId === g.id
                              return (
                                <div
                                  key={g.id}
                                  onClick={() => handleSelectGroup(g)}
                                  className={cn(
                                    "group/grp w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border",
                                    isSelected
                                      ? "bg-white/[0.08] border-white/15 shadow-sm"
                                      : "border-transparent hover:bg-white/[0.05] hover:border-white/5"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm relative flex-shrink-0 transition-transform group-hover/grp:scale-105"
                                      style={{
                                        backgroundColor: `${g.color}20`,
                                        border: `1px solid ${g.color}40`,
                                        color: g.color
                                      }}
                                    >
                                      <CategorySymbol symbol={g.icon || "Target"} className="w-3.5 h-3.5" />
                                      <span
                                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#0e0e14]"
                                        style={{
                                          backgroundColor: g.color,
                                          boxShadow: `0 0 6px ${g.color}`
                                        }}
                                      />
                                    </div>
                                    <span className={cn("truncate font-semibold", isSelected ? "text-white" : "text-zinc-300")}>
                                      {g.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {isSelected && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1" />
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingGroupId(g.id)
                                        setFormGroupName(g.name)
                                        setFormGroupColor(g.color || "#3B82F6")
                                        setFormGroupIcon(g.icon || "Target")
                                        setSelectedCategoryTab("Tümü")
                                        setGroupSubmenuView("edit")
                                      }}
                                      className="p-1 rounded-md text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 opacity-0 group-hover/grp:opacity-100 transition-all"
                                      title="Düzenle"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteGroup(g.id)
                                      }}
                                      className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover/grp:opacity-100 transition-all"
                                      title="Sil"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {groups.length > 0 && (
                          <div className="pt-1.5 border-t border-white/[0.06]">
                            <button
                              type="button"
                              onClick={() => {
                                setFormGroupName("")
                                setFormGroupColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)])
                                setFormGroupIcon("Target")
                                setEditingGroupId(null)
                                setSelectedCategoryTab("Tümü")
                                setGroupSubmenuView("create")
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-white/5 active:scale-98"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Yeni Grup Oluştur</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* View: CREATE / EDIT */}
                    {groupSubmenuView !== "list" && (
                      <form onSubmit={handleSaveGroup} className="p-3 space-y-3">
                        {/* Live Preview */}
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                          <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">
                            Canlı Önizleme
                          </div>
                          <div className="flex items-center justify-center py-1">
                            <div
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold border transition-all duration-300 shadow-md"
                              style={{
                                backgroundColor: `${formGroupColor}20`,
                                borderColor: `${formGroupColor}50`,
                                color: formGroupColor,
                                boxShadow: `0 0 16px ${formGroupColor}25`
                              }}
                            >
                              <CategorySymbol symbol={formGroupIcon} className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="tracking-wide uppercase truncate max-w-[200px]">
                                {formGroupName.trim() || "Grup Adı"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Grup Adı
                          </label>
                          <input
                            autoFocus
                            type="text"
                            value={formGroupName}
                            onChange={(e) => setFormGroupName(e.target.value)}
                            placeholder="Örn: Tasarım, MVP, Acil..."
                            className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none transition-all"
                          />
                        </div>

                        {/* Compact Categorized Symbol Selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Simge Seç
                            </span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5">
                              <CategorySymbol symbol={formGroupIcon} className="w-3 h-3 text-indigo-400" />
                              <span className="text-zinc-400 text-[9px] font-medium truncate max-w-[80px]">{formGroupIcon}</span>
                            </div>
                          </div>

                          {/* Quick Category Filter Pills */}
                          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                            {["Tümü", ...EXTENDED_SYMBOL_GROUPS.map((g) => g.name)].map((catName) => {
                              const label = catName === "İş & Üretkenlik" ? "İş" : catName === "Kişisel & Ev" ? "Kişisel" : catName === "Sağlık & Yaşam" ? "Sağlık" : catName === "Zaman & Plan" ? "Zaman" : catName === "Yaratıcılık" ? "Yaratıcı" : catName
                              return (
                                <button
                                  key={catName}
                                  type="button"
                                  onClick={() => setSelectedCategoryTab(catName)}
                                  className={cn(
                                    "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex-shrink-0",
                                    selectedCategoryTab === catName
                                      ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                                      : "bg-white/[0.03] text-zinc-500 hover:text-zinc-300 border border-transparent hover:bg-white/[0.06]"
                                  )}
                                >
                                  {label}
                                </button>
                              )
                            })}
                          </div>

                          {/* Compact Categorized Icons Grid */}
                          <div className="max-h-[135px] overflow-y-auto custom-scrollbar p-1.5 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
                            {(selectedCategoryTab === "Tümü"
                              ? EXTENDED_SYMBOL_GROUPS
                              : EXTENDED_SYMBOL_GROUPS.filter((g) => g.name === selectedCategoryTab)
                            ).map((group) => (
                              <div key={group.name} className="space-y-1">
                                <p className="text-[9px] uppercase tracking-[0.12em] font-extrabold text-zinc-500 px-0.5">
                                  {group.name}
                                </p>
                                <div className="grid grid-cols-7 gap-1">
                                  {group.icons.map((iconName) => {
                                    const isSelected = formGroupIcon === iconName
                                    return (
                                      <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setFormGroupIcon(iconName)}
                                        className={cn(
                                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 relative",
                                          isSelected
                                            ? "bg-indigo-500/30 text-indigo-200 ring-1.5 ring-indigo-400 shadow-sm scale-105"
                                            : "text-zinc-400 hover:text-white hover:bg-white/10 opacity-75 hover:opacity-100"
                                        )}
                                        title={iconName}
                                      >
                                        <CategorySymbol symbol={iconName} className="w-3.5 h-3.5" />
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Color Selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Renk Paleti
                            </span>
                            <span className="text-[9px] font-mono uppercase font-bold" style={{ color: formGroupColor }}>
                              {formGroupColor}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 p-2 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                            {COLOR_PALETTE.map((col) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setFormGroupColor(col)}
                                className={cn(
                                  "w-5 h-5 rounded-full transition-all duration-200 relative flex items-center justify-center",
                                  formGroupColor === col
                                    ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0e0e14]"
                                    : "hover:scale-110 opacity-80 hover:opacity-100"
                                )}
                                style={{
                                  backgroundColor: col,
                                  boxShadow: formGroupColor === col ? `0 0 10px ${col}` : undefined
                                }}
                              >
                                {formGroupColor === col && <div className="w-1.5 h-1.5 bg-white rounded-full shadow" />}
                              </button>
                            ))}
                            <label
                              className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center cursor-pointer hover:border-white/50 transition-all relative overflow-hidden bg-gradient-to-tr from-rose-500 via-amber-400 to-indigo-500"
                              title="Özel Renk Seç"
                            >
                              <input
                                type="color"
                                value={formGroupColor}
                                onChange={(e) => setFormGroupColor(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => {
                              setGroupSubmenuView("list")
                              setEditingGroupId(null)
                            }}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-all"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="submit"
                            disabled={!formGroupName.trim()}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-98"
                          >
                            {groupSubmenuView === "edit" ? "Güncelle" : "Grup Oluştur"}
                          </button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="h-px bg-white/[0.04] my-1.5 mx-3" />

          {/* Sil — Directly to trash */}
          {onDelete && (
            <MenuButton
              icon={Trash2}
              onClick={() => { onDelete(task.id); onClose() }}
              onMouseEnter={() => setActiveSubmenu("none")}
              destructive
            >
              Sil
            </MenuButton>
          )}

        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function MenuButton({
  children,
  icon: Icon,
  onClick,
  onMouseEnter,
  destructive,
  className,
}: {
  children: React.ReactNode
  icon: any
  onClick: () => void
  onMouseEnter?: () => void
  destructive?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-full flex items-center gap-3.5 px-3.5 py-2.5 text-[13px] font-bold rounded-xl mx-2 transition-all duration-200 group/item",
        destructive
          ? "text-rose-500 hover:bg-rose-500/15 hover:text-rose-400"
          : "text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-100",
        className
      )}
      style={{ width: "calc(100% - 16px)" }}
    >
      <Icon className="w-4 h-4 opacity-70 group-hover/item:opacity-100 transition-opacity" />
      <span className="tracking-tight">{children}</span>
    </button>
  )
}
