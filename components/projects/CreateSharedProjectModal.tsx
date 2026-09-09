"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  Users,
  Sparkles,
  Check,
  Search,
  Calendar,
  FileText,
  Palette,
  Flag,
  UserCheck
} from "lucide-react"
import { db } from "@/firebase/config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"
import { useToast } from "@/contexts/ToastContext"
import { cn } from "@/lib/utils"

const PRESET_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#06B6D4"
]

const PRESET_EMOJIS = ["🤝", "🚀", "💡", "⚡", "🎨", "💻", "🔥", "🎯", "🏆", "🌟"]

interface FriendProfile {
  uid: string
  displayName: string
  photoURL?: string | null
  level?: number
  rank?: string
}

interface CreateSharedProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: {
    title: string
    description: string
    color: string
    emoji: string
    targetDate?: string | null
    friendUid: string
    friendName: string
    friendPhotoURL?: string | null
  }) => Promise<any>
}

export function CreateSharedProjectModal({
  isOpen,
  onClose,
  onCreate
}: CreateSharedProjectModalProps) {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { showToast } = useToast()

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [color, setColor] = React.useState(PRESET_COLORS[1]) // Purple
  const [emoji, setEmoji] = React.useState(PRESET_EMOJIS[0])
  const [targetDate, setTargetDate] = React.useState("")

  const [friendsList, setFriendsList] = React.useState<FriendProfile[]>([])
  const [loadingFriends, setLoadingFriends] = React.useState(false)
  const [selectedFriend, setSelectedFriend] = React.useState<FriendProfile | null>(null)
  const [friendSearch, setFriendSearch] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Fetch available friends and community members
  React.useEffect(() => {
    if (!isOpen || !user) return

    setTitle("")
    setDescription("")
    setColor(PRESET_COLORS[1])
    setEmoji(PRESET_EMOJIS[0])
    setTargetDate("")
    setFriendSearch("")
    setTimeout(() => inputRef.current?.focus(), 50)

    async function loadFriends() {
      setLoadingFriends(true)
      try {
        const friendUids = (settings.friends || []).filter((id) => id && id !== user?.uid)
        const foundFriends: FriendProfile[] = []

        // If user has saved friends, fetch their profiles
        for (const fUid of friendUids) {
          try {
            const pSnap = await getDoc(doc(db, "publicProfiles", fUid))
            if (pSnap.exists()) {
              const data = pSnap.data()
              foundFriends.push({
                uid: fUid,
                displayName: data.displayName || "Kullanıcı",
                photoURL: data.photoURL || null,
                level: data.level || 1,
                rank: data.rank || "Çaylak"
              })
            }
          } catch {}
        }

        // Also fetch from publicProfiles as fallback/suggestion if list is short
        if (foundFriends.length < 5) {
          const allProfilesSnap = await getDocs(collection(db, "publicProfiles"))
          allProfilesSnap.forEach((docSnap) => {
            if (docSnap.id !== user?.uid && !foundFriends.some((f) => f.uid === docSnap.id)) {
              const data = docSnap.data()
              foundFriends.push({
                uid: docSnap.id,
                displayName: data.displayName || "Kullanıcı",
                photoURL: data.photoURL || null,
                level: data.level || 1,
                rank: data.rank || "Çaylak"
              })
            }
          })
        }

        setFriendsList(foundFriends)
        if (foundFriends.length > 0) {
          setSelectedFriend(foundFriends[0])
        }
      } catch (err) {
        console.error("Error loading friends:", err)
      } finally {
        setLoadingFriends(false)
      }
    }

    loadFriends()
  }, [isOpen, user, settings.friends])

  const filteredFriends = React.useMemo(() => {
    if (!friendSearch.trim()) return friendsList
    const q = friendSearch.toLowerCase()
    return friendsList.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        (f.rank && f.rank.toLowerCase().includes(q))
    )
  }, [friendsList, friendSearch])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim()) {
      showToast({ type: "error", message: "Lütfen bir proje başlığı girin." })
      return
    }
    if (!selectedFriend) {
      showToast({ type: "error", message: "Lütfen projeye ortak olacak arkadaşını seç." })
      return
    }

    setSubmitting(true)
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        color,
        emoji,
        targetDate: targetDate || null,
        friendUid: selectedFriend.uid,
        friendName: selectedFriend.displayName,
        friendPhotoURL: selectedFriend.photoURL
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[111] flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onKeyDown={handleKeyDown}
              className="w-full max-w-xl pointer-events-auto bg-[#121217] backdrop-blur-3xl rounded-[32px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col max-h-[82vh]"
            >
              {/* Top Input Header (matches QuickTaskModal) */}
              <div className="flex items-center px-6 h-18 sm:h-20 gap-3.5 border-b border-white/[0.04] bg-white/[0.01]">
                <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-2.5 py-1.5 hover:bg-white/[0.08] transition-colors">
                  <span className="text-2xl">{emoji}</span>
                  <select
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none cursor-pointer"
                  >
                    {PRESET_EMOJIS.map((em) => (
                      <option key={em} value={em} className="bg-zinc-900 text-white">
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder="Ortak proje veya hedef başlığı..."
                  className="flex-1 bg-transparent text-white placeholder:text-zinc-500 outline-none text-[17px] font-medium"
                />

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/[0.04]">
                    <kbd className="opacity-60 font-mono">ENTER</kbd>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Form Body */}
              <div className="px-6 py-5 overflow-y-auto custom-scrollbar space-y-5 flex-1">
                {/* Description */}
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                    <FileText className="w-3 h-3" /> Açıklama & Hedefler
                  </p>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Bu ortak projede birlikte neyi başarmayı hedefliyorsunuz?"
                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/50 resize-none transition-colors"
                  />
                </div>

                {/* Friend / Partner Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-0.5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Proje Ortağı Seç
                    </p>
                    <span className="text-[10px] text-purple-400 font-bold">Gerçek zamanlı davet gönderilir</span>
                  </div>

                  {friendsList.length > 3 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Arkadaş ara..."
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none"
                      />
                    </div>
                  )}

                  <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {loadingFriends ? (
                      <div className="text-center py-4 text-xs text-zinc-500">Arkadaşlar yükleniyor...</div>
                    ) : filteredFriends.length === 0 ? (
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-500">
                        Seçilecek arkadaş bulunamadı. Topluluk sekmesinden arkadaş ekleyebilirsin.
                      </div>
                    ) : (
                      filteredFriends.map((f) => {
                        const isSelected = selectedFriend?.uid === f.uid
                        return (
                          <div
                            key={f.uid}
                            onClick={() => setSelectedFriend(f)}
                            className={cn(
                              "flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all",
                              isSelected
                                ? "bg-purple-500/15 border-purple-500/50 text-white shadow-sm"
                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-zinc-400 hover:text-zinc-200"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-xs text-purple-300 overflow-hidden">
                                {f.photoURL ? (
                                  <img src={f.photoURL} alt={f.displayName} className="w-full h-full object-cover" />
                                ) : (
                                  f.displayName.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{f.displayName}</p>
                                <p className="text-[10px] text-zinc-500">Lv. {f.level || 1} • {f.rank || "Üye"}</p>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Color & Target Date Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Color theme */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                      <Palette className="w-3 h-3" /> Renk Teması
                    </p>
                    <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] rounded-xl border border-white/[0.05] w-fit">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-transform duration-200",
                            color === c ? "scale-125 ring-2 ring-white shadow-md" : "opacity-60 hover:opacity-100"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Target Date */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5 px-0.5">
                      <Calendar className="w-3 h-3" /> Hedef Tarih
                    </p>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50 transition-colors"
                    />
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
                  Vazgeç
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !title.trim() || !selectedFriend}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all flex items-center gap-2 active:scale-95"
                >
                  {submitting ? "Davet Gönderiliyor..." : "Davet Gönder & Başlat 🚀"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
