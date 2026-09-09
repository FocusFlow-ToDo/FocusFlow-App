"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  Settings,
  Palette,
  Calendar,
  Trash2,
  Check,
  Crown,
  UserCheck,
  Tag,
  Plus,
  AlertTriangle,
  FileText
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import type { SharedProject, SharedCategory } from "@/types"

const PRESET_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#06B6D4"
]

const PRESET_EMOJIS = ["🤝", "🚀", "💡", "⚡", "🎨", "💻", "🔥", "🎯", "🏆", "🌟"]

interface EditSharedProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: SharedProject | null
  onUpdateProject: (
    projectId: string,
    updates: {
      title?: string
      description?: string
      color?: string
      emoji?: string
      targetDate?: string | null
      status?: "planning" | "in_progress" | "completed"
    }
  ) => Promise<any>
  onAddCategory?: (projectId: string, name: string, color: string) => Promise<any>
  onUpdateCategory?: (projectId: string, categoryId: string, updates: { name?: string; color?: string }) => Promise<any>
  onDeleteCategory?: (projectId: string, categoryId: string) => Promise<any>
  onDeleteProject?: (projectId: string) => Promise<any>
}

export function EditSharedProjectModal({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onDeleteProject
}: EditSharedProjectModalProps) {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = React.useState<"general" | "categories" | "danger">("general")

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [color, setColor] = React.useState(PRESET_COLORS[1])
  const [emoji, setEmoji] = React.useState(PRESET_EMOJIS[0])
  const [targetDate, setTargetDate] = React.useState("")
  const [status, setStatus] = React.useState<"planning" | "in_progress" | "completed">("planning")

  // Category management in modal
  const [newCatName, setNewCatName] = React.useState("")
  const [newCatColor, setNewCatColor] = React.useState(PRESET_COLORS[0])
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null)
  const [editingCatName, setEditingCatName] = React.useState("")
  const [editingCatColor, setEditingCatColor] = React.useState("")

  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!project) return
    setTitle(project.title || "")
    setDescription(project.description || "")
    setColor(project.color || PRESET_COLORS[1])
    setEmoji(project.emoji || PRESET_EMOJIS[0])
    setTargetDate(project.targetDate || "")
    setStatus(project.status || "planning")
    setActiveTab("general")
  }, [project, isOpen])

  if (!isOpen || !project) return null

  const isLeader = user?.uid === project.leaderId

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || saving) return

    setSaving(true)
    try {
      await onUpdateProject(project.id, {
        title: title.trim(),
        description: description.trim(),
        color,
        emoji,
        targetDate: targetDate || null,
        status
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim() || !onAddCategory) return
    await onAddCategory(project.id, newCatName.trim(), newCatColor)
    setNewCatName("")
  }

  const handleSaveCategoryEdit = async (catId: string) => {
    if (!editingCatName.trim() || !onUpdateCategory) return
    await onUpdateCategory(project.id, catId, {
      name: editingCatName.trim(),
      color: editingCatColor
    })
    setEditingCatId(null)
  }

  const handleDeleteCategoryConfirm = async (catId: string, catName: string) => {
    if (!onDeleteCategory) return
    if (window.confirm(`"${catName}" alanını silmek istediğinden emin misin? İçindeki görevler Genel Görevler alanına taşınacaktır.`)) {
      await onDeleteCategory(project.id, catId)
    }
  }

  const handleDeleteProjectConfirm = async () => {
    if (!onDeleteProject) return
    if (window.confirm(`"${project.title}" projesini kalıcı olarak silmek istediğinden emin misin? Bu işlem geri alınamaz ve her iki ortak için de proje silinir.`)) {
      await onDeleteProject(project.id)
      onClose()
    }
  }

  const categories = project.categories || []

  return (
    <AnimatePresence>
      <motion.div
        key="edit-shared-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md"
      />
      <div key="edit-shared-modal-wrapper" className="fixed inset-0 z-[121] flex items-start justify-center pt-[8vh] sm:pt-[10vh] px-4 pointer-events-none">
        <motion.div
          key="edit-shared-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="w-full max-w-xl pointer-events-auto bg-[#121217] backdrop-blur-3xl rounded-[32px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col max-h-[84vh]"
        >
          {/* Top Bar with Tabs */}
          <div className="px-6 pt-5 pb-3 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-inner border border-white/10"
                style={{ backgroundColor: `${color}25` }}
              >
                {emoji}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Proje Ayarları & Düzenleme</h3>
                <p className="text-[11px] text-zinc-400">{project.title}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Nav Tabs */}
          <div className="flex items-center px-6 pt-2 border-b border-white/[0.04] bg-white/[0.005] gap-2 text-xs">
            <button
              onClick={() => setActiveTab("general")}
              className={cn(
                "pb-2.5 px-3 font-bold border-b-2 transition-all",
                activeTab === "general"
                  ? "border-purple-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              Genel Bilgiler
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={cn(
                "pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5",
                activeTab === "categories"
                  ? "border-purple-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              <span>Alanlar / Kategoriler</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[10px]">{categories.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("danger")}
              className={cn(
                "pb-2.5 px-3 font-bold border-b-2 transition-all text-red-400/80 hover:text-red-300",
                activeTab === "danger"
                  ? "border-red-500 !text-red-400"
                  : "border-transparent"
              )}
            >
              Tehlikeli Bölge
            </button>
          </div>

          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <form onSubmit={handleSaveGeneral} className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-4 flex-1">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Proje Başlığı
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Proje adını girin..."
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Açıklama & Hedef
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Bu ortak projede amacınız ne?..."
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/50 resize-none transition-colors"
                  />
                </div>

                {/* Status & Target Date Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <span>Proje Durumu</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50 cursor-pointer"
                    >
                      <option value="planning" className="bg-zinc-900 text-white">📌 Planlama Aşamasında</option>
                      <option value="in_progress" className="bg-zinc-900 text-white">⚡ Devam Ediyor</option>
                      <option value="completed" className="bg-zinc-900 text-white">✅ Tamamlandı</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Hedef Tarih</span>
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {/* Emoji Selector */}
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Proje Simgesi (Emoji)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setEmoji(em)}
                        className={cn(
                          "w-9 h-9 rounded-2xl text-base flex items-center justify-center transition-all",
                          emoji === em
                            ? "bg-purple-500/20 border border-purple-500 scale-110 shadow-lg"
                            : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08]"
                        )}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    <span>Tema Rengi</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-7 h-7 rounded-full transition-all duration-200",
                          color === c ? "scale-125 ring-2 ring-white shadow-md" : "opacity-60 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Members Info Box */}
                <div className="pt-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Proje Ortakları
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-black text-purple-300 overflow-hidden">
                        {project.leaderPhotoURL ? (
                          <img src={project.leaderPhotoURL} alt={project.leaderName} className="w-full h-full object-cover" />
                        ) : (
                          project.leaderName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{project.leaderName}</span>
                          <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        </p>
                        <p className="text-[9px] text-zinc-500">Proje Lideri</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-black text-blue-300 overflow-hidden">
                        {project.memberPhotoURL ? (
                          <img src={project.memberPhotoURL} alt={project.memberName} className="w-full h-full object-cover" />
                        ) : (
                          project.memberName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{project.memberName}</span>
                          <UserCheck className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                        </p>
                        <p className="text-[9px] text-zinc-500">
                          {project.inviteStatus === "accepted" ? "Ortak Üye" : "Davet Bekleniyor"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.04] bg-white/[0.01]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || saving}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all flex items-center gap-2 active:scale-95"
                >
                  {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet ✅"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CATEGORIES MANAGEMENT */}
          {activeTab === "categories" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Planlayıcı Kolonları & Alanlar</h4>
                  <p className="text-[10px] text-zinc-500">Ortak projede görevlerin gruplandığı kategorileri yönetin.</p>
                </div>
              </div>

              {/* Add New Category inline */}
              <form onSubmit={handleCreateCategory} className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/5">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Yeni kategori/alan adı..."
                  className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder:text-zinc-600 outline-none"
                />
                <div className="flex items-center gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full transition-all",
                        newCatColor === c ? "scale-125 ring-1 ring-white" : "opacity-60 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold disabled:opacity-40 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </form>

              {/* Categories list */}
              <div className="space-y-2">
                {categories.map((cat) => {
                  const isEditing = editingCatId === cat.id
                  const taskCount = (project.tasks || []).filter(t => t.categoryId === cat.id).length

                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2 mr-2">
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white outline-none"
                          />
                          <div className="flex items-center gap-1">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditingCatColor(c)}
                                className={cn(
                                  "w-4 h-4 rounded-full",
                                  editingCatColor === c ? "ring-1 ring-white scale-110" : "opacity-60"
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <button
                            onClick={() => handleSaveCategoryEdit(cat.id)}
                            className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="p-1 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                            style={{ backgroundColor: cat.color, color: cat.color }}
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{cat.name}</p>
                            <p className="text-[10px] text-zinc-500">{taskCount} görev bu alanda</p>
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCatId(cat.id)
                              setEditingCatName(cat.name)
                              setEditingCatColor(cat.color)
                            }}
                            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteCategoryConfirm(cat.id, cat.name)}
                            className="p-1.5 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DANGER ZONE */}
          {activeTab === "danger" && (
            <div className="flex-1 p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="text-xs font-black uppercase tracking-wider">Projeyi Kalıcı Olarak Sil</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bu projeyi sildiğinizde, içindeki tüm görevler, kategoriler ve aktivite geçmişi her iki taraf için de tamamen silinir ve geri alınamaz.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleDeleteProjectConfirm}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Evet, Bu Projeyi Kalıcı Olarak Sil</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
