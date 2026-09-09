"use client"

import React from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { createPortal } from "react-dom"
import { 
  Plus, Check, X, Pencil, Trash2, 
  ImagePlus, Loader2, Tag
} from "lucide-react"
import { CategorySymbol, SYMBOL_GROUPS } from "@/components/ui/CategorySymbol"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { cn } from "@/lib/utils"
import { useCategories, type CategoryItem } from "@/hooks/useCategories"

interface CategoryManagerProps {
  selectedCategoryId: string | null;
  onSelect: (id: string | null, submit?: boolean) => void;
  className?: string;
  variant?: "default" | "minimal";
}

const CAT_COLORS_PRESETS: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_4px_12px_-2px_rgba(59,130,246,0.15)]",
  purple: "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_4px_12px_-2px_rgba(168,85,247,0.15)]",
  rose: "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_4px_12px_-2px_rgba(244,63,94,0.15)]",
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.15)]",
  amber: "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_4px_12px_-2px_rgba(245,158,11,0.15)]",
}

export function CategoryManager({ selectedCategoryId, onSelect, className, variant = "default" }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useCategories()
  
  // Internal UI States
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null)
  const [editCatValue, setEditCatValue] = React.useState("")
  const [editCatColor, setEditCatColor] = React.useState("#3B82F6")
  const [isAddingCat, setIsAddingCat] = React.useState(false)
  const [newCatValue, setNewCatValue] = React.useState("")
  const [emojiPickerFor, setEmojiPickerFor] = React.useState<string | null>(null)
  const [emojiPickerTab, setEmojiPickerTab] = React.useState<"icons" | "upload">("icons")
  const [menuOpen, setMenuOpen] = React.useState<{ id: string, x: number, y: number, rect: DOMRect } | null>(null)
  const [deletingCatId, setDeletingCatId] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [pickerPos, setPickerPos] = React.useState<{ x: number, y: number, side: 'top' | 'bottom' } | null>(null)

  const editCatRef = React.useRef<HTMLInputElement>(null)
  const newCatRef = React.useRef<HTMLInputElement>(null)
  const editCatContainerRef = React.useRef<HTMLDivElement>(null)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)
  const isLongPress = React.useRef(false)

  // Handlers
  const handleCategoryClick = (id: string, e: React.MouseEvent) => {
    if (isLongPress.current) {
        isLongPress.current = false
        return
    }
    const isSubmit = e.ctrlKey || e.metaKey
    onSelect(selectedCategoryId === id ? null : id, isSubmit)
  }

  const handleMouseDown = (id: string) => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      startEditing(id)
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50)
      }
    }, 600)
  }

  const handleMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleTouchMove = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const startEditing = (id: string) => {
    const cat = categories.find(c => c.id === id)
    if (cat) {
      setEditingCatId(id)
      setEditCatValue(cat.name)
      setEditCatColor(cat.color || "#3B82F6")
      setMenuOpen(null)
    }
  }

  const handleCategoryEditSave = async (id: string) => {
    if (editCatValue.trim()) {
      await updateCategory(id, { name: editCatValue.trim(), color: editCatColor })
    }
    setEditingCatId(null)
  }

  const handleAddCategory = async () => {
    if (newCatValue.trim()) {
      const vibrantColors = ["#3B82F6", "#8B5CF6", "#EC4899", "#F43F5E", "#EF4444", "#F59E0B", "#10B981", "#06B6D4", "#6366F1"]
      const randomColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)]
      
      await addCategory({ 
        name: newCatValue.trim(), 
        color: randomColor,
        emoji: "📌"
      })
      setNewCatValue("")
      setIsAddingCat(false)
    }
  }

  const handleEmojiSelect = async (id: string, emoji: string) => {
    const cat = categories.find(c => c.id === id)
    if (cat?.emoji?.startsWith("http")) {
      await deleteImageFromCloudinary(cat.emoji)
    }
    await updateCategory(id, { emoji })
    setEmojiPickerFor(null)
  }

  /* ── Cloudinary Image Logic ── */
  const extractDominantColor = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          if (!ctx) return resolve("#3B82F6")
          canvas.width = 10; canvas.height = 10
          ctx.drawImage(img, 0, 0, 10, 10)
          const data = ctx.getImageData(0, 0, 10, 10).data
          let r = 0, g = 0, b = 0, count = 0
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3
            if (brightness > 30 && brightness < 225) { r += data[i]; g += data[i+1]; b += data[i+2]; count++ }
          }
          if (count === 0) {
            for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2] }
            r /= 25; g /= 25; b /= 25
          } else { r /= count; g /= count; b /= count }
          const toHex = (x: number) => Math.round(x).toString(16).padStart(2, "0")
          resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const deleteImageFromCloudinary = async (emojiUrl: string) => {
    if (!emojiUrl || !emojiUrl.startsWith("http")) return
    try {
      const parts = emojiUrl.split("/")
      const lastPart = parts[parts.length - 1]
      const publicIdWithExt = lastPart.split(".")[0]
      const versionIndex = parts.findIndex(p => p.startsWith('v') && /^\d+$/.test(p.substring(1)))
      let publicId = ""
      if (versionIndex !== -1 && versionIndex < parts.length - 1) {
        publicId = parts.slice(versionIndex + 1).join("/").split(".")[0]
      } else {
        const uploadIndex = parts.indexOf("upload")
        if (uploadIndex !== -1) {
            let start = uploadIndex + 1
            while (start < parts.length && (parts[start].includes(",") || parts[start].startsWith("v"))) {
                start++
            }
            publicId = parts.slice(start).join("/").split(".")[0]
        }
      }
      if (publicId) {
        await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId })
        })
      }
    } catch (err) {
      console.error("Error deleting image from Cloudinary:", err)
    }
  }

  const handleImageUpload = async (catId: string, file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) {
        console.error("Cloudinary env variables missing")
        return
    }
    
    setIsUploading(true)
    const colorPromise = extractDominantColor(file)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)
    
    try {
      const cat = categories.find(c => c.id === catId)
      if (cat?.emoji?.startsWith("http")) {
        await deleteImageFromCloudinary(cat.emoji)
      }

      const [resp, dominantColor] = await Promise.all([
        fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData }),
        colorPromise
      ])
      const data = await resp.json()
      if (data.secure_url) {
        const transformedUrl = data.secure_url.replace("/upload/", "/upload/c_limit,w_64,h_64,q_auto:best,f_auto/")
        await updateCategory(catId, { emoji: transformedUrl, color: dominantColor })
        setEmojiPickerFor(null)
      }
    } catch (err) { 
        console.error("Upload error:", err) 
    } finally { 
        setIsUploading(false) 
    }
  }

  const handleRemoveImage = async (id: string) => {
    const cat = categories.find(c => c.id === id)
    if (cat?.emoji?.startsWith("http")) {
      await deleteImageFromCloudinary(cat.emoji)
    }
    await updateCategory(id, { emoji: "📌" })
    setEmojiPickerFor(null)
  }

  const handleCategoryDelete = async (id: string) => {
    const cat = categories.find(c => c.id === id)
    if (cat?.emoji?.startsWith("http")) {
      await deleteImageFromCloudinary(cat.emoji)
    }
    await deleteCategory(id)
    if (selectedCategoryId === id) onSelect(null)
    setDeletingCatId(null)
  }

  // Click outside handler
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      
      // Symbol Picker logic
      if (emojiPickerFor && !((target as HTMLElement).closest('[data-emoji-picker]') || (target as HTMLElement).closest('[data-emoji-trigger]'))) {
        setEmojiPickerFor(null)
        setPickerPos(null)
      }
      
      // Context Menu logic
      if (menuOpen && !((target as HTMLElement).closest('[data-cat-menu]'))) {
        setMenuOpen(null)
      }

      // Edit Mode logic
      if (editingCatId && editCatContainerRef.current && !editCatContainerRef.current.contains(target)) {
        if ((target as HTMLElement).closest('[data-emoji-picker]') || (target as HTMLElement).closest('[data-emoji-trigger]')) return
        handleCategoryEditSave(editingCatId)
      }
      
      // Add Mode logic
      if (isAddingCat && newCatRef.current && !newCatRef.current.contains(target)) {
        setIsAddingCat(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [emojiPickerFor, menuOpen, editingCatId, isAddingCat, editCatValue, editCatColor])

  const [minimalMenuOpen, setMinimalMenuOpen] = React.useState(false)
  const minimalRef = React.useRef<HTMLButtonElement>(null)

  // Minimal variant logic:
  if (variant === "minimal") {
    const selectedCat = categories.find(c => c.id === selectedCategoryId)
    return (
      <div className={cn("relative", className)}>
        <button
          ref={minimalRef}
          onClick={() => setMinimalMenuOpen(!minimalMenuOpen)}
          className={cn(
             "w-9 h-9 flex items-center justify-center rounded-xl border transition-all",
             selectedCat ? "bg-white/[0.04] border-white/10" : "bg-white/[0.02] border-white/5 text-zinc-600 hover:text-zinc-400"
          )}
          style={selectedCat ? { color: selectedCat.color, borderColor: `${selectedCat.color}30`, backgroundColor: `${selectedCat.color}10` } : {}}
        >
          {selectedCat ? <CategorySymbol symbol={selectedCat.emoji} className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
        </button>

        {typeof document !== 'undefined' && minimalMenuOpen && createPortal(
          <div className="fixed inset-0 z-[100000]" onClick={() => setMinimalMenuOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-dropdown p-2 rounded-2xl border border-white/10 shadow-2xl min-w-[200px]"
              style={{
                position: 'fixed',
                left: minimalRef.current?.getBoundingClientRect().left,
                bottom: window.innerHeight - (minimalRef.current?.getBoundingClientRect().top || 0) + 8,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1 space-y-1">
                <button
                   onClick={() => { onSelect(null); setMinimalMenuOpen(false) }}
                   className={cn(
                     "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                     !selectedCategoryId ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                   )}
                >
                   <Tag className="w-3.5 h-3.5" /> Kategorisiz
                </button>
                <div className="h-px bg-white/[0.03] my-1" />
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { onSelect(cat.id); setMinimalMenuOpen(false) }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                      selectedCategoryId === cat.id ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                    )}
                    style={selectedCategoryId === cat.id ? { color: cat.color, backgroundColor: `${cat.color}15` } : {}}
                  >
                    <CategorySymbol symbol={cat.emoji} className="w-3.5 h-3.5" />
                    {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Reorder.Group axis="x" values={categories} onReorder={reorderCategories} className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id
          const isEditing = editingCatId === cat.id
          const isHex = cat.color.startsWith("#")
          
          const catStyle = isHex ? { 
            backgroundColor: isSelected || isEditing ? `${cat.color}15` : "transparent", 
            borderColor: isSelected || isEditing ? `${cat.color}35` : "transparent", 
            color: isSelected || isEditing ? cat.color : undefined 
          } : {}
          const colorsClass = !isHex ? (CAT_COLORS_PRESETS[cat.color] || CAT_COLORS_PRESETS.blue) : ""

          if (isEditing) {
            return (
              <div
                key={cat.id}
                ref={editCatContainerRef}
                style={catStyle}
                className="relative inline-flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-xl border border-dashed border-white/20 bg-white/[0.04]"
              >
                <button 
                  type="button"
                  data-emoji-trigger
                  onClick={(e) => {
                    e.stopPropagation()
                    if (emojiPickerFor === cat.id) {
                      setEmojiPickerFor(null)
                      setPickerPos(null)
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const side = rect.bottom > window.innerHeight - 350 ? 'top' : 'bottom'
                      setPickerPos({ 
                        x: rect.left, 
                        y: side === 'top' ? rect.top - 8 : rect.bottom + 8,
                        side 
                      })
                      setEmojiPickerFor(cat.id)
                    }
                  }}
                  className="p-1 hover:bg-white/10 rounded-md transition-all active:scale-90"
                >
                  <CategorySymbol symbol={cat.emoji} className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {/* Symbol Picker Portaled */}
                </AnimatePresence>

                <input
                  ref={editCatRef}
                  value={editCatValue}
                  onChange={(e) => setEditCatValue(e.target.value)}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCategoryEditSave(cat.id)
                    if (e.key === "Escape") setEditingCatId(null)
                    e.stopPropagation()
                  }}
                  className="bg-transparent outline-none border-b border-white/20 min-w-[50px] max-w-[100px] text-zinc-100 font-bold text-[12px]"
                />
                <div className="flex items-center gap-1.5 ml-1">
                  <div className="relative w-4 h-4 rounded-full overflow-hidden border border-white/20">
                    <input
                      type="color"
                      value={editCatColor}
                      onChange={(e) => setEditCatColor(e.target.value)}
                      className="absolute inset-0 w-[150%] h-[150%] -translate-x-[15%] -translate-y-[15%] cursor-pointer border-none p-0 bg-transparent"
                    />
                  </div>
                  <button type="button" onClick={() => handleCategoryEditSave(cat.id)} className="text-emerald-400 hover:scale-110"><Check className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setDeletingCatId(cat.id)} className="text-zinc-500 hover:text-red-400 hover:scale-110"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )
          }

          return (
            <Reorder.Item key={cat.id} value={cat} className="relative">
              <button
                type="button"
                onClick={(e) => handleCategoryClick(cat.id, e)}
                onMouseDown={() => handleMouseDown(cat.id)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={() => handleMouseDown(cat.id)}
                onTouchEnd={handleMouseUp}
                onTouchMove={handleTouchMove}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenuOpen({ 
                    id: cat.id, 
                    x: e.clientX, 
                    y: e.clientY, 
                    rect: e.currentTarget.getBoundingClientRect() 
                  })
                }}
                style={catStyle}
                className={cn(
                  "text-[12px] flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all active:scale-95 group relative",
                  isSelected
                    ? (isHex ? "font-bold border-opacity-40 shadow-lg" : cn(colorsClass, "font-bold"))
                    : "bg-white/[0.02] border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
                )}
              >
                <span
                  data-emoji-trigger
                  className="p-1 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                  onClick={(e) => {
                    if (isSelected) {
                      e.stopPropagation()
                      if (emojiPickerFor === cat.id) {
                        setEmojiPickerFor(null)
                        setPickerPos(null)
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const side = rect.bottom > window.innerHeight - 350 ? 'top' : 'bottom'
                        setPickerPos({ 
                          x: rect.left, 
                          y: side === 'top' ? rect.top - 8 : rect.bottom + 8,
                          side 
                        })
                        setEmojiPickerFor(cat.id)
                      }
                    }
                  }}
                >
                  <CategorySymbol symbol={cat.emoji} className="w-4 h-4" />
                </span>
                <span className="whitespace-nowrap leading-none">{cat.name}</span>
              </button>

              <AnimatePresence>
                {/* Symbol Picker Portaled */}
              </AnimatePresence>
            </Reorder.Item>
          )
        })}

        <AnimatePresence mode="wait">
          {isAddingCat ? (
            <motion.div
              key="add-cat-input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-xl border border-dashed border-white/20 bg-white/[0.04]"
            >
              <input
                ref={newCatRef}
                value={newCatValue}
                onChange={(e) => setNewCatValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCatValue.trim()) handleAddCategory()
                  if (e.key === "Escape") setIsAddingCat(false)
                  e.stopPropagation()
                }}
                placeholder="Yeni..."
                className="bg-transparent outline-none text-zinc-200 placeholder:text-zinc-700 w-20 font-bold"
              />
              <button type="button" onClick={handleAddCategory} className="text-emerald-400 hover:scale-110"><Check className="w-4 h-4" /></button>
              <button type="button" onClick={() => setIsAddingCat(false)} className="text-zinc-600 hover:text-zinc-400"><X className="w-4 h-4" /></button>
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingCat(true)}
              className="flex items-center gap-1.5 text-[11px] px-3.5 py-2 rounded-xl border border-dashed border-white/[0.08] text-zinc-500 hover:border-white/[0.15] hover:text-zinc-300 hover:bg-white/[0.02] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Kategori
            </button>
          )}
        </AnimatePresence>
      </Reorder.Group>

      {/* Symbol Picker Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {emojiPickerFor && pickerPos && (
            <motion.div
              data-emoji-picker
              initial={{ opacity: 0, y: pickerPos.side === 'top' ? 20 : -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: pickerPos.side === 'top' ? 20 : -20, scale: 0.95 }}
              style={{
                position: 'fixed',
                left: Math.min(pickerPos.x, window.innerWidth - 340),
                top: pickerPos.side === 'top' ? 'auto' : pickerPos.y,
                bottom: pickerPos.side === 'top' ? window.innerHeight - pickerPos.y : 'auto',
                zIndex: 99999
              }}
              className={cn(
                "glass-dropdown rounded-3xl p-4 w-[320px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border-white/5 overflow-hidden flex flex-col",
                pickerPos.side === 'top' ? "origin-bottom" : "origin-top"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex bg-white/[0.04] p-1.5 rounded-2xl mb-5 gap-1.5">
                {(["icons", "upload"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setEmojiPickerTab(t)}
                    className={cn(
                      "flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all",
                      emojiPickerTab === t ? "bg-white/10 text-white accent-shadow" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {t === "icons" ? "Simgeler" : "Görsel Yükle"}
                  </button>
                ))}
              </div>
              
              <div className="max-h-[340px] overflow-y-auto custom-scrollbar relative pr-1">
                {emojiPickerTab === "icons" ? (
                  <div className="space-y-5">
                    {SYMBOL_GROUPS.map((group) => (
                      <div key={group.name} className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-zinc-600 px-1">{group.name}</p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {group.icons.map((iconName) => (
                            <button
                              key={iconName}
                              type="button"
                              onClick={() => {
                                const catId = emojiPickerFor
                                if (catId) handleEmojiSelect(catId, iconName)
                                setEmojiPickerFor(null)
                                setPickerPos(null)
                              }}
                              className="flex items-center justify-center h-10 rounded-2xl hover:bg-white/10 text-zinc-500 hover:text-white transition-all hover:scale-105 active:scale-90"
                            >
                              <CategorySymbol symbol={iconName} className="w-5 h-5 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.find(c => c.id === emojiPickerFor)?.emoji?.startsWith("http") && (
                      <div className="bg-white/[0.03] rounded-3xl p-4 border border-white/5 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shadow-lg">
                          <img src={categories.find(c => c.id === emojiPickerFor)?.emoji} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] font-bold text-zinc-200">Aktif Görsel</p>
                          <button 
                            type="button"
                            onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                const catId = emojiPickerFor
                                if (catId) handleRemoveImage(catId) 
                            }}
                            className="text-[11px] font-bold text-rose-500 hover:text-rose-400 mt-0.5 transition-colors"
                          >
                            Görseli Kaldır
                          </button>
                        </div>
                      </div>
                    )}

                    <label className={cn(
                        "group/drop relative flex flex-col items-center justify-center py-10 rounded-3xl border-2 border-dashed border-white/5 transition-all cursor-pointer overflow-hidden",
                        isUploading ? "pointer-events-none" : "hover:border-blue-500/30 hover:bg-blue-500/5",
                        categories.find(c => c.id === emojiPickerFor)?.emoji?.startsWith("http") ? "py-6" : "py-10"
                    )}>
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                          <p className="text-[11px] font-bold text-blue-400/80 animate-pulse">Yükleniyor...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover/drop:text-blue-400 group-hover/drop:scale-110 transition-all duration-300">
                            <ImagePlus className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-zinc-200">{categories.find(c => c.id === emojiPickerFor)?.emoji?.startsWith("http") ? "Görseli Değiştir" : "Özel Simge Yükle"}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">JPG, PNG veya WEBP</p>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          const catId = emojiPickerFor
                          if (file && catId) handleImageUpload(catId, file)
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Category Context Menu Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              data-cat-menu
              style={{
                position: 'fixed',
                left: Math.min(menuOpen.x, typeof window !== 'undefined' ? window.innerWidth - 150 : menuOpen.x),
                top: (typeof window !== 'undefined' && menuOpen.y > window.innerHeight - 150) ? 'auto' : menuOpen.y,
                bottom: (typeof window !== 'undefined' && menuOpen.y > window.innerHeight - 150) ? window.innerHeight - menuOpen.y : 'auto',
                zIndex: 99999
              }}
              className={cn(
                "glass-dropdown rounded-xl p-1.5 min-w-[140px] shadow-2xl border border-white/10 pointer-events-auto",
                (typeof window !== 'undefined' && menuOpen.y > window.innerHeight - 150) ? "origin-bottom" : "origin-top"
              )}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); startEditing(menuOpen.id) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Düzenle
              </button>
              <button
                type="button"
                onClick={(e) => { 
                  e.stopPropagation()
                  const rect = menuOpen.rect
                  const side = rect.bottom > window.innerHeight - 350 ? 'top' : 'bottom'
                  setPickerPos({ 
                    x: rect.left, 
                    y: side === 'top' ? rect.top - 8 : rect.bottom + 8,
                    side 
                  })
                  setEmojiPickerFor(menuOpen.id)
                  setMenuOpen(null)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" /> Simgeyi Değiştir
              </button>
              <div className="h-px bg-white/[0.04] my-1 mx-1" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeletingCatId(menuOpen.id)
                  setMenuOpen(null)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Sil
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingCatId}
        title="Kategoriyi Sil"
        message="Bu kategoriyi sildiğinizde, bu kategoriye ait görevler 'Kategorisiz' olarak kalacaktır. Emin misiniz?"
        confirmText="Evet, Sil"
        isDestructive
        onConfirm={() => {
          if (deletingCatId) {
            handleCategoryDelete(deletingCatId)
          }
        }}
        onCancel={() => setDeletingCatId(null)}
      />
    </div>
  )
}
