"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Sparkles,
  Coins,
  Snowflake,
  ShieldCheck,
  Check,
  Crown,
  Flame,
  Zap,
  Tag,
  ShoppingBag,
  Info,
  RotateCcw,
  Clock,
  Search,
  Eye,
  ArrowUpDown,
  X,
  Star,
  Award,
  ShieldAlert,
  Package,
  Gift,
  Layers,
  Wand2,
  ChevronRight,
  HelpCircle,
  Maximize2,
  Minimize2,
  Hexagon
} from "lucide-react"
import {
  useShop,
  SHOP_ITEMS,
  ShopItem,
  FRAME_STYLES,
  ItemCategory,
  ItemRarity,
  ShopCollection,
  MysteryBoxResult
} from "@/hooks/useShop"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"
import { useTasks } from "@/hooks/useTasks"
import { calculateUserStats, getRankData } from "@/lib/stats"
import { BADGES } from "@/lib/badges"
import { ProfileEffectOverlay } from "@/components/shop/ProfileEffectOverlay"
import { Cs2CaseOpeningModal } from "@/components/shop/Cs2CaseOpeningModal"
import { cn } from "@/lib/utils"

type FilterCategory = "all" | "bundle" | "effect" | "frame" | "title" | "utility" | "sale"
type SortOption = "recommended" | "price_asc" | "price_desc" | "rarity" | "discount"

const RARITY_CONFIG: Record<ItemRarity, { label: string; color: string; bg: string; border: string; glow: string }> = {
  legendary: {
    label: "Efsanevi",
    color: "text-amber-300",
    bg: "bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20",
    border: "border-amber-500/40",
    glow: "rgba(245, 158, 11, 0.4)"
  },
  epic: {
    label: "Epik",
    color: "text-purple-300",
    bg: "bg-purple-500/20",
    border: "border-purple-500/40",
    glow: "rgba(168, 85, 247, 0.35)"
  },
  rare: {
    label: "Nadir",
    color: "text-cyan-300",
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/40",
    glow: "rgba(6, 182, 212, 0.35)"
  },
  common: {
    label: "Yaygın",
    color: "text-zinc-400",
    bg: "bg-white/5",
    border: "border-white/10",
    glow: "rgba(255, 255, 255, 0.1)"
  }
}

const RARITY_WEIGHT: Record<ItemRarity, number> = {
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1
}

const COLLECTIONS: { id: ShopCollection; name: string; icon: string; color: string }[] = [
  { id: "all", name: "Tüm Koleksiyonlar", icon: "🌐", color: "from-zinc-500 to-zinc-700" },
  { id: "mythic", name: "★ Mitik", icon: "♾️", color: "from-fuchsia-600 to-pink-700" },
  { id: "prestige", name: "Prestij", icon: "💎", color: "from-violet-600 to-purple-800" },
  { id: "cosmic", name: "Kozmik Galaksi", icon: "🌌", color: "from-indigo-500 to-purple-600" },
  { id: "cyberpunk", name: "Siberpunk 2099", icon: "⚡", color: "from-emerald-500 to-cyan-500" },
  { id: "anime", name: "Anime & Sakura", icon: "🌸", color: "from-pink-500 to-rose-500" },
  { id: "dragon", name: "Kadim Ejderha", icon: "🐉", color: "from-red-500 to-amber-600" },
  { id: "synthwave", name: "Retro Synthwave", icon: "🕹️", color: "from-fuchsia-500 to-pink-600" },
  { id: "royalty", name: "Kraliyet & Altın", icon: "👑", color: "from-amber-400 to-yellow-600" },
  { id: "essentials", name: "Temel & Destek", icon: "🛡️", color: "from-blue-500 to-indigo-600" }
]

export default function ShopPage() {
  const { user } = useAuth()
  const userInitials = user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "CO"
  const { settings } = useSettings()
  const { rawTasks } = useTasks()
  const myStats = React.useMemo(() => calculateUserStats(rawTasks), [rawTasks])
  const rank = React.useMemo(() => getRankData(myStats.level), [myStats.level])
  const {
    focusCoins,
    inventory,
    equippedFrame,
    equippedTitle,
    equippedProfileEffect,
    streakFreezes,
    buyItem,
    returnItem,
    getReturnStatus,
    equipItem,
    equipBundle,
    openMysteryBox,
    openCs2Case
  } = useShop()

  // Filter & Search states
  const [selectedCollection, setSelectedCollection] = React.useState<ShopCollection>("all")
  const [activeCategory, setActiveCategory] = React.useState<FilterCategory>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState<SortOption>("recommended")

  // Interactive Live Preview State (FocusFlow Try-on Studio)
  const [previewFrameId, setPreviewFrameId] = React.useState<string | null>(null)
  const [previewEffectId, setPreviewEffectId] = React.useState<string | null>(null)
  const [previewTitleText, setPreviewTitleText] = React.useState<string | null>(null)
  const [isPreviewExpanded, setIsPreviewExpanded] = React.useState(true)

  // CS2 Case Opening Modal
  const [cs2ModalOpen, setCs2ModalOpen] = React.useState(false)

  // Refund Confirmation Modal
  const [returnConfirmItem, setReturnConfirmItem] = React.useState<ShopItem | null>(null)

  // Active boosters expiry from localStorage
  const [hasXpBooster, setHasXpBooster] = React.useState(false)
  const [hasCoinBooster, setHasCoinBooster] = React.useState(false)

  React.useEffect(() => {
    try {
      const xpExpiry = parseInt(localStorage.getItem("focusflow_booster_xp_2x") || "0", 10)
      const coinExpiry = parseInt(localStorage.getItem("focusflow_booster_coin_2x") || "0", 10)
      const now = Date.now()
      setHasXpBooster(xpExpiry > now)
      setHasCoinBooster(coinExpiry > now)
    } catch {}
  }, [])

  // Effective styles in preview
  const currentEffectiveFrame = previewFrameId !== null ? previewFrameId : equippedFrame
  const currentEffectiveEffect = previewEffectId !== null ? previewEffectId : equippedProfileEffect
  const currentEffectiveTitle = previewTitleText !== null ? previewTitleText : equippedTitle

  const hasActivePreview = previewFrameId !== null || previewEffectId !== null || previewTitleText !== null

  const resetPreview = () => {
    setPreviewFrameId(null)
    setPreviewEffectId(null)
    setPreviewTitleText(null)
  }

  const [studioPulse, setStudioPulse] = React.useState(false)

  // Handle try-on click
  const handleTryOn = (item: ShopItem) => {
    if (item.category === "frame") {
      setPreviewFrameId(previewFrameId === item.id ? null : item.id)
    } else if (item.category === "effect") {
      setPreviewEffectId(previewEffectId === item.id ? null : item.id)
    } else if (item.category === "title") {
      setPreviewTitleText(previewTitleText === item.name ? null : item.name)
    } else if (item.category === "bundle" && item.bundleItemIds) {
      const bundleFrame = item.bundleItemIds.find((id) => id.startsWith("frame_"))
      const bundleEffect = item.bundleItemIds.find((id) => id.startsWith("effect_"))
      const bundleTitleId = item.bundleItemIds.find((id) => id.startsWith("title_"))
      const bundleTitleItem = SHOP_ITEMS.find((it) => it.id === bundleTitleId)

      setPreviewFrameId(bundleFrame || null)
      setPreviewEffectId(bundleEffect || null)
      setPreviewTitleText(bundleTitleItem?.name || null)
    }

    // Always expand preview studio
    setIsPreviewExpanded(true)

    // Trigger visual pulse glow on studio
    setStudioPulse(true)
    setTimeout(() => setStudioPulse(false), 2400)

    // Smooth scroll directly to the live preview studio
    setTimeout(() => {
      const studioEl = document.getElementById("live-preview-studio")
      if (studioEl) {
        studioEl.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 80)
  }

  // Filter items
  const filteredItems = React.useMemo(() => {
    return SHOP_ITEMS.filter((item) => {
      // Collection filter
      if (selectedCollection !== "all" && item.collection !== selectedCollection) {
        return false
      }

      // Category filter
      if (activeCategory === "sale") {
        if (item.price >= item.originalPrice) return false
      } else if (activeCategory !== "all" && item.category !== activeCategory) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = item.name.toLowerCase().includes(q)
        const matchDesc = item.desc.toLowerCase().includes(q)
        const matchBadge = item.badgeText?.toLowerCase().includes(q)
        if (!matchName && !matchDesc && !matchBadge) return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price
      if (sortBy === "price_desc") return b.price - a.price
      if (sortBy === "rarity") return RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity]
      if (sortBy === "discount") {
        const discA = ((a.originalPrice - a.price) / a.originalPrice) * 100
        const discB = ((b.originalPrice - b.price) / b.originalPrice) * 100
        return discB - discA
      }
      // Recommended: featured first, then rarity
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity]
    })
  }, [selectedCollection, activeCategory, searchQuery, sortBy])

  // Category counts
  const categoryCounts = React.useMemo(() => {
    return {
      all: SHOP_ITEMS.length,
      bundle: SHOP_ITEMS.filter((i) => i.category === "bundle").length,
      effect: SHOP_ITEMS.filter((i) => i.category === "effect").length,
      frame: SHOP_ITEMS.filter((i) => i.category === "frame").length,
      title: SHOP_ITEMS.filter((i) => i.category === "title").length,
      utility: SHOP_ITEMS.filter((i) => i.category === "utility").length,
      sale: SHOP_ITEMS.filter((i) => i.price < i.originalPrice).length
    }
  }, [])

  // Themed Collection Bundles (Tüm Setler)
  const allBundles = React.useMemo(() => {
    return SHOP_ITEMS.filter((i) => i.category === "bundle")
  }, [])

  const [selectedBundleId, setSelectedBundleId] = React.useState<string>("bundle_cyber")
  const activeBundle = React.useMemo(() => {
    return allBundles.find((b) => b.id === selectedBundleId) || allBundles[0]
  }, [allBundles, selectedBundleId])

  // Helper to extract bundle items and ownership status
  const getBundleDetails = React.useCallback(
    (bundle: ShopItem) => {
      const frameItem = SHOP_ITEMS.find((it) => it.category === "frame" && bundle.bundleItemIds?.includes(it.id))
      const effectItem = SHOP_ITEMS.find((it) => it.category === "effect" && bundle.bundleItemIds?.includes(it.id))
      const titleItem = SHOP_ITEMS.find((it) => it.category === "title" && bundle.bundleItemIds?.includes(it.id))
      const isFullyOwned =
        (bundle.bundleItemIds || []).every((id) => inventory.includes(id)) || inventory.includes(bundle.id)
      const isFullyEquipped =
        (frameItem ? equippedFrame === frameItem.id : true) &&
        (effectItem ? equippedProfileEffect === effectItem.id : true) &&
        (titleItem ? equippedTitle === titleItem.name : true)

      return { frameItem, effectItem, titleItem, isFullyOwned, isFullyEquipped }
    },
    [inventory, equippedFrame, equippedProfileEffect, equippedTitle]
  )

  // CS2 Case Opening trigger
  const handleOpenCs2Case = () => {
    setCs2ModalOpen(true)
  }

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#080b12] text-zinc-100 selection:bg-indigo-500/30">
      <div className="pb-28 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* ─────────────────────────────────────────────────────────────
            1. FOCUSFLOW ATMOSPHERIC HERO BANNER
        ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-950/60 via-[#0d1222]/90 to-purple-950/50 p-6 sm:p-8 mb-8 shadow-2xl backdrop-blur-xl">
        {/* Animated ambient glow spots */}
        <motion.div
          className="absolute top-0 right-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-10 left-10 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.05, 0.15, 0.05] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
        />

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3 tracking-wide"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" style={{ animationDuration: '3s' }} />
              <span>FOCUSFLOW KOZMETİK MAĞAZASI</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3"
            >
              <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                Mağaza
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-medium">
                v2.5 PRO
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-zinc-400 text-sm max-w-lg leading-relaxed"
            >
              Profil efektleri, efsanevi çerçeveler, prestij unvanları ve şans kasalarıyla profilini özelleştir.
            </motion.p>
          </div>

          {/* Quick Stats & Balances */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center gap-3"
          >
            {/* Focus Coins - Premium Style */}
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-yellow-500/10 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.12)] hover:shadow-[0_0_35px_rgba(245,158,11,0.2)] transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-600/20 flex items-center justify-center text-amber-300 border border-amber-500/40 shadow-inner">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-amber-400/80 tracking-wider uppercase">Bakiye</div>
                <div className="text-2xl font-black text-amber-300 tracking-tight leading-none">
                  {focusCoins.toLocaleString()}
                  <span className="text-sm font-normal text-amber-400/60 ml-1">🪙</span>
                </div>
              </div>
            </div>

            {/* Streak Freezes */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.1)]">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-300 border border-sky-500/40">
                <Snowflake className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-sky-400/80 tracking-wider uppercase">Kalkan</div>
                <div className="text-xl font-black text-sky-300 tracking-tight leading-none flex items-baseline gap-1">
                  {streakFreezes}
                  <span className="text-xs font-normal text-sky-400/60">gün</span>
                </div>
              </div>
            </div>

            {/* CS2 Case Opening Button - More Premium */}
            <button
              onClick={handleOpenCs2Case}
              className="group relative flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-amber-500/15 to-orange-500/20 border border-amber-500/40 hover:border-amber-400 transition-all hover:scale-[1.03] active:scale-[0.98] shadow-lg cursor-pointer overflow-hidden"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/40 to-yellow-600/30 flex items-center justify-center text-amber-300 group-hover:rotate-12 transition-transform border border-amber-500/50">
                <Gift className="w-5 h-5" />
              </div>
              <div className="relative text-left">
                <div className="text-[10px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
                  <span>Şans Kasası</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-[9px] text-amber-200 font-mono">150 🪙</span>
                </div>
                <div className="text-sm font-black text-white group-hover:text-amber-200 transition-colors">
                  Kasayı Aç! 🎰
                </div>
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FOCUSFLOW INTERACTIVE LIVE PREVIEW STUDIO (DENEME KABİNİ)
      ───────────────────────────────────────────────────────────── */}
      <div
        id="live-preview-studio"
        className={cn(
          "scroll-mt-6 mb-8 rounded-3xl border bg-gradient-to-b from-[#101426] to-[#0a0d18] shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-500",
          studioPulse
            ? "border-cyan-400 ring-4 ring-cyan-400/50 shadow-[0_0_50px_rgba(6,182,212,0.45)]"
            : "border-indigo-500/30"
        )}
      >
        {/* Studio Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span>Canlı Profil Deneme Kabini</span>
                {hasActivePreview && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold animate-pulse border border-cyan-500/30">
                    ÖNİZLEME AKTİF
                  </span>
                )}
                {studioPulse && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold animate-bounce border border-emerald-500/40">
                    CANLI UYGULANDI ✨
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Aşağıdaki eşyaların üzerindeki &quot;Dene&quot; butonuna basarak FocusFlow profil kartında anında canlandır!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasActivePreview && (
              <button
                onClick={resetPreview}
                className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sıfırla</span>
              </button>
            )}
            <button
              onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title={isPreviewExpanded ? "Kompakt Yap" : "Genişlet"}
            >
              {isPreviewExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isPreviewExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 overflow-hidden"
            >
              <div className="max-w-2xl mx-auto">
                {/* FOCUSFLOW CARD CONTAINER */}
                <div className="relative rounded-2xl border border-white/15 bg-[#181c2b] shadow-2xl overflow-hidden group">
                  {/* Top FocusFlow Banner with ProfileEffectOverlay */}
                  <div className="relative h-32 w-full bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900/80 overflow-hidden">
                    {/* Render active or previewed profile effect */}
                    <ProfileEffectOverlay effectId={currentEffectiveEffect} />

                    {/* Banner Tag */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[11px] font-mono text-zinc-300">
                      <span>FocusFlow Profil Görünümü</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 pb-6 pt-0 relative z-20 bg-[#121522]">
                    {/* Avatar positioned over banner */}
                    <div className="flex justify-between items-end -mt-14 mb-3">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-24 h-24 rounded-full bg-zinc-900 p-1 flex items-center justify-center shadow-2xl transition-all duration-300 border-4 overflow-hidden",
                            currentEffectiveFrame && FRAME_STYLES[currentEffectiveFrame]
                              ? FRAME_STYLES[currentEffectiveFrame]
                              : "border-[#121522]"
                          )}
                        >
                          {user?.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt="Profil Fotoğrafı"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl font-black shadow-inner">
                              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "FF"}
                            </div>
                          )}
                        </div>

                        {/* Real User Level Badge on Avatar */}
                        <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/20 text-[10px] font-black uppercase text-amber-400 shadow-lg">
                          LvL {myStats.level || 1}
                        </div>

                        {/* Online Status Dot */}
                        <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121522] shadow-[0_0_8px_#10b981]" />
                      </div>

                      {/* Quick Active Effect & Frame Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {currentEffectiveEffect && (
                          <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>Efekt: {SHOP_ITEMS.find((it) => it.id === currentEffectiveEffect)?.name || "Özel"}</span>
                          </div>
                        )}
                        {currentEffectiveFrame && (
                          <div className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-1.5 shadow-sm">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Çerçeve: {SHOP_ITEMS.find((it) => it.id === currentEffectiveFrame)?.name || "Özel"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name, Rank & Badges */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl font-extrabold text-white tracking-tight">
                          {user?.displayName || "FocusFlow Kullanıcısı"}
                        </h2>
                        {/* FocusFlow Pro badge */}
                        <span className="px-2 py-0.5 rounded bg-indigo-500/25 border border-indigo-500/40 text-[10px] font-bold text-indigo-300">
                          PRO
                        </span>

                        {/* Real User Rank Badge */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold">
                          <Hexagon className={cn("w-3.5 h-3.5", rank.color)} />
                          <span className={rank.color}>{rank.name}</span>
                        </div>

                        {/* Real Streak Count */}
                        <span className="px-2 py-0.5 rounded bg-amber-500/25 border border-amber-500/40 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span>{settings.streakCount || myStats.currentStreak || 0} Gün Seri</span>
                        </span>
                      </div>

                      {/* Equipped Title Pill */}
                      {currentEffectiveTitle && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>{currentEffectiveTitle}</span>
                        </div>
                      )}

                      {/* Real Showcase Badges from Settings */}
                      {settings.showcaseBadges && settings.showcaseBadges.some((b) => b !== null) && (
                        <div className="flex items-center gap-1.5 pt-1">
                          {settings.showcaseBadges.map((badgeId, bIdx) => {
                            if (!badgeId) return null
                            const badge = BADGES.find((b) => b.id === badgeId)
                            if (!badge) return null
                            const IconComponent = badge.icon
                            return (
                              <div
                                key={bIdx}
                                className={cn("w-6 h-6 rounded-md flex items-center justify-center border shadow-sm", badge.color)}
                                title={badge.name}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Status / Bio */}
                      <div className="pt-2 text-xs text-zinc-400 border-t border-white/5 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="italic text-zinc-300">
                          {settings.bio || "🚀 FocusFlow ile hiper odak modunda. Görevleri tamamlayarak ligde yükseliyor!"}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                          Kullanıcı Kodu: {user?.uid?.slice(0, 6) || "oyuncu"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE BUNDLE SETS SHOWCASE (CANLI GÖRÜNÜM SET VİTRİNİ)
      ───────────────────────────────────────────────────────────── */}
      {allBundles.length > 0 && activeBundle && (() => {
        const { frameItem, effectItem, titleItem, isFullyOwned, isFullyEquipped } = getBundleDetails(activeBundle)
        const frameStyle = frameItem ? FRAME_STYLES[frameItem.id] : null
        const effectId = effectItem ? (effectItem.effectType || effectItem.id) : null
        const titleText = titleItem ? titleItem.name : null
        const savings = activeBundle.originalPrice - activeBundle.price
        const discountPct = Math.round((savings / activeBundle.originalPrice) * 100)

        return (
          <div className="relative mb-10 rounded-3xl overflow-hidden border border-indigo-500/30 bg-gradient-to-br from-[#0e1324] via-[#090d1a] to-[#120e24] p-6 sm:p-8 shadow-2xl">
            {/* Ambient atmospheric glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Showcase Header & Set Selector Pills */}
            <div className="relative z-10 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wider uppercase mb-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>ÖZEL KOLEKSİYON SETLERİ & CANLI VİTRİN</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Uyumlu Profil Paketleri
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Setlerin profilinde nasıl durduğunu anında canlı gör ve indirimli fiyata tek tıkla satın al!
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs font-mono text-zinc-400">
                    Mevcut Bakiye: <strong className="text-amber-400 font-bold">{focusCoins} 🪙</strong>
                  </span>
                </div>
              </div>

              {/* Set Selector Tabs (Tüm Setler) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {allBundles.map((b) => {
                  const bDetails = getBundleDetails(b)
                  const isSelected = b.id === activeBundle.id
                  const bSavings = b.originalPrice - b.price
                  const bDisc = Math.round((bSavings / b.originalPrice) * 100)
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBundleId(b.id)}
                      className={cn(
                        "px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer",
                        isSelected
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105"
                          : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <span>{b.name.split(" ")[0]}</span>
                      <span>{b.name.replace(/^[^\s]+\s*/, "").replace(/\s*(Koleksiyon Paketi|Tam Koleksiyonu|Paketi|Seti)$/, "")}</span>
                      {bDetails.isFullyOwned ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Sahipsin
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          -%{bDisc}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active Set Showcase Grid (Live Avatar Preview on Left + Set Info/Purchase on Right) */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* LEFT / CENTER: DIRECT LIVE PREVIEW CARD OF THIS SPECIFIC SET */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[#141829] shadow-2xl overflow-hidden group">
                  
                  {/* Banner with THIS set's Profile Effect */}
                  <div className="relative h-28 w-full bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-950 overflow-hidden">
                    <ProfileEffectOverlay effectId={effectId} />
                    
                    {/* Live Preview badge */}
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono text-cyan-300">
                      <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                      <span>CANLI SET GÖRÜNÜMÜ</span>
                    </div>
                  </div>

                  {/* Body with Avatar wearing THIS set's Frame & Title */}
                  <div className="px-5 pb-5 pt-0 relative z-20 bg-[#101322]">
                    <div className="flex justify-between items-end -mt-12 mb-3">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-20 h-20 rounded-full bg-zinc-900 p-1 flex items-center justify-center shadow-2xl transition-all duration-300 border-4 overflow-hidden",
                            frameStyle ? frameStyle : "border-[#101322]"
                          )}
                        >
                          {user?.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt="Avatar"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {userInitials}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Collection badge */}
                      <div className="text-right pb-1">
                        <span className="text-[11px] font-mono text-zinc-400 uppercase">
                          {activeBundle.collection?.toUpperCase() || "ÖZEL"} KOLEKSİYONU
                        </span>
                      </div>
                    </div>

                    {/* Name & Set Title */}
                    <div className="space-y-1.5">
                      <div className="text-base font-black text-white truncate">
                        {user?.displayName || "Odakçı"}
                      </div>

                      {/* THIS set's Title */}
                      {titleText && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>{titleText}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-zinc-400 italic pt-1">
                        &quot;Bu seti aldığında profilin ve topluluk kartın tam olarak böyle görünecek.&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: SET DETAILS & 1-CLICK PURCHASE */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      %{discountPct} İndirim Fırsatı
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      3 Eşya Bir Arada
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                    {activeBundle.name}
                  </h3>

                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {activeBundle.desc}
                  </p>
                </div>

                {/* Included 3 items with mini visual chips */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Paket İçeriği (Tam Uyumlu 3 Parça)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Frame */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-zinc-400">Çerçeve</div>
                        <div className="text-xs font-bold text-white truncate">
                          {frameItem?.name || "Özel Çerçeve"}
                        </div>
                      </div>
                    </div>

                    {/* Effect */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-zinc-400">Profil Efekti</div>
                        <div className="text-xs font-bold text-white truncate">
                          {effectItem?.name || "Canlı Efekt"}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-zinc-400">Özel Unvan</div>
                        <div className="text-xs font-bold text-white truncate">
                          {titleItem?.name || "Prestij Unvanı"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price & Action Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-zinc-500 line-through font-mono">
                      {activeBundle.originalPrice} 🪙
                    </span>
                    <span className="text-3xl font-black text-amber-400">
                      {activeBundle.price} Focus Para
                    </span>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {savings} 🪙 Tasarruf
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {isFullyOwned ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Bu Sete Sahipsin</span>
                        </div>
                        <button
                          onClick={() => equipBundle(activeBundle)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Tüm Seti Kuşan ✨</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => buyItem(activeBundle)}
                        disabled={focusCoins < activeBundle.price}
                        className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm shadow-xl shadow-emerald-500/25 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Paketi Satın Al (%{discountPct} İndirim)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ─────────────────────────────────────────────────────────────
          4. THEMED COLLECTIONS PILLS (FOCUSFLOW KOLEKSİYON SEÇİCİ)
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Koleksiyon Temaları</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {COLLECTIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCollection(c.id)}
              className={cn(
                "px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer",
                selectedCollection === c.id
                  ? "bg-indigo-600/30 text-indigo-200 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. CATEGORY TABS & SEARCH & SORT CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          {[
            { id: "all", label: "Tümü", icon: Sparkles, count: categoryCounts.all },
            { id: "bundle", label: "Koleksiyon Paketleri", icon: Package, count: categoryCounts.bundle },
            { id: "effect", label: "Profil Efektleri", icon: Sparkles, count: categoryCounts.effect },
            { id: "frame", label: "Çerçeveler", icon: Crown, count: categoryCounts.frame },
            { id: "title", label: "Unvanlar", icon: Award, count: categoryCounts.title },
            { id: "utility", label: "Güçlendiriciler & Sandık", icon: Zap, count: categoryCounts.utility },
            { id: "sale", label: "🔥 Kampanyalı", icon: Tag, count: categoryCounts.sale }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as FilterCategory)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer",
                  isActive
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30"
                    : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-zinc-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search and Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Eşya adı, efekt veya unvan ara..."
              className="w-full bg-[#101422] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sırala:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#101422] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="recommended">Önerilen</option>
              <option value="rarity">Nadirlik Seviyesi</option>
              <option value="discount">En Yüksek İndirim</option>
              <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
              <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. FOCUSFLOW ITEM GRID
      ───────────────────────────────────────────────────────────── */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
          <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Aradığınız kriterde ürün bulunamadı</h3>
          <p className="text-xs text-zinc-400 mt-1">Filtreleri temizleyerek veya farklı bir arama yaparak tekrar deneyin.</p>
          <button
            onClick={() => {
              setSelectedCollection("all")
              setActiveCategory("all")
              setSearchQuery("")
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : (() => {
        // Group items by category for organized display
        const categoryOrder: { key: string; label: string; icon: typeof Sparkles; gradient: string; desc: string }[] = [
          { key: "bundle", label: "Koleksiyon Paketleri", icon: Package, gradient: "from-amber-500/20 to-orange-500/20", desc: "Çerçeve, efekt ve unvan bir arada" },
          { key: "effect", label: "Profil Efektleri", icon: Sparkles, gradient: "from-purple-500/20 to-indigo-500/20", desc: "Profilini canlandıran hareketli efektler" },
          { key: "frame", label: "Avatar Çerçeveleri", icon: Crown, gradient: "from-indigo-500/20 to-cyan-500/20", desc: "Avatarını süsleyen özel kenarlıklar" },
          { key: "title", label: "Prestij Unvanları", icon: Award, gradient: "from-pink-500/20 to-rose-500/20", desc: "Profilinde sergileyeceğin özel isimler" },
          { key: "utility", label: "Güçlendiriciler & Araçlar", icon: Zap, gradient: "from-emerald-500/20 to-teal-500/20", desc: "Seri korumaları, çarpanlar ve kasalar" }
        ]

        const grouped = categoryOrder
          .map((cat) => ({
            ...cat,
            items: filteredItems.filter((item) => item.category === cat.key)
          }))
          .filter((cat) => cat.items.length > 0)

        return (
          <div className="space-y-10">
            {grouped.map((group) => {
              const SectionIcon = group.icon
              return (
                <div key={group.key}>
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center border border-white/10 shadow-lg",
                        group.gradient
                      )}>
                        <SectionIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white">{group.label}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-mono">{group.items.length}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500">{group.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className={cn(
                    "grid gap-5",
                    group.key === "bundle"
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  )}>
                    {group.items.map((item) => {
            const isBundle = item.category === "bundle"
            const isOwned = isBundle
              ? inventory.includes(item.id) || (item.bundleItemIds || []).every((id) => inventory.includes(id))
              : inventory.includes(item.id)
            const isFrameEquipped = equippedFrame === item.id
            const isEffectEquipped = equippedProfileEffect === item.id
            const isTitleEquipped = equippedTitle === item.name
            const isBundleEquipped = isBundle && (item.bundleItemIds || []).every((id) => {
              if (id.startsWith("frame_")) return equippedFrame === id
              if (id.startsWith("effect_")) return equippedProfileEffect === id
              if (id.startsWith("title_")) {
                const tItem = SHOP_ITEMS.find((it) => it.id === id)
                return equippedTitle === tItem?.name
              }
              return true
            })
            const isEquipped = isFrameEquipped || isEffectEquipped || isTitleEquipped || isBundleEquipped

            const isCurrentlyPreviewed =
              previewFrameId === item.id ||
              previewEffectId === item.id ||
              previewTitleText === item.name

            const returnStatus = getReturnStatus(item.id)
            const rarityCfg = RARITY_CONFIG[item.rarity]
            const discountPercent =
              item.originalPrice > item.price
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : 0

            // Detect mythic/prestige for extra styling
            const isMythic = item.collection === "mythic"
            const isPrestige = item.collection === "prestige"

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative rounded-3xl border bg-gradient-to-b from-[#111627] to-[#0c0f1d] p-5 flex flex-col justify-between overflow-hidden group shadow-xl transition-all",
                  rarityCfg.border,
                  isEquipped && "ring-2 ring-indigo-500/70",
                  isMythic && "ring-2 ring-fuchsia-500/50 border-fuchsia-500/40",
                  isPrestige && "ring-2 ring-violet-500/40 border-violet-500/30"
                )}
                style={{
                  boxShadow: isMythic
                    ? `0 0 30px -5px rgba(236, 72, 153, 0.5), 0 0 15px -3px ${rarityCfg.glow}`
                    : isPrestige
                    ? `0 0 25px -5px rgba(139, 92, 246, 0.4), 0 0 12px -3px ${rarityCfg.glow}`
                    : `0 0 20px -5px ${rarityCfg.glow}`
                }}
              >
                {/* Mythic/Prestige shimmer overlay */}
                {isMythic && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                )}
                {isPrestige && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
                )}

                {/* Top Badges */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Rarity badge */}
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider",
                        rarityCfg.bg,
                        rarityCfg.color,
                        rarityCfg.border
                      )}
                    >
                      {rarityCfg.label}
                    </span>

                    {/* Discount badge */}
                    {discountPercent > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        -%{discountPercent}
                      </span>
                    )}

                    {/* Custom badge */}
                    {item.badgeText && (
                      <span className={cn(
                        "text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase",
                        isMythic
                          ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40"
                          : isPrestige
                          ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                          : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                      )}>
                        {item.badgeText}
                      </span>
                    )}
                  </div>

                  {/* Return policy badge */}
                  {isOwned && returnStatus.canReturn && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>İade</span>
                    </span>
                  )}
                </div>

                {/* ── Visual Item Preview Box ── */}
                <div className="relative h-36 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden mb-4 group-hover:border-white/20 transition-colors">
                  {/* Category = Effect */}
                  {item.category === "effect" && (
                    <div className="absolute inset-0">
                      <ProfileEffectOverlay effectId={item.effectType || item.id} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/25 shadow-xl bg-zinc-900 relative">
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
                        <span className="text-[10px] font-mono font-bold text-indigo-200 mt-1 drop-shadow">
                          Profil Efekti
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Category = Frame */}
                  {item.category === "frame" && (
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full bg-zinc-800 p-0.5 flex items-center justify-center border-4 shadow-lg transition-transform group-hover:scale-105",
                          item.previewStyle
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

                  {/* Category = Title */}
                  {item.category === "title" && (
                    <div className="relative z-10 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-200 text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>{item.name}</span>
                    </div>
                  )}

                  {/* Category = Bundle */}
                  {item.category === "bundle" && (() => {
                    const bDetails = getBundleDetails(item)
                    const bFrameStyle = bDetails.frameItem ? FRAME_STYLES[bDetails.frameItem.id] : null
                    const bEffectId = bDetails.effectItem ? (bDetails.effectItem.effectType || bDetails.effectItem.id) : null
                    const bTitleName = bDetails.titleItem ? bDetails.titleItem.name : null

                    return (
                      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                        {/* Live background effect for this bundle */}
                        {bEffectId && (
                          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-60">
                            <ProfileEffectOverlay effectId={bEffectId} intensity="subtle" />
                          </div>
                        )}

                        {/* Avatar wearing THIS bundle's Frame! */}
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

                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 border border-white/20 flex items-center justify-center shadow-lg text-white">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                          </div>
                        </div>

                        {/* Bundle Title Pill */}
                        {bTitleName && (
                          <div className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 truncate max-w-[130px] z-20">
                            👑 {bTitleName}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Category = Utility */}
                  {item.category === "utility" && (
                    <div className="relative z-10 flex flex-col items-center">
                      {item.id === "chest_mystery" ? (
                        <Gift className="w-14 h-14 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-bounce" />
                      ) : item.id.includes("freeze") ? (
                        <Snowflake className="w-12 h-12 text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]" />
                      ) : (
                        <Zap className="w-12 h-12 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                      )}
                    </div>
                  )}

                  {/* Try-on eye button overlay */}
                  {(item.category === "frame" ||
                    item.category === "effect" ||
                    item.category === "title" ||
                    item.category === "bundle") && (
                    <button
                      onClick={() => handleTryOn(item)}
                      className={cn(
                        "absolute top-2 right-2 z-30 p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                        isCurrentlyPreviewed
                          ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/50"
                          : "bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/10"
                      )}
                      title="Canlı Kabinde Dene"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[10px]">
                        {isCurrentlyPreviewed ? "Deneniyor" : "Dene"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-4 relative z-10">
                  <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Price & Action Area */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 relative z-10">
                  <div>
                    {item.originalPrice > item.price && (
                      <div className="text-[10px] text-zinc-500 line-through">
                        {item.originalPrice.toLocaleString()} 🪙
                      </div>
                    )}
                    <div className="text-sm font-black text-amber-400 flex items-center gap-1">
                      <span>{item.price.toLocaleString()}</span>
                      <span className="text-xs font-normal text-amber-400/80">🪙</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {item.id === "chest_mystery" ? (
                      <button
                        onClick={handleOpenCs2Case}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/30 hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Kasayı Aç 🎰</span>
                      </button>
                    ) : isOwned && (item.category === "frame" || item.category === "effect" || item.category === "title" || item.category === "bundle") ? (
                      <>
                        <button
                          onClick={() => item.category === "bundle" ? equipBundle(item) : equipItem(item)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                            isEquipped
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white"
                          )}
                        >
                          <Check className="w-3 h-3" />
                          <span>{isEquipped ? "Kuşanıldı" : item.category === "bundle" ? "Seti Kuşan" : "Kuşan"}</span>
                        </button>
                        {returnStatus.canReturn && (
                          <button
                            onClick={() => setReturnConfirmItem(item)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-300 border border-white/10 transition-colors"
                            title="3 Gün İçinde İade Et"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => buyItem(item)}
                        disabled={focusCoins < item.price}
                        className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-indigo-600 text-white font-bold text-xs border border-white/10 hover:border-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Satın Al</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ─────────────────────────────────────────────────────────────
          7. CS2 CASE OPENING MODAL (ŞANS SANDIĞI ÇARK SİSTEMİ)
      ───────────────────────────────────────────────────────────── */}
      <Cs2CaseOpeningModal
        isOpen={cs2ModalOpen}
        onClose={() => setCs2ModalOpen(false)}
        focusCoins={focusCoins}
        onOpenCase={openCs2Case}
      />

      {/* ─────────────────────────────────────────────────────────────
          8. REFUND CONFIRMATION MODAL (3 GÜN İADE POLİTİKASI)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {returnConfirmItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#121626] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">İadeyi Onaylıyor musun?</h3>
                  <p className="text-xs text-zinc-400">3 Günlük koşulsuz iade garantisi</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                <strong className="text-white">&quot;{returnConfirmItem.name}&quot;</strong> eşyasını iade ettiğinde, ödediğin{" "}
                <strong className="text-amber-400 font-bold">{returnConfirmItem.price} Focus Parası</strong> anında hesabına geri yüklenecek ve eşya envanterinden kaldırılacaktır.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => setReturnConfirmItem(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    returnItem(returnConfirmItem)
                    setReturnConfirmItem(null)
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Evet, İade Et</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          9. BOTTOM INFO FOOTER (FOCUSFLOW VIBES & POLICY)
      ───────────────────────────────────────────────────────────── */}
      <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">FocusFlow Profil Efektleri</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Profil efektleri ve çerçeveler profilinde ve Topluluk liderlik kartlarında anında canlanır.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">72 Saatlik İade Garantisi</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Satın aldığın eşyaları veya paketleri 3 gün içerisinde tam para iadesiyle iade edebilirsin.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Focus Para Nasıl Kazanılır?</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Görev tamamlayarak, pomodoro odak seansları yaparak ve günlük serini koruyarak para biriktir.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
