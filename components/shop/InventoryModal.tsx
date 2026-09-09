"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  Package,
  Gift,
  Sparkles,
  Clock,
  Check,
  Crown,
  Flame,
  Zap,
  Shield,
  Snowflake,
  Coins,
  ChevronRight,
  Layers,
  Eye,
  Trophy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Box
} from "lucide-react"
import confetti from "canvas-confetti"
import { useShop, SHOP_ITEMS, ShopItem, FRAME_STYLES, CASE_TIERS } from "@/hooks/useShop"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"
import { ProfileEffectOverlay } from "@/components/shop/ProfileEffectOverlay"
import { cn } from "@/lib/utils"

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenCs2Modal?: () => void
}

type TabType = "all" | "cases" | "frames" | "effects" | "titles" | "boosters"

const RARITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  legendary: {
    label: "Efsanevi",
    color: "text-amber-300",
    bg: "bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20",
    border: "border-amber-500/40"
  },
  epic: {
    label: "Epik",
    color: "text-purple-300",
    bg: "bg-purple-500/20",
    border: "border-purple-500/40"
  },
  rare: {
    label: "Nadir",
    color: "text-cyan-300",
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/40"
  },
  common: {
    label: "Yaygın",
    color: "text-zinc-400",
    bg: "bg-white/5",
    border: "border-white/10"
  }
}

export function InventoryModal({ isOpen, onClose, onOpenCs2Modal }: InventoryModalProps) {
  const { user } = useAuth()
  const { settings } = useSettings()
  const {
    inventory,
    equippedFrame,
    equippedTitle,
    equippedProfileEffect,
    focusCoins,
    streakFreezes,
    equipItem,
    equipBundle,
    canClaimDailyGift,
    claimDailyGift,
    dailyGiftTimeRemaining
  } = useShop()

  const [activeTab, setActiveTab] = React.useState<TabType>("all")
  const [mounted, setMounted] = React.useState(false)
  const [justClaimedReward, setJustClaimedReward] = React.useState<{
    amount: number
    message: string
    type: string
  } | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key press
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Map inventory IDs to full ShopItem objects
  const ownedItems = React.useMemo(() => {
    return inventory
      .map((id) => SHOP_ITEMS.find((it) => it.id === id))
      .filter(Boolean) as ShopItem[]
  }, [inventory])

  // Categorized counts
  const ownedFrames = React.useMemo(() => ownedItems.filter((i) => i.category === "frame"), [ownedItems])
  const ownedEffects = React.useMemo(() => ownedItems.filter((i) => i.category === "effect"), [ownedItems])
  const ownedTitles = React.useMemo(() => ownedItems.filter((i) => i.category === "title"), [ownedItems])
  const ownedBundles = React.useMemo(() => ownedItems.filter((i) => i.category === "bundle"), [ownedItems])

  // Filtered items based on activeTab
  const displayItems = React.useMemo(() => {
    if (activeTab === "frames") return ownedFrames
    if (activeTab === "effects") return ownedEffects
    if (activeTab === "titles") return ownedTitles
    if (activeTab === "cases" || activeTab === "boosters") return []
    return ownedItems.filter((i) => i.category !== "utility")
  }, [activeTab, ownedFrames, ownedEffects, ownedTitles, ownedItems])

  // Format countdown
  const formatCountdown = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(totalSec / 3600).toString().padStart(2, "0")
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0")
    const s = Math.floor(totalSec % 60).toString().padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  // Handle opening the free daily case
  const handleClaimFreeCase = () => {
    if (!canClaimDailyGift) return
    const reward = claimDailyGift()
    if (reward) {
      setJustClaimedReward(reward)
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } })
      setTimeout(() => {
        setJustClaimedReward(null)
      }, 5000)
    }
  }

  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"

  if (!isOpen || !mounted) return null

  const modalContent = (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl h-[86vh] max-h-[820px] rounded-3xl border border-white/15 bg-[#0c101c] shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-zinc-100"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* ─────────────────────────────────────────────────────────────
              HEADER BAR (SHRINK-0, ALWAYS VISIBLE AT TOP)
          ───────────────────────────────────────────────────────────── */}
          <div className="relative z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-indigo-500/20 to-purple-500/30 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight">Kişisel Envanter & Kasalarım</h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/30">
                    {ownedItems.length} Eşya
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Sahip olduğun kasaları aç, profil kozmetiklerini kuşan ve güçlendiricilerini yönet.
                </p>
              </div>
            </div>

            {/* Quick Balances & Obvious Close Button */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                <Coins className="w-3.5 h-3.5" />
                <span>{focusCoins.toLocaleString()} 🪙</span>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-bold">
                <Snowflake className="w-3.5 h-3.5" />
                <span>{streakFreezes} Kalkan</span>
              </div>

              {/* Ultra Clear Close Button with ESC badge */}
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/25 text-zinc-200 hover:text-white border border-white/15 hover:border-rose-500/40 flex items-center gap-2 transition-all cursor-pointer font-bold text-xs shadow-md"
                title="Pencereyi Kapat (ESC)"
              >
                <span>Kapat</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[9px] font-mono text-zinc-400 border border-white/10">ESC</kbd>
                <X className="w-4 h-4 text-zinc-300" />
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              NAV TABS
          ───────────────────────────────────────────────────────────── */}
          <div className="relative z-10 px-6 py-2.5 border-b border-white/5 bg-black/30 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                activeTab === "all"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
              )}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Tüm Kozmetikler ({ownedItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("cases")}
              className={cn(
                "relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                activeTab === "cases"
                  ? "bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/25"
                  : "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
              )}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Kasalar & Sandıklar</span>
              {canClaimDailyGift && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("frames")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                activeTab === "frames"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
              )}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Çerçeveler ({ownedFrames.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("effects")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                activeTab === "effects"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Profil Efektleri ({ownedEffects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("titles")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                activeTab === "titles"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Unvanlar ({ownedTitles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("boosters")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                activeTab === "boosters"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Güçlendiriciler & Kalkan</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              BODY CONTENT
          ───────────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* 1. TOP FEATURED: FREE DAILY CASE & CS2 CHEST SPOTLIGHT */}
            {(activeTab === "all" || activeTab === "cases") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Daily Case Card */}
                <div className={cn(
                  "relative rounded-2xl border p-5 overflow-hidden backdrop-blur-xl transition-all",
                  canClaimDailyGift
                    ? "bg-gradient-to-br from-emerald-950/40 via-[#0e1a18] to-teal-950/30 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    : "bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-white/10 opacity-90"
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-transform",
                        canClaimDailyGift
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
                          : "bg-white/5 text-zinc-500 border-white/10"
                      )}>
                        <Gift className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-white">Ücretsiz Günlük Şans Kasası</h3>
                          {canClaimDailyGift ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[9px] font-bold animate-pulse">
                              HAZIR!
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 text-[9px] font-mono">
                              BEKLİYOR
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Her 24 saatte bir 15-50 Focus Parası veya Seri Koruma Kalkanı kazandırır.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action or Countdown */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    {canClaimDailyGift ? (
                      <button
                        onClick={handleClaimFreeCase}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 fill-zinc-950" />
                        <span>Ücretsiz Kasayı Aç! 🎁</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between text-xs">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          Sonraki Kasa:
                        </span>
                        <span className="font-mono font-bold text-amber-400 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                          {formatCountdown(dailyGiftTimeRemaining)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Just claimed reward banner */}
                  {justClaimedReward && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{justClaimedReward.message} envanterine eklendi!</span>
                    </motion.div>
                  )}
                </div>

                {/* CS2 Case Opening Portal Card */}
                <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-[#15121b] to-orange-950/20 p-5 overflow-hidden backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-white">CS2 Şans Kasaları (3 Kademe)</h3>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold border border-amber-500/30">
                            75-350 🪙
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Çırak, Operasyon ve Kraliyet kasalarından efsanevi & mitik eşyalar çıkar.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => {
                        onClose()
                        if (onOpenCs2Modal) onOpenCs2Modal()
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-zinc-950" />
                      <span>Kasa Çarkını Aç 🎰</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ACTIVE EQUIPPED SHOWCASE */}
            {(activeTab === "all" || activeTab === "frames" || activeTab === "effects" || activeTab === "titles") && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        data-no-invert
                        className={cn(
                          "w-12 h-12 rounded-xl object-cover border-2",
                          equippedFrame ? FRAME_STYLES[equippedFrame] || "border-white/20" : "border-white/20"
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg border",
                          equippedFrame ? FRAME_STYLES[equippedFrame] || "border-white/20" : "border-white/20"
                        )}
                      >
                        {initial}
                      </div>
                    )}
                    {equippedProfileEffect && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                        <ProfileEffectOverlay effectId={equippedProfileEffect} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-400">Şu Anda Kuşanılan Profil</div>
                    <div className="flex items-center gap-2 text-sm font-black text-white">
                      <span>{user?.displayName || "Kullanıcı"}</span>
                      {equippedTitle && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {equippedTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-zinc-300">
                    Çerçeve: <strong className="text-white">{equippedFrame ? SHOP_ITEMS.find((i) => i.id === equippedFrame)?.name || "Varsayılan" : "Yok"}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-zinc-300">
                    Efekt: <strong className="text-white">{equippedProfileEffect ? SHOP_ITEMS.find((i) => i.id === equippedProfileEffect)?.name || "Varsayılan" : "Yok"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ITEMS GRID (COSMETICS) */}
            {activeTab !== "cases" && activeTab !== "boosters" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {activeTab === "all" ? "Sahip Olduğun Tüm Eşyalar" : `${activeTab.toUpperCase()} (${displayItems.length})`}
                  </h3>
                </div>

                {displayItems.length === 0 ? (
                  <div className="py-12 px-4 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-600 mb-3 border border-white/5">
                      <Box className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-300">Bu kategoride henüz bir eşyan yok</h4>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
                      Mağazadan eşya veya set satın alarak ya da CS2 kasalarını açarak envanterini doldurabilirsin.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      Mağazaya Göz At 🛒
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayItems.map((item) => {
                      const isFrameEquipped = item.category === "frame" && equippedFrame === item.id
                      const isEffectEquipped = item.category === "effect" && equippedProfileEffect === item.id
                      const isTitleEquipped = item.category === "title" && equippedTitle === item.name
                      const isEquipped = isFrameEquipped || isEffectEquipped || isTitleEquipped
                      const rarityCfg = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "group relative rounded-3xl border p-4 flex flex-col justify-between transition-all bg-gradient-to-b from-[#131728] to-[#0c0f1c] shadow-xl hover:scale-[1.01]",
                            isEquipped
                              ? "border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40"
                              : "border-white/10 hover:border-white/25"
                          )}
                        >
                          <div>
                            {/* Card Header: Rarity & Equipped pill */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className={cn(
                                "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border flex items-center gap-1",
                                rarityCfg.bg,
                                rarityCfg.border,
                                rarityCfg.color
                              )}>
                                <span>{rarityCfg.label}</span>
                              </span>

                              {isEquipped ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Kuşanıldı ✨</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500 font-mono uppercase">
                                  {item.collection?.toUpperCase() || "KOZMETİK"}
                                </span>
                              )}
                            </div>

                            {/* Card Visual Box - EXACT MATCH TO SHOP PAGE */}
                            <div className="relative h-36 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden mb-3.5 group-hover:border-white/20 transition-colors">
                              {/* 1. Category = Frame */}
                              {item.category === "frame" && (
                                <div className="relative z-10 flex flex-col items-center">
                                  <div
                                    className={cn(
                                      "w-16 h-16 rounded-full bg-zinc-800 p-0.5 flex items-center justify-center border-4 shadow-lg transition-transform group-hover:scale-110",
                                      item.previewStyle || FRAME_STYLES[item.id]
                                    )}
                                  >
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                                      {user?.photoURL ? (
                                        <img
                                          src={user.photoURL}
                                          alt={user.displayName || "Profil"}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      ) : (
                                        <span className="font-black text-xs">
                                          {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "CO"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 2. Category = Effect */}
                              {item.category === "effect" && (
                                <div className="absolute inset-0">
                                  {/* Live effect ONLY on hover */}
                                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <ProfileEffectOverlay effectId={item.effectType || item.id} />
                                  </div>
                                  {/* Static gradient when idle */}
                                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-indigo-900/10 to-transparent group-hover:opacity-20 transition-opacity pointer-events-none" />
                                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/25 shadow-xl bg-zinc-900 relative group-hover:scale-105 transition-transform">
                                      {user?.photoURL ? (
                                        <img
                                          src={user.photoURL}
                                          alt={user.displayName || "Profil"}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-black">
                                          {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "CO"}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-indigo-200 mt-1 drop-shadow flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-indigo-400" />
                                      <span>Profil Efekti</span>
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* 3. Category = Title */}
                              {item.category === "title" && (
                                <div className="relative z-10 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-200 text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-1.5 group-hover:scale-105 transition-transform">
                                  <Crown className="w-4 h-4 text-amber-400" />
                                  <span>{item.name}</span>
                                </div>
                              )}

                              {/* 4. Category = Bundle */}
                              {item.category === "bundle" && (() => {
                                const bFrameId = item.bundleItemIds?.find((id) => id.startsWith("frame_"))
                                const bEffectId = item.bundleItemIds?.find((id) => id.startsWith("effect_"))
                                const bTitleId = item.bundleItemIds?.find((id) => id.startsWith("title_"))
                                const bTitleItem = SHOP_ITEMS.find((it) => it.id === bTitleId)
                                const bFrameStyle = bFrameId ? FRAME_STYLES[bFrameId] : null

                                return (
                                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                                    {bEffectId && (
                                      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-0 group-hover:opacity-80 transition-opacity duration-300">
                                        <ProfileEffectOverlay effectId={bEffectId} intensity="subtle" />
                                      </div>
                                    )}
                                    <div className="relative mb-1">
                                      <div
                                        className={cn(
                                          "w-14 h-14 rounded-full bg-zinc-900 p-0.5 flex items-center justify-center border-4 shadow-xl transition-transform group-hover:scale-110",
                                          bFrameStyle ? bFrameStyle : "border-indigo-400/50"
                                        )}
                                      >
                                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                                          {user?.photoURL ? (
                                            <img
                                              src={user.photoURL}
                                              alt="Profil"
                                              className="w-full h-full object-cover rounded-full"
                                            />
                                          ) : (
                                            <span className="font-black text-xs">
                                              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "CO"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {bTitleItem && (
                                      <div className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 truncate max-w-[130px] z-20">
                                        👑 {bTitleItem.name}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>

                            {/* Card Info */}
                            <h4 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover:text-indigo-300 transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>

                          {/* Equip / Unequip Action */}
                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 uppercase font-mono">
                              {item.category === "frame" ? "Çerçeve" : item.category === "effect" ? "Profil Efekti" : item.category === "title" ? "Özel Unvan" : "Koleksiyon Paketi"}
                            </span>

                            {item.category === "bundle" ? (
                              <button
                                onClick={() => equipBundle(item)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Seti Kuşan ✨</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => equipItem(item)}
                                className={cn(
                                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 shadow-md",
                                  isEquipped
                                    ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                                    : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/25"
                                )}
                              >
                                {isEquipped ? (
                                  <span>Çıkar</span>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Kuşan</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. BOOSTERS & CONSUMABLES TAB */}
            {activeTab === "boosters" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Streak Freeze Card */}
                <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/20 to-cyan-950/10 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center">
                      <Snowflake className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Seri Dondurucu Kalkanı</h4>
                      <p className="text-xs text-sky-400/80">Kalan Hak: {streakFreezes} Gün</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Uygulamaya giremediğin veya görev tamamlayamadığın günlerde serinin sıfırlanmasını otomatik olarak engeller.
                  </p>
                </div>

                {/* Lucky Insurance Booster Card */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-yellow-950/10 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Şans Sigortası</h4>
                      <p className="text-xs text-amber-400/80">Kasa Güvencesi</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    CS2 Kasası açarken kayıp durumlarında harcadığın paranın %50&apos;sini anında iade eder.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              FOOTER BAR (BOTTOM CLOSE & INFO)
          ───────────────────────────────────────────────────────────── */}
          <div className="relative z-10 px-6 py-3 border-t border-white/10 bg-black/50 flex items-center justify-between shrink-0">
            <span className="text-xs text-zinc-400 hidden sm:inline">
              💡 İpucu: Kuşandığın tüm çerçeve ve efektler profilinde anında aktifleşir.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer ml-auto flex items-center gap-2"
            >
              <span>Envanteri Kapat</span>
              <kbd className="px-1 py-0.5 rounded bg-black/40 text-[9px] font-mono text-zinc-400">ESC</kbd>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
