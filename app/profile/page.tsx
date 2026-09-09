"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  User, Shield, Flame, Trophy, Award, Clock, CheckCircle2,
  Sparkles, Coins, Users, HeartHandshake, UserPlus, UserMinus,
  Pencil, Calendar, Hexagon, ArrowLeft, Gem, Star, Crown,
  Check, X, Eye, Package, Tag, Zap, Camera, RefreshCw
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"
import { useTasks } from "@/hooks/useTasks"
import { useToast } from "@/contexts/ToastContext"
import { calculateUserStats, getRankData } from "@/lib/stats"
import { BADGES, BADGE_MAP } from "@/lib/badges"
import { SHOP_ITEMS, FRAME_STYLES, ShopItem } from "@/hooks/useShop"
import { ProfileEffectOverlay } from "@/components/shop/ProfileEffectOverlay"
import { db } from "@/firebase/config"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const searchParams = useSearchParams()
  const targetUid = searchParams.get("uid")
  const router = useRouter()
  const { user } = useAuth()
  const { settings, updateSettings } = useSettings()
  const { rawTasks } = useTasks()
  const { showToast } = useToast()

  const isOwnProfile = !targetUid || targetUid === user?.uid
  const [profileData, setProfileData] = React.useState<any>(null)
  const [loadingProfile, setLoadingProfile] = React.useState(true)

  // ── EDIT PROFILE STUDIO MODAL STATE ──
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [activeEditTab, setActiveEditTab] = React.useState<"general" | "frames" | "effects" | "titles" | "badges">("general")
  const [editName, setEditName] = React.useState("")
  const [editBio, setEditBio] = React.useState("")
  const [editPhotoURL, setEditPhotoURL] = React.useState("")
  const [editFrame, setEditFrame] = React.useState<string | null>(null)
  const [editEffect, setEditEffect] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState<string | null>(null)
  const [editBadges, setEditBadges] = React.useState<(string | null)[]>([null, null, null])
  const [activeBadgeSlot, setActiveBadgeSlot] = React.useState<number>(0)
  const [isSaving, setIsSaving] = React.useState(false)

  const myStats = React.useMemo(() => {
    return calculateUserStats(rawTasks)
  }, [rawTasks])

  // All inventory items user owns (including items from purchased bundles)
  const allOwnedItemIds = React.useMemo(() => {
    const set = new Set(settings.inventory || [])
    SHOP_ITEMS.filter(i => i.category === "bundle" && set.has(i.id)).forEach(b => {
      b.bundleItemIds?.forEach(id => set.add(id))
    })
    return set
  }, [settings.inventory])

  // Owned cosmetics by category
  const ownedFrames = React.useMemo(() => {
    return SHOP_ITEMS.filter(i => i.category === "frame" && allOwnedItemIds.has(i.id))
  }, [allOwnedItemIds])

  const ownedEffects = React.useMemo(() => {
    return SHOP_ITEMS.filter(i => i.category === "effect" && allOwnedItemIds.has(i.id))
  }, [allOwnedItemIds])

  const ownedTitles = React.useMemo(() => {
    return SHOP_ITEMS.filter(i => i.category === "title" && allOwnedItemIds.has(i.id))
  }, [allOwnedItemIds])

  // Fetch target profile if viewing someone else
  React.useEffect(() => {
    if (isOwnProfile) {
      if (user) {
        setProfileData({
          uid: user.uid,
          displayName: user.displayName || "FocusFlow Kullanıcısı",
          photoURL: user.photoURL || null,
          bio: settings.bio || "",
          level: myStats.level,
          rankName: myStats.rankName,
          rankColor: myStats.rankColor,
          totalXP: myStats.totalXP,
          completedTotal: myStats.completedTotal,
          focusMinsTotal: myStats.focusMinsTotal,
          currentStreak: settings.streakCount || myStats.currentStreak,
          streakFreezes: settings.streakFreezes ?? 3,
          focusCoins: settings.focusCoins ?? 100,
          equippedFrame: settings.equippedFrame,
          equippedTitle: settings.equippedTitle,
          equippedProfileEffect: settings.equippedProfileEffect,
          showcaseBadges: settings.showcaseBadges || [null, null, null],
          earnedBadges: settings.earnedBadges || [],
          friends: settings.friends || []
        })
      }
      setLoadingProfile(false)
    } else if (targetUid) {
      setLoadingProfile(true)
      getDoc(doc(db, "publicProfiles", targetUid))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data()
            const rank = getRankData(data.level || 1)
            setProfileData({
              uid: targetUid,
              ...data,
              rankName: rank.name,
              rankColor: rank.color
            })
          } else {
            showToast({ type: "error", message: "Kullanıcı profili bulunamadı." })
          }
          setLoadingProfile(false)
        })
        .catch(() => {
          setLoadingProfile(false)
          showToast({ type: "error", message: "Profil yüklenirken hata oluştu." })
        })
    }
  }, [isOwnProfile, targetUid, user, myStats, settings, showToast])

  const isFriend = React.useMemo(() => {
    if (!targetUid || isOwnProfile) return false
    return (settings.friends || []).includes(targetUid)
  }, [targetUid, isOwnProfile, settings.friends])

  const toggleFriend = async () => {
    if (!targetUid || !user) return
    const currentFriends = settings.friends || []
    let nextFriends: string[]

    if (isFriend) {
      nextFriends = currentFriends.filter(id => id !== targetUid)
      showToast({ type: "info", message: "Arkadaşlıktan çıkarıldı" })
    } else {
      nextFriends = [...currentFriends, targetUid]
      showToast({ type: "success", message: "🎉 Arkadaş olarak eklendi!" })
    }

    updateSettings({ friends: nextFriends })
  }

  // Open Edit Modal with prefilled values
  const openEditModal = () => {
    setEditName(user?.displayName || profileData?.displayName || "")
    setEditBio(settings.bio || profileData?.bio || "")
    setEditPhotoURL(user?.photoURL || profileData?.photoURL || "")
    setEditFrame(settings.equippedFrame || null)
    setEditEffect(settings.equippedProfileEffect || null)
    setEditTitle(settings.equippedTitle || null)
    setEditBadges(settings.showcaseBadges && settings.showcaseBadges.length === 3 ? [...settings.showcaseBadges] : [null, null, null])
    setActiveEditTab("general")
    setActiveBadgeSlot(0)
    setIsEditModalOpen(true)
  }

  // Save all profile customizations (Cosmetics + Info + Firestore sync)
  const handleSaveFullProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!editName.trim() || !user) {
      showToast({ type: "error", message: "Lütfen geçerli bir isim giriniz." })
      return
    }

    setIsSaving(true)
    try {
      // 1. Update local Settings
      updateSettings({
        equippedFrame: editFrame,
        equippedProfileEffect: editEffect,
        equippedTitle: editTitle,
        bio: editBio.trim(),
        showcaseBadges: editBadges
      })

      // 2. Update Firebase Auth displayName & photoURL if changed
      try {
        const { updateProfile } = await import("firebase/auth")
        await updateProfile(user, {
          displayName: editName.trim(),
          photoURL: editPhotoURL.trim() || null
        })
      } catch (authErr) {
        console.warn("Auth update profile err:", authErr)
      }

      // 3. Sync to publicProfiles for Community Page visibility
      await setDoc(
        doc(db, "publicProfiles", user.uid),
        {
          displayName: editName.trim(),
          bio: editBio.trim(),
          photoURL: editPhotoURL.trim() || null,
          equippedFrame: editFrame,
          equippedProfileEffect: editEffect,
          equippedTitle: editTitle,
          showcaseBadges: editBadges,
          level: myStats.level,
          rankName: myStats.rankName,
          rankColor: myStats.rankColor,
          currentStreak: settings.streakCount || myStats.currentStreak,
          totalXP: myStats.totalXP,
          completedTotal: myStats.completedTotal,
          focusMinsTotal: myStats.focusMinsTotal,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )

      // 4. Update local state
      setProfileData((prev: any) => ({
        ...prev,
        displayName: editName.trim(),
        bio: editBio.trim(),
        photoURL: editPhotoURL.trim() || null,
        equippedFrame: editFrame,
        equippedProfileEffect: editEffect,
        equippedTitle: editTitle,
        showcaseBadges: editBadges
      }))

      // 5. Celebration Confetti
      try {
        const confetti = (await import("canvas-confetti")).default
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        })
      } catch (_) {}

      showToast({
        type: "success",
        message: "Profilin ve seçtiğin tüm eşyalar başarıyla güncellendi! 🎉"
      })
      setIsEditModalOpen(false)
    } catch (err) {
      console.error("Profile save error:", err)
      showToast({ type: "error", message: "Profil kaydedilirken bir hata oluştu." })
    } finally {
      setIsSaving(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#080b12]">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#080b12]">
        <User className="w-12 h-12 text-zinc-600 mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Profil Bulunamadı</h2>
        <button
          onClick={() => router.push("/community")}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors"
        >
          Topluluğa Dön
        </button>
      </div>
    )
  }

  const initial = profileData.displayName?.charAt(0)?.toUpperCase() || "FF"
  const currentFrame = profileData.equippedFrame || (isOwnProfile ? settings.equippedFrame : null)
  const currentEffect = profileData.equippedProfileEffect || (isOwnProfile ? settings.equippedProfileEffect : null)
  const currentTitle = profileData.equippedTitle || (isOwnProfile ? settings.equippedTitle : null)
  const currentBio = profileData.bio || (isOwnProfile ? settings.bio : null)
  const currentBadges = profileData.showcaseBadges || (isOwnProfile ? settings.showcaseBadges : [null, null, null])

  return (
    <div className="h-full flex flex-col relative overflow-y-auto custom-scrollbar select-none bg-[#080b12] text-zinc-100 selection:bg-indigo-500/30">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-40 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8 relative z-10 pb-24">
        
        {/* Back Button if viewing another user's profile */}
        {!isOwnProfile && (
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri Dön</span>
          </button>
        )}

        {/* ─────────────────────────────────────────────────────────────
            1. HERO PROFILE CARD (MATCHES SHOP TRY-ON STUDIO 1:1)
        ───────────────────────────────────────────────────────────── */}
        <div className="relative rounded-3xl border border-white/15 bg-[#181c2b] shadow-2xl overflow-hidden group">
          {/* Top FocusFlow Banner with ProfileEffectOverlay */}
          <div className="relative h-36 sm:h-40 w-full bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900/80 overflow-hidden">
            {/* Live Profile Effect */}
            <ProfileEffectOverlay effectId={currentEffect} />

            {/* Banner Tag */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[11px] font-mono text-zinc-300 shadow-lg">
              <span>FocusFlow Profil Görünümü</span>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-6 pb-6 pt-0 relative z-20 bg-[#121522]">
            {/* Avatar row overlapping banner */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-end -mt-14 mb-3 gap-4">
              <div className="flex items-end gap-4">
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "w-24 h-24 rounded-full bg-zinc-900 p-1 flex items-center justify-center shadow-2xl transition-all duration-300 border-4 overflow-hidden",
                      currentFrame && FRAME_STYLES[currentFrame]
                        ? FRAME_STYLES[currentFrame]
                        : "border-[#121522]"
                    )}
                  >
                    {profileData.photoURL ? (
                      <img
                        src={profileData.photoURL}
                        alt="Profil Fotoğrafı"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl font-black shadow-inner">
                        {initial}
                      </div>
                    )}
                  </div>

                  {/* Level Badge on Avatar */}
                  <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/20 text-[10px] font-black uppercase text-amber-400 shadow-lg">
                    LvL {profileData.level || 1}
                  </div>

                  {/* Online Status Dot */}
                  <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121522] shadow-[0_0_8px_#10b981]" />
                </div>

                {/* Quick Active Effect & Frame Badges */}
                <div className="hidden sm:flex flex-wrap items-center gap-2 pb-1">
                  {currentEffect && (
                    <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Efekt: {SHOP_ITEMS.find((it) => it.id === currentEffect)?.name || "Özel"}</span>
                    </div>
                  )}
                  {currentFrame && (
                    <div className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-1.5 shadow-sm">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Çerçeve: {SHOP_ITEMS.find((it) => it.id === currentFrame)?.name || "Özel"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button: Edit Profile or Add/Remove Friend */}
              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <button
                    onClick={openEditModal}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Profili Düzenle</span>
                  </button>
                ) : (
                  <button
                    onClick={toggleFriend}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer",
                      isFriend
                        ? "bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                        : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
                    )}
                  >
                    {isFriend ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{isFriend ? "Arkadaşlıktan Çıkar" : "Arkadaş Ekle"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Name, Rank & Streak */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profileData.displayName || "FocusFlow Kullanıcısı"}
                </h1>
                <span className="px-2 py-0.5 rounded bg-indigo-500/25 border border-indigo-500/40 text-[10px] font-bold text-indigo-300">
                  PRO
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold">
                  <Hexagon className={cn("w-3.5 h-3.5", profileData.rankColor || "text-blue-400")} />
                  <span className={profileData.rankColor || "text-blue-400"}>
                    {profileData.rankName || "Çırak"}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-amber-500/25 border border-amber-500/40 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span>{profileData.currentStreak || 0} Gün Seri</span>
                </span>
              </div>

              {/* Equipped Title Pill */}
              {currentTitle && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentTitle}</span>
                </div>
              )}

              {/* Real Showcase Badges */}
              {currentBadges && currentBadges.some((b: any) => b !== null) && (
                <div className="flex items-center gap-2 pt-1">
                  {currentBadges.map((badgeId: string | null, bIdx: number) => {
                    if (!badgeId) return null
                    const badge = BADGES.find((b) => b.id === badgeId) || BADGE_MAP[badgeId]
                    if (!badge) return null
                    const IconComponent = badge.icon
                    return (
                      <div
                        key={bIdx}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm",
                          badge.color || "bg-white/10 border-white/10"
                        )}
                        title={badge.name}
                      >
                        <IconComponent className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Status / Bio */}
              <div className="pt-2 text-xs text-zinc-400 border-t border-white/5 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="italic text-zinc-300">
                  {currentBio || "🚀 FocusFlow ile hiper odak modunda. Görevleri tamamlayarak ligde yükseliyor!"}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                  Kullanıcı Kodu: #{profileData.uid ? profileData.uid.slice(0, 6) : "oyuncu"}
                </span>
              </div>
            </div>

            {/* Coins & Streak Freezes (Shown for own profile) */}
            {isOwnProfile && (
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/shop")}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 hover:border-amber-400 text-amber-300 font-bold text-xs shadow-inner transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                  title="Mağazaya Git ve Harca"
                >
                  <Coins className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>{profileData.focusCoins} Focus Para</span>
                  <span className="text-[10px] text-amber-300/80 font-normal pl-0.5 group-hover:translate-x-0.5 transition-transform">→ Mağaza</span>
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-xs shadow-inner">
                  <span>❄️ {profileData.streakFreezes} Dondurma Hakkı</span>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Toplam XP</span>
                </div>
                <div className="text-xl font-black text-white">{profileData.totalXP?.toLocaleString() || 0}</div>
              </div>

              <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tamamlanan</span>
                </div>
                <div className="text-xl font-black text-white">{profileData.completedTotal || 0} <span className="text-xs text-zinc-500 font-normal">görev</span></div>
              </div>

              <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>Seri (Streak)</span>
                </div>
                <div className="text-xl font-black text-orange-400">{profileData.currentStreak || 0} <span className="text-xs text-zinc-500 font-normal">gün</span></div>
              </div>

              <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Odak Süresi</span>
                </div>
                <div className="text-xl font-black text-blue-400">
                  {Math.floor((profileData.focusMinsTotal || 0) / 60)}s {(profileData.focusMinsTotal || 0) % 60}d
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. SHOWCASE BADGES SECTION (GURUR TABLOSU)
        ───────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gurur Tablosu (Vitrin Rozetleri)</span>
            </h3>
            {isOwnProfile && (
              <button 
                onClick={openEditModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
              >
                Rozetleri Değiştir →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(currentBadges || [null, null, null]).map((badgeId: string | null, i: number) => {
              const b = badgeId ? (BADGES.find(it => it.id === badgeId) || BADGE_MAP[badgeId]) : null
              const Icon = b?.icon || Star

              return (
                <div
                  key={i}
                  className={cn(
                    "p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300",
                    b
                      ? "bg-white/[0.03] border-white/10 hover:border-white/20 hover:scale-[1.02] shadow-xl"
                      : "bg-white/[0.01] border-dashed border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border",
                    b ? "bg-white/5 border-white/10" : "border-dashed border-white/10 text-zinc-600"
                  )}>
                    <Icon className={cn("w-6 h-6", b ? "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-zinc-700")} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{b ? b.name : `Boş Vitrin Yuvası #${i + 1}`}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">
                      {b ? b.desc : "Profili düzenle kısmından kazandığın bir rozeti vitrine koyabilirsin."}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. FRIENDS / SOCIAL SECTION
        ───────────────────────────────────────────────────────────── */}
        {isOwnProfile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-400" />
                <span>Arkadaşlarım ({(settings.friends || []).length})</span>
              </h3>
              <button 
                onClick={() => router.push("/community")}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
              >
                Toplulukta Arkadaş Bul →
              </button>
            </div>

            {(settings.friends || []).length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-white/5 bg-white/[0.01]">
                <HeartHandshake className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-400">Henüz arkadaş eklemedin</p>
                <p className="text-[11px] text-zinc-600 mt-1">Topluluk sayfasındaki diğer kullanıcıları inceleyip arkadaş ekleyebilirsin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(settings.friends || []).map((fUid: string) => (
                  <div
                    key={fUid}
                    onClick={() => router.push(`/profile?uid=${fUid}`)}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-white/15"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                        {fUid.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-zinc-300 truncate">Kullanıcı #{fUid.slice(0, 6)}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">Profili Gör →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. COMPREHENSIVE PROFILE EDIT STUDIO MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0e111d] border border-white/15 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">FocusFlow Profil Stüdyosu</h3>
                    <p className="text-[11px] text-zinc-400">Kimliğini, envanterindeki eşyaları ve vitrinini canlı olarak düzenle</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Scrollable */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                
                {/* ── TOP LIVE PREVIEW CARD (REAL-TIME REACTIVE) ── */}
                <div className="rounded-2xl border border-indigo-500/30 bg-[#161a2b] shadow-xl overflow-hidden">
                  <div className="relative h-28 w-full bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-900/90 overflow-hidden">
                    {/* Live Preview Effect Overlay */}
                    <ProfileEffectOverlay effectId={editEffect} />
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-300">
                      <Eye className="w-3 h-3" />
                      <span>Canlı Önizleme</span>
                    </div>
                  </div>

                  <div className="px-5 pb-4 pt-0 relative z-20 bg-[#121522]">
                    <div className="flex justify-between items-end -mt-10 mb-2">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-20 h-20 rounded-full bg-zinc-900 p-1 flex items-center justify-center shadow-2xl transition-all duration-300 border-4 overflow-hidden",
                            editFrame && FRAME_STYLES[editFrame]
                              ? FRAME_STYLES[editFrame]
                              : "border-[#121522]"
                          )}
                        >
                          {editPhotoURL ? (
                            <img src={editPhotoURL} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-xl font-black">
                              {editName ? editName.charAt(0).toUpperCase() : initial}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-zinc-900 border border-white/20 text-[9px] font-black text-amber-400">
                          LvL {myStats.level || 1}
                        </div>
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#121522] shadow-[0_0_8px_#10b981]" />
                      </div>

                      <div className="flex items-center gap-1.5 pb-1">
                        {editEffect && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {SHOP_ITEMS.find((it) => it.id === editEffect)?.name || "Efekt"}
                          </span>
                        )}
                        {editFrame && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            {SHOP_ITEMS.find((it) => it.id === editFrame)?.name || "Çerçeve"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-white tracking-tight">
                          {editName.trim() || "Görünen İsim"}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/25 text-[9px] font-bold text-indigo-300">
                          PRO
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.2 rounded bg-white/5 text-[10px] font-bold">
                          <Hexagon className={cn("w-3 h-3", myStats.rankColor)} />
                          <span className={myStats.rankColor}>{myStats.rankName}</span>
                        </div>
                      </div>

                      {editTitle && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-semibold">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>{editTitle}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-zinc-400 italic line-clamp-1 pt-1">
                        {editBio.trim() || "🚀 FocusFlow ile hiper odak modunda..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── STUDIO TABS ── */}
                <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 overflow-x-auto custom-scrollbar">
                  {[
                    { id: "general", label: "Kimlik & Bilgi", icon: User },
                    { id: "frames", label: `Çerçeveler (${ownedFrames.length})`, icon: Crown },
                    { id: "effects", label: `Efektler (${ownedEffects.length})`, icon: Sparkles },
                    { id: "titles", label: `Unvanlar (${ownedTitles.length})`, icon: Tag },
                    { id: "badges", label: "Vitrin Rozetleri", icon: Award }
                  ].map((tab) => {
                    const TabIcon = tab.icon
                    const isActive = activeEditTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveEditTab(tab.id as any)}
                        className={cn(
                          "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                          isActive
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                            : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* ── TAB CONTENT ── */}
                {/* 1. GENERAL TAB */}
                {activeEditTab === "general" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">Görünen İsim</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                        placeholder="Adınız veya kullanıcı adınız..."
                        maxLength={32}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">Durum / Biyografi Sözü</label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors resize-none"
                        placeholder="Kendini ifade eden kısa bir motivasyon sözü veya motto..."
                        maxLength={120}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">Profil Fotoğrafı URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={editPhotoURL}
                          onChange={(e) => setEditPhotoURL(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                          placeholder="https://example.com/avatar.jpg"
                        />
                        {editPhotoURL && (
                          <button
                            type="button"
                            onClick={() => setEditPhotoURL("")}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-zinc-400 hover:text-white"
                          >
                            Kaldır
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">İpucu: Discord veya GitHub profil resminizin bağlantısını yapıştırabilirsiniz.</p>
                    </div>
                  </div>
                )}

                {/* 2. FRAMES TAB */}
                {activeEditTab === "frames" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Çerçeve Yok (Varsayılan) */}
                      <div
                        onClick={() => setEditFrame(null)}
                        className={cn(
                          "p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                          editFrame === null
                            ? "bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/40"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-zinc-500 text-xs">
                            Yok
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">Çerçeve Yok</div>
                            <div className="text-[10px] text-zinc-500">Sade varsayılan profil</div>
                          </div>
                        </div>
                        {editFrame === null && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>

                      {/* Owned Frames */}
                      {ownedFrames.map((frame) => {
                        const isSelected = editFrame === frame.id
                        return (
                          <div
                            key={frame.id}
                            onClick={() => setEditFrame(frame.id)}
                            className={cn(
                              "p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                              isSelected
                                ? "bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/40"
                                : "bg-white/[0.02] border-white/10 hover:border-white/20"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-12 h-12 rounded-full p-0.5 flex items-center justify-center border-2",
                                  FRAME_STYLES[frame.id] || "border-white/20"
                                )}
                              >
                                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold">
                                  {initial}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>{frame.name}</span>
                                </div>
                                <div className="text-[10px] text-zinc-400 line-clamp-1">{frame.desc}</div>
                              </div>
                            </div>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-bold shrink-0">Seç</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {ownedFrames.length === 0 && (
                      <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-2">
                        <Package className="w-8 h-8 text-zinc-600 mx-auto" />
                        <p className="text-xs font-bold text-zinc-300">Envanterinde henüz özel çerçeve yok</p>
                        <p className="text-[11px] text-zinc-500">Mağazadan FocusFlow Paralarınla harika siberpunk, altın veya anime çerçeveler alabilirsin.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditModalOpen(false)
                            router.push("/shop")
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/40"
                        >
                          Mağazayı Ziyaret Et →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. EFFECTS TAB */}
                {activeEditTab === "effects" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Efekt Yok */}
                      <div
                        onClick={() => setEditEffect(null)}
                        className={cn(
                          "p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                          editEffect === null
                            ? "bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/40"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center text-zinc-500 text-xs">
                            Yok
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">Efekt Yok</div>
                            <div className="text-[10px] text-zinc-500">Animasyonsuz sade kart</div>
                          </div>
                        </div>
                        {editEffect === null && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>

                      {/* Owned Effects */}
                      {ownedEffects.map((eff) => {
                        const isSelected = editEffect === eff.id
                        return (
                          <div
                            key={eff.id}
                            onClick={() => setEditEffect(eff.id)}
                            className={cn(
                              "p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all relative overflow-hidden",
                              isSelected
                                ? "bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/40"
                                : "bg-white/[0.02] border-white/10 hover:border-white/20"
                            )}
                          >
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="w-12 h-12 rounded-2xl relative overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
                                <ProfileEffectOverlay effectId={eff.effectType || eff.id} />
                                <Sparkles className="w-4 h-4 text-white relative z-20 opacity-80" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white">{eff.name}</div>
                                <div className="text-[10px] text-zinc-400 line-clamp-1">{eff.desc}</div>
                              </div>
                            </div>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-indigo-400 shrink-0 relative z-10" />
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-bold shrink-0 relative z-10">Seç</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {ownedEffects.length === 0 && (
                      <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-2">
                        <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
                        <p className="text-xs font-bold text-zinc-300">Envanterinde henüz profil efekti yok</p>
                        <p className="text-[11px] text-zinc-500">Matrix yağmuru, kozmik nebula veya alev efektleriyle profilini parlatmak için mağazaya göz at.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditModalOpen(false)
                            router.push("/shop")
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/40"
                        >
                          Mağazayı Ziyaret Et →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TITLES TAB */}
                {activeEditTab === "titles" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Unvan Yok */}
                      <div
                        onClick={() => setEditTitle(null)}
                        className={cn(
                          "p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                          editTitle === null
                            ? "bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/40"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20"
                        )}
                      >
                        <div>
                          <div className="text-xs font-bold text-white">Unvan Yok</div>
                          <div className="text-[10px] text-zinc-500">Unvan gösterme</div>
                        </div>
                        {editTitle === null && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>

                      {/* Owned Titles */}
                      {ownedTitles.map((titleItem) => {
                        const isSelected = editTitle === titleItem.name
                        return (
                          <div
                            key={titleItem.id}
                            onClick={() => setEditTitle(titleItem.name)}
                            className={cn(
                              "p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                              isSelected
                                ? "bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/40"
                                : "bg-white/[0.02] border-white/10 hover:border-white/20"
                            )}
                          >
                            <div>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                                <Crown className="w-3 h-3 text-amber-400" />
                                <span>{titleItem.name}</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{titleItem.desc}</div>
                            </div>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-bold shrink-0">Seç</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {ownedTitles.length === 0 && (
                      <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-2">
                        <Tag className="w-8 h-8 text-zinc-600 mx-auto" />
                        <p className="text-xs font-bold text-zinc-300">Envanterinde henüz unvan yok</p>
                        <p className="text-[11px] text-zinc-500">Mağazadan unvanlar satın alabilir veya başarımları tamamlayarak unvan kazanabilirsin.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditModalOpen(false)
                            router.push("/shop")
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/40"
                        >
                          Mağazayı Ziyaret Et →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. BADGES TAB */}
                {activeEditTab === "badges" && (
                  <div className="space-y-5">
                    {/* 3 Active Showcase Slots */}
                    <div>
                      <div className="text-xs font-bold text-zinc-300 mb-2">Vitrin Rozeti Yuvaları (3 Adet)</div>
                      <div className="grid grid-cols-3 gap-3">
                        {[0, 1, 2].map((slotIdx) => {
                          const badgeId = editBadges[slotIdx]
                          const b = badgeId ? (BADGES.find(it => it.id === badgeId) || BADGE_MAP[badgeId]) : null
                          const Icon = b?.icon || Star
                          const isSlotActive = activeBadgeSlot === slotIdx

                          return (
                            <div
                              key={slotIdx}
                              onClick={() => setActiveBadgeSlot(slotIdx)}
                              className={cn(
                                "p-3 rounded-2xl border flex flex-col items-center text-center gap-2 cursor-pointer transition-all relative",
                                isSlotActive
                                  ? "bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/40"
                                  : "bg-white/[0.02] border-white/10 hover:border-white/20"
                              )}
                            >
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                Yuva #{slotIdx + 1}
                              </span>
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center border",
                                b ? "bg-white/5 border-white/10" : "border-dashed border-white/10 text-zinc-600"
                              )}>
                                <Icon className={cn("w-5 h-5", b ? "text-amber-400 drop-shadow" : "text-zinc-600")} />
                              </div>
                              <span className="text-[11px] font-bold text-white truncate max-w-full">
                                {b ? b.name : "Boş Yuva"}
                              </span>

                              {b && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const next = [...editBadges]
                                    next[slotIdx] = null
                                    setEditBadges(next)
                                  }}
                                  className="absolute top-2 right-2 p-1 rounded-md bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300"
                                  title="Rozeti Kaldır"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Available Badges Grid */}
                    <div>
                      <div className="text-xs font-bold text-zinc-300 mb-2">
                        Yuva #{activeBadgeSlot + 1} İçin Rozet Seç:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {BADGES.map((b) => {
                          const Icon = b.icon
                          const isAlreadyEquipped = editBadges.includes(b.id)
                          const isEquippedInCurrentSlot = editBadges[activeBadgeSlot] === b.id

                          return (
                            <div
                              key={b.id}
                              onClick={() => {
                                const next = [...editBadges]
                                next[activeBadgeSlot] = b.id
                                setEditBadges(next)
                              }}
                              className={cn(
                                "p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all",
                                isEquippedInCurrentSlot
                                  ? "bg-indigo-500/20 border-indigo-500"
                                  : isAlreadyEquipped
                                  ? "bg-white/[0.01] border-white/5 opacity-50"
                                  : "bg-white/[0.02] border-white/10 hover:border-white/20"
                              )}
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-amber-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-white truncate">{b.name}</p>
                                <p className="text-[9px] text-zinc-500 truncate">{b.desc}</p>
                              </div>
                              {isEquippedInCurrentSlot && (
                                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveFullProfile()}
                  disabled={isSaving || !editName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Değişiklikleri Kaydet & Yayınla</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
