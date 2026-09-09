"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, useMotionTemplate } from "motion/react"
import {
  Users,
  Search,
  RefreshCw,
  Trophy,
  Flame,
  Target,
  ScanFace,
  Hexagon,
  Crown,
  Star,
  Zap,
  Clock,
  CalendarDays,
  Award,
  Medal,
  ListTodo,
  Shield,
  Sword,
  Eye,
  Sparkles,
  Navigation,
  Activity,
  X,
  UserPlus,
  UserCheck,
  ExternalLink,
  HeartHandshake
} from "lucide-react"
import { useRouter } from "next/navigation"
import { db } from "@/firebase/config"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { getRankData } from "@/lib/stats"
import { useSettings } from "@/hooks/useSettings"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/contexts/ToastContext"
import { BADGES } from "@/lib/badges"
import { FRAME_STYLES } from "@/hooks/useShop"
import { ProfileEffectOverlay } from "@/components/shop/ProfileEffectOverlay"
import { SearchInput } from "@/components/ui/SearchInput"
import { EmptyState } from "@/components/ui/EmptyState"

const BADGE_MAP: Record<string, any> = {}
BADGES.forEach((b) => {
  BADGE_MAP[b.id] = {
    icon: b.icon,
    color: b.color,
    name: b.name,
    desc: b.desc
  }
})

export default function CommunityPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { settings, updateSettings } = useSettings()
  const { showToast } = useToast()

  const [profiles, setProfiles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [refreshing, setRefreshing] = React.useState(false)
  const [filterTab, setFilterTab] = React.useState<"all" | "friends">("all")

  // Current user's friend list without self
  const myFriends = React.useMemo(
    () => (settings.friends || []).filter((id) => id && id !== user?.uid),
    [settings.friends, user?.uid]
  )

  const toggleFriend = (targetUid: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (user?.uid && targetUid === user.uid) {
      showToast({
        type: "error",
        message: "Kendini arkadaş olarak ekleyemezsin!"
      })
      return
    }

    const isAlready = myFriends.includes(targetUid)
    const nextFriends = isAlready
      ? myFriends.filter((id) => id !== targetUid && id !== user?.uid)
      : [...myFriends.filter((id) => id !== user?.uid), targetUid]

    updateSettings({ friends: nextFriends })
    showToast({
      type: "success",
      message: isAlready ? "Arkadaşlıktan çıkarıldı" : "Arkadaş listene eklendi! 🎉"
    })
  }

  /* 3D INSPECT MODAL ANIMATIONS */
  const [selectedProfile, setSelectedProfile] = React.useState<any>(null)
  const [isInspecting, setIsInspecting] = React.useState(false)

  const inspectRotateX = useMotionValue(0)
  const inspectRotateY = useMotionValue(0)

  const inspectSpringX = useSpring(inspectRotateX, { damping: 50, stiffness: 150, mass: 1.5 })
  const inspectSpringY = useSpring(inspectRotateY, { damping: 50, stiffness: 150, mass: 1.5 })

  const lightPosX = useTransform(inspectSpringY, (y) => {
    let raw = y % 360
    if (raw < 0) raw += 360
    const angle = raw > 180 ? raw - 360 : raw
    return 50 - angle * 0.8
  })
  const lightPosY = useTransform(inspectSpringX, (x) => 50 + x * 0.8)

  const backLightPosX = useTransform(inspectSpringY, (y) => {
    let raw = (y + 180) % 360
    if (raw < 0) raw += 360
    const angle = raw > 180 ? raw - 360 : raw
    return 50 - angle * 0.8
  })

  const frontGlare = useMotionTemplate`radial-gradient(circle at ${lightPosX}% ${lightPosY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`
  const backGlare = useMotionTemplate`radial-gradient(circle at ${backLightPosX}% ${lightPosY}%, rgba(255,255,255,0.08) 0%, transparent 60%)`

  const isDragging = React.useRef(false)
  const lastInteractionTime = React.useRef(Date.now())

  const handlePointerDown = () => {
    isDragging.current = true
    lastInteractionTime.current = Date.now()
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    lastInteractionTime.current = Date.now()
    inspectRotateY.set(inspectRotateY.get() + e.movementX * 0.3)
    const nextX = inspectRotateX.get() - e.movementY * 0.3
    inspectRotateX.set(Math.max(-60, Math.min(60, nextX)))
  }

  const handlePointerUp = () => {
    isDragging.current = false
    lastInteractionTime.current = Date.now()
  }

  React.useEffect(() => {
    if (isInspecting) {
      inspectRotateX.set(0)
      inspectRotateY.set(0)
      isDragging.current = false
      lastInteractionTime.current = Date.now()

      let animationFrameId: number
      let lastTime = performance.now()

      const autoRotate = (time: number) => {
        const delta = time - lastTime
        lastTime = time
        if (!isDragging.current && Date.now() - lastInteractionTime.current > 1500) {
          const rotationSpeed = 0.015
          inspectRotateY.set(inspectRotateY.get() + delta * rotationSpeed)
          const currentX = inspectRotateX.get()
          if (Math.abs(currentX) > 0.1) {
            inspectRotateX.set(currentX * 0.95)
          }
        }
        animationFrameId = requestAnimationFrame(autoRotate)
      }

      animationFrameId = requestAnimationFrame(autoRotate)
      return () => cancelAnimationFrame(animationFrameId)
    }
  }, [isInspecting, inspectRotateX, inspectRotateY])

  const selectedProfileStats = React.useMemo(() => {
    if (!selectedProfile) return null
    let totalXP = selectedProfile.totalXP || 0
    const getXpForLevel = (l: number) => Math.floor(250 * Math.pow(l, 1.8))
    let lvl = 1
    while (totalXP >= getXpForLevel(lvl)) {
      lvl++
    }
    const currentLevelXP = getXpForLevel(lvl - 1)
    const nextLevelXP = getXpForLevel(lvl)
    const requiredForNext = nextLevelXP - currentLevelXP
    const progressInLevel = totalXP - currentLevelXP
    const levelPercentage = requiredForNext > 0 ? (progressInLevel / requiredForNext) * 100 : 100

    const rankData = getRankData(selectedProfile.level || lvl)

    return {
      displayName: selectedProfile.displayName || "FOCUSFLOW Kullanıcısı",
      photoURL: selectedProfile.photoURL,
      uid: selectedProfile.id || "",
      creationTime: selectedProfile.creationTime || null,
      level: selectedProfile.level || lvl,
      rankName: rankData.name,
      rankColor: rankData.color,
      totalXP,
      levelPercentage,
      requiredForNext,
      progressInLevel,
      activeDays: selectedProfile.activeDays || selectedProfile.completedTotal || 0,
      completedTotal: selectedProfile.completedTotal || 0,
      currentStreak: selectedProfile.currentStreak || 0,
      focusMinsTotal: selectedProfile.focusMinsTotal || 0,
      equippedFrame: selectedProfile.id === user?.uid ? settings.equippedFrame : selectedProfile.equippedFrame,
      equippedTitle: selectedProfile.id === user?.uid ? settings.equippedTitle : selectedProfile.equippedTitle,
      equippedProfileEffect: selectedProfile.id === user?.uid ? settings.equippedProfileEffect : selectedProfile.equippedProfileEffect
    }
  }, [selectedProfile, user?.uid, settings.equippedFrame, settings.equippedTitle, settings.equippedProfileEffect])

  const fetchProfiles = async () => {
    try {
      setRefreshing(true)
      let publicData: any[] = []
      try {
        const qPublic = query(collection(db, "publicProfiles"), orderBy("totalXP", "desc"), limit(50))
        const pubSnap = await getDocs(qPublic)
        publicData = pubSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      } catch (e) {
        console.warn("Public profiles çekilemedi", e)
      }

      let usersData: any[] = []
      try {
        const qUsers = query(collection(db, "users"), limit(50))
        const usersSnap = await getDocs(qUsers)
        usersData = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      } catch (e) {
        console.warn("Users koleksiyonu okuma yetkisi yok", e)
      }

      const mergedMap = new Map()

      usersData.forEach((u) => {
        mergedMap.set(u.id, {
          id: u.id,
          displayName: u.displayName || u.email?.split("@")[0] || "FocusFlow Kullanıcısı",
          photoURL: u.photoURL || null,
          totalXP: u.totalXP || 0,
          level: u.level || 1,
          rankName: u.rankName || "Acemi Çırak",
          completedTotal: u.completedTotal || 0,
          currentStreak: u.currentStreak || 0,
          showcaseBadges: u.showcaseBadges || [null, null, null],
          equippedFrame: u.equippedFrame || null,
          equippedTitle: u.equippedTitle || null,
          equippedProfileEffect: u.equippedProfileEffect || null,
          ...u
        })
      })

      publicData.forEach((p) => {
        if (mergedMap.has(p.id)) {
          mergedMap.set(p.id, { ...mergedMap.get(p.id), ...p })
        } else {
          mergedMap.set(p.id, p)
        }
      })

      const finalData = Array.from(mergedMap.values()).sort(
        (a, b) => (b.totalXP || 0) - (a.totalXP || 0)
      )
      setProfiles(finalData)
    } catch (error) {
      console.error("Veri çekme hatası:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  React.useEffect(() => {
    fetchProfiles()
  }, [])

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch = p.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (filterTab === "friends") {
      if (user?.uid && p.id === user.uid) return false
      return myFriends.includes(p.id)
    }
    return true
  })

  return (
    <div className="h-full overflow-y-auto custom-scrollbar relative bg-[#050508]">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="pt-8 px-4 sm:px-6 lg:px-8 pb-6 relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 text-purple-400 mb-2"
            >
              <Users className="w-5 h-5" />
              <span className="text-[11px] font-black tracking-[0.2em] uppercase">TOPLULUK & ARKADAŞLAR</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl font-bold tracking-tight text-white mb-2"
            >
              Keşfet & Bağlan
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-zinc-400 max-w-xl"
            >
              FocusFlow evrenindeki diğer kullanıcıların istatistiklerine, sergiledikleri gurur tablolarına ve genel sıralamalarına göz at.
            </motion.p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Toggle: All vs Friends */}
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
              <button
                onClick={() => setFilterTab("all")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  filterTab === "all"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Tümü ({profiles.length})
              </button>
              <button
                onClick={() => setFilterTab("friends")}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  filterTab === "friends"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
                Arkadaşlarım ({myFriends.length})
              </button>
            </div>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Kullanıcı ara..."
              className="w-full md:w-56"
            />

            <button
              onClick={fetchProfiles}
              disabled={refreshing}
              className={cn(
                "p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white",
                refreshing && "opacity-50 cursor-not-allowed"
              )}
              title="Yenile"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-purple-400")} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-24 relative z-10 w-full max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filterTab === "friends" ? "Henüz Arkadaşın Yok" : "Kullanıcı Bulunamadı"}
            description={
              filterTab === "friends"
                ? "Topluluk listesinden kullanıcıların yanındaki '+' butonuna basarak onları arkadaş olarak ekleyebilirsin."
                : "Şu an için gösterilecek bir profil yok veya arama sonucu bulunamadı."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile, idx) => {
              const isSelf = user?.uid && profile.id === user.uid
              const activeFrame = isSelf ? settings.equippedFrame : profile.equippedFrame
              const activeTitle = isSelf ? settings.equippedTitle : profile.equippedTitle
              const activeEffect = isSelf ? settings.equippedProfileEffect : profile.equippedProfileEffect
              const activeBio = isSelf ? settings.bio : profile.bio
              const activeBadges = isSelf ? settings.showcaseBadges : profile.showcaseBadges
              const rankData = getRankData(profile.level || 1)
              const isFriend = myFriends.includes(profile.id)
              const frameClass = activeFrame && FRAME_STYLES[activeFrame] ? FRAME_STYLES[activeFrame] : "border-[#121522]"

              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => {
                    setSelectedProfile(profile)
                    setIsInspecting(true)
                  }}
                  className="rounded-3xl border border-white/10 bg-[#151928] shadow-xl hover:shadow-2xl hover:border-indigo-500/40 transition-all hover:-translate-y-1 relative overflow-hidden group cursor-pointer flex flex-col"
                >
                  {/* Hover 3D Inspect Hint Overlay */}
                  <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center rounded-3xl pointer-events-none">
                    <ScanFace className="w-10 h-10 text-indigo-400 mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] transform scale-90 group-hover:scale-100 transition-transform duration-300" />
                    <span className="text-white font-bold tracking-[0.15em] uppercase text-[11px] drop-shadow-md text-center">
                      3D KARTI İNCELEMEK İÇİN TIKLAYIN
                    </span>
                  </div>

                  {/* Top Banner with ProfileEffectOverlay */}
                  <div className="relative h-28 w-full bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-900/90 overflow-hidden shrink-0">
                    <ProfileEffectOverlay effectId={activeEffect} />

                    {/* Leaderboard Rank # */}
                    <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg",
                          idx === 0
                            ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-black"
                            : idx === 1
                            ? "bg-gradient-to-br from-zinc-300 to-zinc-500 text-black"
                            : idx === 2
                            ? "bg-gradient-to-br from-amber-600 to-orange-800 text-white"
                            : "bg-black/60 text-zinc-400 border border-white/10 backdrop-blur-md"
                        )}
                      >
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Top Right Actions (Friend & Link) */}
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                      {isSelf ? (
                        <span className="px-2.5 py-1 rounded-xl bg-purple-500/30 border border-purple-500/50 text-purple-200 text-[11px] font-bold tracking-wide backdrop-blur-md">
                          Sen
                        </span>
                      ) : (
                        <button
                          onClick={(e) => toggleFriend(profile.id, e)}
                          title={isFriend ? "Arkadaşlıktan Çıkar" : "Arkadaş Ekle"}
                          className={cn(
                            "p-2 rounded-xl backdrop-blur-md transition-all",
                            isFriend
                              ? "bg-pink-500/25 border border-pink-500/50 text-pink-400 hover:bg-pink-500/40"
                              : "bg-black/50 border border-white/15 text-zinc-300 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {isFriend ? <UserCheck className="w-3.5 h-3.5 text-pink-400" /> : <UserPlus className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/profile?uid=${profile.id}`)
                        }}
                        title="Profile Git"
                        className="p-2 rounded-xl bg-black/50 border border-white/15 text-zinc-300 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-5 pb-5 pt-0 relative z-20 bg-[#121522] flex-1 flex flex-col justify-between">
                    {/* Avatar row overlapping banner */}
                    <div className="flex justify-between items-end -mt-10 mb-3">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-20 h-20 rounded-full bg-zinc-900 p-1 flex items-center justify-center shadow-2xl transition-all duration-300 border-4 overflow-hidden",
                            frameClass
                          )}
                        >
                          {profile.photoURL ? (
                            <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-xl font-black shadow-inner">
                              {profile.displayName?.slice(0, 2).toUpperCase() || "FF"}
                            </div>
                          )}
                        </div>

                        {/* Level badge */}
                        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-zinc-900 border border-white/20 text-[9px] font-black uppercase text-amber-400 shadow-lg">
                          LvL {profile.level || 1}
                        </div>

                        {/* Online Status Dot */}
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#121522] shadow-[0_0_8px_#10b981]" />
                      </div>

                      {/* Streak pill */}
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-300 shadow-inner">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span>{profile.currentStreak || 0} Gün</span>
                      </div>
                    </div>

                    {/* Name, Title & Rank */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {profile.displayName || "FocusFlow Savaşçısı"}
                        </h3>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/25 border border-indigo-500/35 text-[9px] font-bold text-indigo-300 shrink-0">
                          PRO
                        </span>
                      </div>

                      {/* Equipped Title Pill */}
                      {activeTitle && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-semibold max-w-full truncate shadow-sm">
                          <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{activeTitle}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold">
                          <Hexagon className={cn("w-3 h-3", rankData.color)} />
                          <span className={rankData.color}>{rankData.name}</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-[11px] text-zinc-400 italic line-clamp-1 pt-1">
                        {activeBio || "🚀 FocusFlow ile hiper odak modunda..."}
                      </p>
                    </div>

                    {/* Showcase Badges Row (if any) */}
                    {activeBadges && activeBadges.some((b: any) => b !== null) && (
                      <div className="flex items-center gap-1.5 pt-2.5 mt-2 border-t border-white/5">
                        {activeBadges.map((badgeId: string | null, bIdx: number) => {
                          if (!badgeId) return null
                          const badge = BADGES.find((b) => b.id === badgeId) || BADGE_MAP[badgeId]
                          if (!badge) return null
                          const Icon = badge.icon
                          return (
                            <div
                              key={bIdx}
                              className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center border shadow-sm",
                                badge.color || "bg-white/10 border-white/10"
                              )}
                              title={badge.name}
                            >
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 mt-3 text-center">
                      <div>
                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">XP</div>
                        <div className="text-xs font-black text-white">{(profile.totalXP || 0).toLocaleString()}</div>
                      </div>
                      <div className="border-l border-white/5">
                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">GÖREV</div>
                        <div className="text-xs font-black text-emerald-400">{profile.completedTotal || 0}</div>
                      </div>
                      <div className="border-l border-white/5">
                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">ODAK</div>
                        <div className="text-xs font-black text-blue-400">{Math.floor((profile.focusMinsTotal || 0) / 60)}s</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isInspecting && selectedProfileStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020205] touch-none select-none cursor-grab active:cursor-grabbing overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ perspective: 3000 }}
          >
            {/* Ambient Lighting Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], x: [0, 50, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/30 blur-[120px]"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1], y: [0, -50, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-purple-600/30 blur-[120px]"
              />
            </div>

            {/* Top Close & Quick Profile Link */}
            <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
              <button
                onClick={() => router.push(`/profile?uid=${selectedProfileStats.uid}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Detaylı Profil
              </button>
              <button
                onClick={() => setIsInspecting(false)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute top-10 w-full text-center pointer-events-none fade-in">
              <h2 className="text-white/50 tracking-[0.5em] uppercase text-sm font-black drop-shadow-xl animate-pulse">
                KARTI ÇEVİRMEK İÇİN BASILI TUTUP SÜRÜKLEYİN
              </h2>
            </div>

            <motion.div
              style={{ rotateX: inspectSpringX, rotateY: inspectSpringY, transformStyle: "preserve-3d" }}
              className="w-full max-w-[800px] aspect-[16/9] relative transform-gpu"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={`volume-${i}`}
                  className="absolute inset-0 rounded-[40px] bg-[#110e1f] pointer-events-none border border-white/[0.04]"
                  style={{
                    transform: `translateZ(${-5 + i}px)`,
                    boxShadow: i === 0 || i === 9 ? "0 0 20px rgba(0,0,0,0.5)" : "none"
                  }}
                />
              ))}

              {/* FRONT FACE */}
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden", transform: "translateZ(5px)", transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 glass-card rounded-[40px] border border-white/10 overflow-hidden bg-gradient-to-br from-[#2d1b4e] via-[#0c0a18] to-[#1b153a] shadow-[0_0_100px_rgba(139,92,246,0.5)]">
                  <ProfileEffectOverlay effectId={selectedProfileStats.equippedProfileEffect} />
                  <motion.div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ background: frontGlare }} />
                </div>

                <div
                  className="absolute inset-0 p-10 flex flex-col md:flex-row items-center gap-12 h-full"
                  style={{ transformStyle: "preserve-3d", transform: "translateZ(8px)" }}
                >
                  <div className="relative group shrink-0" style={{ transform: "translateZ(6px)" }}>
                    <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full scale-[1.8] animate-pulse" />
                    <div
                      className={cn(
                        "w-40 h-40 rounded-full border-[6px] bg-[#0f0f13] flex items-center justify-center relative shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden",
                        selectedProfileStats.equippedFrame ? FRAME_STYLES[selectedProfileStats.equippedFrame] || "border-zinc-800" : "border-zinc-800"
                      )}
                    >
                      {selectedProfileStats.photoURL ? (
                        <img
                          src={selectedProfileStats.photoURL}
                          alt="Profil"
                          className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                      ) : null}
                      <svg
                        viewBox="0 0 160 160"
                        className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none drop-shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                      >
                        <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="url(#modal-gradient)"
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 70}
                          strokeDashoffset={2 * Math.PI * 70 * (1 - selectedProfileStats.levelPercentage / 100)}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="modal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="flex flex-col items-center relative z-10 drop-shadow-md">
                        <span className="text-sm font-bold tracking-[0.3em] text-zinc-400 uppercase mb-1">LvL</span>
                        <span className="text-6xl font-black text-white leading-none">{selectedProfileStats.level}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex-1 w-full text-center md:text-left flex flex-col justify-center gap-3"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div
                      style={{ transform: "translateZ(2px)" }}
                      className="inline-flex items-center gap-3 justify-center md:justify-start bg-white/5 px-4 py-2 rounded-full border border-white/10 w-fit drop-shadow-sm"
                    >
                      <Hexagon className={`w-5 h-5 ${selectedProfileStats.rankColor}`} />
                      <span className={`text-sm font-black tracking-[0.25em] ${selectedProfileStats.rankColor} uppercase`}>
                        {selectedProfileStats.rankName}
                      </span>
                    </div>

                    <h2
                      style={{ transform: "translateZ(4px)" }}
                      className="text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3 justify-center md:justify-start drop-shadow-lg"
                    >
                      {selectedProfileStats.displayName.split(" ")[0].toUpperCase()} KİMLİĞİ
                      <Sparkles className="w-6 h-6 text-yellow-500" />
                    </h2>

                    {selectedProfileStats.equippedTitle && (
                      <div className="w-fit mx-auto md:mx-0 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-md">
                        {selectedProfileStats.equippedTitle}
                      </div>
                    )}

                    <div
                      style={{ transform: "translateZ(2px)" }}
                      className="bg-black/50 border border-white/10 rounded-2xl p-5 w-full mt-1 shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">Toplam XP</span>
                          <span className="text-2xl font-black text-white drop-shadow-md">
                            {selectedProfileStats.totalXP.toLocaleString()}{" "}
                            <span className="text-sm text-zinc-500 font-bold">XP</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">Sonraki Sv.</span>
                          <span className="text-lg font-black text-emerald-400 drop-shadow-md">
                            {(selectedProfileStats.requiredForNext - selectedProfileStats.progressInLevel).toLocaleString()}{" "}
                            <span className="text-zinc-500 text-xs">kaldı</span>
                          </span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                          style={{ width: `${selectedProfileStats.levelPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BACK FACE */}
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg) translateZ(5px)",
                  transformStyle: "preserve-3d"
                }}
              >
                <div className="absolute inset-0 glass-card rounded-[40px] border border-white/10 overflow-hidden bg-gradient-to-tl from-[#2d1b4e] via-[#0c0a18] to-[#1b153a] shadow-[0_0_100px_rgba(139,92,246,0.5)]">
                  <motion.div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ background: backGlare }} />
                </div>

                <div
                  className="absolute inset-0 p-10 flex flex-col justify-between h-full"
                  style={{ transformStyle: "preserve-3d", transform: "translateZ(8px)" }}
                >
                  <div className="flex justify-between items-start" style={{ transform: "translateZ(2px)" }}>
                    <div className="flex items-center gap-3 opacity-50 drop-shadow-md">
                      <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-12 h-12 grayscale brightness-200 contrast-125 object-contain"
                      />
                      <span className="text-3xl font-black tracking-tighter">FOCUSFLOW</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mb-1">Kayıt Tarihi</div>
                      <div className="text-sm text-zinc-300 font-mono">
                        {selectedProfileStats.creationTime
                          ? format(new Date(selectedProfileStats.creationTime), "MM/yyyy")
                          : "2024"}
                      </div>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-4 gap-6 w-full max-w-2xl mx-auto my-auto"
                    style={{ transform: "translateZ(6px)" }}
                  >
                    <div className="flex flex-col items-center bg-[#151522] p-5 rounded-2xl border border-white/5 shadow-lg">
                      <CalendarDays className="w-8 h-8 text-zinc-400 mb-2 opacity-80" />
                      <div className="text-3xl font-black text-white drop-shadow-sm">{selectedProfileStats.activeDays}</div>
                      <div className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mt-2">Aktif Gün</div>
                    </div>
                    <div className="flex flex-col items-center bg-[#151522] p-5 rounded-2xl border border-white/5 shadow-lg">
                      <Target className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                      <div className="text-3xl font-black text-white drop-shadow-sm">{selectedProfileStats.completedTotal}</div>
                      <div className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mt-2">Tamamlanan</div>
                    </div>
                    <div className="flex flex-col items-center bg-[#151522] p-5 rounded-2xl border border-white/5 shadow-lg">
                      <Flame className="w-8 h-8 text-orange-500 mb-2 opacity-80" />
                      <div className="text-3xl font-black text-white drop-shadow-sm">{selectedProfileStats.currentStreak}</div>
                      <div className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mt-2">Seri (Streak)</div>
                    </div>
                    <div className="flex flex-col items-center bg-[#151522] p-5 rounded-2xl border border-white/5 shadow-lg">
                      <Eye className="w-8 h-8 text-blue-500 mb-2 opacity-80" />
                      <div className="text-3xl font-black text-white drop-shadow-sm">{selectedProfileStats.focusMinsTotal}</div>
                      <div className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mt-2">Odak (Dk)</div>
                    </div>
                  </div>

                  <div
                    className="flex justify-between items-end border-t border-white/10 pt-6 mt-auto"
                    style={{ transform: "translateZ(2px)" }}
                  >
                    <div className="flex flex-col drop-shadow-md">
                      <span className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mb-1">
                        Eşsiz Tanımlayıcı
                      </span>
                      <span className="text-lg text-zinc-300 font-mono tracking-widest">
                        FF-{selectedProfileStats.completedTotal.toString().padStart(4, "0")}-
                        {selectedProfileStats.uid.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex h-10 gap-[2px] opacity-30 drop-shadow-sm">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-white h-full"
                          style={{ width: Math.random() > 0.5 ? "2px" : "4px", opacity: Math.random() }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
