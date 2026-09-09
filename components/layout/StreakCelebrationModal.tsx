"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, AnimatePresence } from "motion/react"
import { Flame, Zap, Shield, AlertTriangle, Star, Sparkles, Target, Orbit, Crown, Skull, X } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"

/* ═════════════════════════════════════ */
/*  Types                                */
/* ═════════════════════════════════════ */

type ModalMode = "celebration" | "warning"

interface StreakCelebrationModalProps {
  mode: ModalMode
  streakCount: number
  onClose: () => void
}

/* ═════════════════════════════════════ */
/*  Tier System                          */
/* ═════════════════════════════════════ */

function getStreakTier(count: number) {
  if (count >= 100) return {
    label: "EFSANE",
    emoji: "👑",
    icon: Crown,
    bg: "linear-gradient(145deg, #180518 0%, #050505 40%, #180518 100%)",
    border: "rgba(217,70,239,0.35)",
    glow: "rgba(217,70,239,0.4)",
    shimmer: "rgba(217,70,239,0.15)",
    pulseGlow: "bg-fuchsia-500/40",
    trophyGrad: "from-fuchsia-300 via-fuchsia-500 to-fuchsia-600",
    trophyShadow: "rgba(217,70,239,0.6)",
    trophyInner: "from-fuchsia-500/20",
    icoCol: "text-fuchsia-400",
    icoDrop: "rgba(217,70,239,0.8)",
    spark: "text-fuchsia-300",
    sparkDrop: "rgba(217,70,239,0.8)",
    botStar: "text-fuchsia-200 fill-fuchsia-200",
    botStarDrop: "rgba(217,70,239,0.8)",
    titleText: "from-fuchsia-100 via-fuchsia-300 to-fuchsia-600",
    divider: "bg-fuchsia-500/50",
    descColor: "text-fuchsia-200/80",
    innerBorder: "border-fuchsia-500/20",
    blurRing: "bg-fuchsia-500/10",
    confetti: ["bg-fuchsia-400", "bg-fuchsia-300", "bg-white", "bg-amber-300"],
    packBg: "linear-gradient(145deg, #1a0518 0%, #0d040a 30%, #1a0518 50%, #0d040a 70%, #1a0518 100%)",
    packBorder: "2px solid rgba(217,70,239,0.25)",
    packShadow: "0 0 20px rgba(217,70,239,0.15), 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(217,70,239,0.2), inset 0 -1px 0 rgba(217,70,239,0.1)",
    goldBar: "from-fuchsia-700 via-fuchsia-400 to-fuchsia-700",
    cornerBorder: "border-fuchsia-500/40",
    innerFrameBorder: "border-fuchsia-500/20",
    dotColor: "rgba(217,70,239,1)",
    particleColor: "bg-fuchsia-400/60",
    logoBorder: "border-fuchsia-500/30",
    logoShadow: "shadow-[0_0_30px_rgba(217,70,239,0.3)]",
    logoGlow: "bg-fuchsia-500/30",
    subtitleColor: "text-fuchsia-400/50",
    lineColor: "via-fuchsia-500/60",
    titleGradient: "from-fuchsia-200 via-fuchsia-400 to-fuchsia-600",
    mysteryGrad: "from-fuchsia-500/20 to-fuchsia-700/10",
    mysteryBorder: "border-fuchsia-500/30",
    mysteryShadow: "shadow-[0_0_20px_rgba(217,70,239,0.2)]",
    mysteryText: "from-fuchsia-200 to-fuchsia-500",
    outerGlow: "linear-gradient(135deg, rgba(217,70,239,0.4), transparent 40%, rgba(192,38,211,0.3), transparent 70%, rgba(168,85,247,0.4))",
    conicGlow: "conic-gradient(from 0deg, transparent, rgba(217,70,239,0.6), transparent, rgba(192,38,211,0.4), transparent)",
  }
  if (count >= 30) return {
    label: count >= 60 ? "SARSILMAZ" : "YARI TANRI",
    emoji: count >= 60 ? "🛡️" : "⚡",
    icon: Shield,
    bg: "linear-gradient(145deg, #1a0505 0%, #050505 40%, #1a0505 100%)",
    border: "rgba(239,68,68,0.35)",
    glow: "rgba(239,68,68,0.4)",
    shimmer: "rgba(239,68,68,0.15)",
    pulseGlow: "bg-red-500/40",
    trophyGrad: "from-red-300 via-red-500 to-red-600",
    trophyShadow: "rgba(239,68,68,0.6)",
    trophyInner: "from-red-500/20",
    icoCol: "text-red-400",
    icoDrop: "rgba(239,68,68,0.8)",
    spark: "text-red-300",
    sparkDrop: "rgba(239,68,68,0.8)",
    botStar: "text-red-200 fill-red-200",
    botStarDrop: "rgba(239,68,68,0.8)",
    titleText: "from-red-100 via-red-300 to-red-600",
    divider: "bg-red-500/50",
    descColor: "text-red-200/80",
    innerBorder: "border-red-500/20",
    blurRing: "bg-red-500/10",
    confetti: ["bg-red-400", "bg-red-300", "bg-white", "bg-amber-300"],
    packBg: "linear-gradient(145deg, #1a0808 0%, #0d0404 30%, #1a0808 50%, #0d0404 70%, #1a0808 100%)",
    packBorder: "2px solid rgba(239,68,68,0.25)",
    packShadow: "0 0 20px rgba(239,68,68,0.15), 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(239,68,68,0.2)",
    goldBar: "from-red-700 via-red-400 to-red-700",
    cornerBorder: "border-red-500/40",
    innerFrameBorder: "border-red-500/20",
    dotColor: "rgba(239,68,68,1)",
    particleColor: "bg-red-400/60",
    logoBorder: "border-red-500/30",
    logoShadow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
    logoGlow: "bg-red-500/30",
    subtitleColor: "text-red-400/50",
    lineColor: "via-red-500/60",
    titleGradient: "from-red-200 via-red-400 to-red-600",
    mysteryGrad: "from-red-500/20 to-red-700/10",
    mysteryBorder: "border-red-500/30",
    mysteryShadow: "shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    mysteryText: "from-red-200 to-red-500",
    outerGlow: "linear-gradient(135deg, rgba(239,68,68,0.4), transparent 40%, rgba(220,38,38,0.3), transparent 70%, rgba(185,28,28,0.4))",
    conicGlow: "conic-gradient(from 0deg, transparent, rgba(239,68,68,0.6), transparent, rgba(220,38,38,0.4), transparent)",
  }
  // Default: amber/orange flame for count < 30
  return {
    label: count >= 14 ? "İSTİKRARLI" : count >= 7 ? "DURDURULAMAZ" : count >= 3 ? "ISINMA" : "BAŞLANGIÇ",
    emoji: count >= 14 ? "🔥" : count >= 7 ? "💪" : count >= 3 ? "🌟" : "✨",
    icon: count >= 7 ? Zap : Flame,
    bg: "linear-gradient(145deg, #1a1005 0%, #050505 40%, #1a1005 100%)",
    border: "rgba(245,158,11,0.35)",
    glow: "rgba(245,158,11,0.4)",
    shimmer: "rgba(245,158,11,0.15)",
    pulseGlow: "bg-amber-500/40",
    trophyGrad: "from-amber-300 via-amber-500 to-amber-600",
    trophyShadow: "rgba(245,158,11,0.6)",
    trophyInner: "from-amber-500/20",
    icoCol: "text-amber-400",
    icoDrop: "rgba(245,158,11,0.8)",
    spark: "text-amber-300",
    sparkDrop: "rgba(245,158,11,0.8)",
    botStar: "text-amber-200 fill-amber-200",
    botStarDrop: "rgba(245,158,11,0.8)",
    titleText: "from-amber-100 via-amber-300 to-amber-600",
    divider: "bg-amber-500/50",
    descColor: "text-amber-200/80",
    innerBorder: "border-amber-500/20",
    blurRing: "bg-amber-500/10",
    confetti: ["bg-amber-400", "bg-amber-300", "bg-white", "bg-yellow-200"],
    packBg: "linear-gradient(145deg, #1a1508 0%, #0d0a04 30%, #1a1508 50%, #0d0a04 70%, #1a1508 100%)",
    packBorder: "2px solid rgba(251,191,36,0.25)",
    packShadow: "0 0 20px rgba(251,191,36,0.15), 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(251,191,36,0.2), inset 0 -1px 0 rgba(251,191,36,0.1)",
    goldBar: "from-yellow-700 via-amber-400 to-yellow-700",
    cornerBorder: "border-amber-500/40",
    innerFrameBorder: "border-amber-500/20",
    dotColor: "rgba(251,191,36,1)",
    particleColor: "bg-amber-400/60",
    logoBorder: "border-amber-500/30",
    logoShadow: "shadow-[0_0_30px_rgba(251,191,36,0.3)]",
    logoGlow: "bg-amber-500/30",
    subtitleColor: "text-amber-400/50",
    lineColor: "via-amber-500/60",
    titleGradient: "from-amber-200 via-amber-400 to-amber-600",
    mysteryGrad: "from-amber-500/20 to-amber-700/10",
    mysteryBorder: "border-amber-500/30",
    mysteryShadow: "shadow-[0_0_20px_rgba(251,191,36,0.2)]",
    mysteryText: "from-amber-200 to-amber-500",
    outerGlow: "linear-gradient(135deg, rgba(251,191,36,0.4), transparent 40%, rgba(245,158,11,0.3), transparent 70%, rgba(217,119,6,0.4))",
    conicGlow: "conic-gradient(from 0deg, transparent, rgba(251,191,36,0.6), transparent, rgba(245,158,11,0.4), transparent)",
  }
}

// Warning tier (rose theme)
const WARNING_TIER = {
  bg: "linear-gradient(145deg, #1a0610 0%, #050505 40%, #1a0610 100%)",
  border: "rgba(244,63,94,0.35)",
  glow: "rgba(244,63,94,0.4)",
  shimmer: "rgba(244,63,94,0.15)",
  pulseGlow: "bg-rose-500/40",
  trophyGrad: "from-rose-300 via-rose-500 to-rose-600",
  trophyShadow: "rgba(244,63,94,0.6)",
  trophyInner: "from-rose-500/20",
  icoCol: "text-rose-400",
  icoDrop: "rgba(244,63,94,0.8)",
  spark: "text-rose-300",
  sparkDrop: "rgba(244,63,94,0.8)",
  botStar: "text-rose-200 fill-rose-200",
  botStarDrop: "rgba(244,63,94,0.8)",
  titleText: "from-rose-100 via-rose-300 to-rose-600",
  divider: "bg-rose-500/50",
  descColor: "text-rose-200/80",
  innerBorder: "border-rose-500/20",
  blurRing: "bg-rose-500/10",
  confetti: ["bg-rose-400", "bg-rose-300", "bg-white", "bg-zinc-300"],
  packBg: "linear-gradient(145deg, #1a0610 0%, #0d0308 30%, #1a0610 50%, #0d0308 70%, #1a0610 100%)",
  packBorder: "2px solid rgba(244,63,94,0.25)",
  packShadow: "0 0 20px rgba(244,63,94,0.15), 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(244,63,94,0.2)",
  goldBar: "from-rose-700 via-rose-400 to-rose-700",
  cornerBorder: "border-rose-500/40",
  innerFrameBorder: "border-rose-500/20",
  dotColor: "rgba(244,63,94,1)",
  particleColor: "bg-rose-400/60",
  logoBorder: "border-rose-500/30",
  logoShadow: "shadow-[0_0_30px_rgba(244,63,94,0.3)]",
  logoGlow: "bg-rose-500/30",
  subtitleColor: "text-rose-400/50",
  lineColor: "via-rose-500/60",
  titleGradient: "from-rose-200 via-rose-400 to-rose-600",
  mysteryGrad: "from-rose-500/20 to-rose-700/10",
  mysteryBorder: "border-rose-500/30",
  mysteryShadow: "shadow-[0_0_20px_rgba(244,63,94,0.2)]",
  mysteryText: "from-rose-200 to-rose-500",
  outerGlow: "linear-gradient(135deg, rgba(244,63,94,0.4), transparent 40%, rgba(225,29,72,0.3), transparent 70%, rgba(190,18,60,0.4))",
  conicGlow: "conic-gradient(from 0deg, transparent, rgba(244,63,94,0.6), transparent, rgba(225,29,72,0.4), transparent)",
}

/* ═════════════════════════════════════ */
/*  Pack Phase                           */
/* ═════════════════════════════════════ */

function StreakPack({ onOpen, tier, mode, streakCount }: { onOpen: () => void, tier: any, mode: ModalMode, streakCount: number }) {
  const [canOpen, setCanOpen] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setCanOpen(true), 800)
    return () => clearTimeout(t)
  }, [])

  const mouseX = useMotionValue(200)
  const mouseY = useMotionValue(250)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })
  const rotateX = useTransform(springY, [0, 500], ["15deg", "-15deg"])
  const rotateY = useTransform(springX, [0, 400], ["-15deg", "15deg"])
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${springX}px ${springY}px, rgba(255,255,255,0.05) 0%, transparent 60%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const handleMouseLeave = () => {
    mouseX.set(200)
    mouseY.set(250)
  }

  const isCelebration = mode === "celebration"
  const TierIcon = isCelebration ? (tier.icon || Flame) : AlertTriangle

  return (
    <motion.div
      key="streak-pack-phase"
      initial={{ opacity: 0, scale: 0.5, y: 80 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.1, y: 20 }}
      transition={{ type: "spring", stiffness: 120, damping: 14, mass: 1 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={() => { if (canOpen) onOpen() }}
      style={{ perspective: 1200 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative group w-[380px] aspect-[3/4] cursor-pointer"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {/* Massive outer glow pulse */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-8 rounded-[2.5rem] blur-3xl pointer-events-none"
          style={{ background: tier.outerGlow }}
        />

        {/* Secondary glow ring */}
        <div
          className="absolute -inset-6 rounded-[2.5rem] pointer-events-none opacity-20"
          style={{ background: tier.conicGlow }}
        />

        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ background: tier.packBg, boxShadow: tier.packShadow, border: tier.packBorder }}
        >
          {/* Mouse Glare Effect */}
          <div className="absolute inset-0 z-50 overflow-hidden mix-blend-overlay">
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: glareBackground }}
            />
          </div>

          {/* Holographic shimmer sweep */}
          <motion.div
            animate={{ x: ["-150%", "300%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
            className="absolute inset-0 w-1/3 h-full pointer-events-none z-10"
            style={{ background: `linear-gradient(90deg, transparent, ${tier.shimmer}, transparent)` }}
          />

          {/* Top gold bar */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tier.goldBar}`} />

          {/* Ornamental border frame */}
          <div className={`absolute inset-3 ${tier.innerFrameBorder} border rounded-2xl`} />
          <div className={`absolute inset-5 ${tier.innerFrameBorder} border rounded-xl opacity-50`} />

          {/* Corner ornaments */}
          <div className={`absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 ${tier.cornerBorder} rounded-tl-xl`} />
          <div className={`absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 ${tier.cornerBorder} rounded-tr-xl`} />
          <div className={`absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 ${tier.cornerBorder} rounded-bl-xl`} />
          <div className={`absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 ${tier.cornerBorder} rounded-br-xl`} />

          {/* Background texture pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${tier.dotColor} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />

          {/* Floating particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`p-${i}`}
              animate={{ y: [0, -15, 0], opacity: [0.1, 0.5, 0.1], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              className={`absolute w-1 h-1 rounded-full ${tier.particleColor} pointer-events-none`}
              style={{ left: `${15 + i * 10}%`, top: `${20 + (i % 3) * 25}%` }}
            />
          ))}

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
            {/* Logo / Icon */}
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative mb-8"
            >
              <div className={`absolute inset-0 ${tier.logoGlow} blur-[30px] rounded-full scale-[2.5]`} />
              <div className={`relative w-24 h-24 rounded-2xl overflow-hidden ${tier.logoBorder} border-2 ${tier.logoShadow} bg-[#0a0a12] flex items-center justify-center`}>
                <TierIcon className={`w-12 h-12 ${tier.icoCol}`} style={{ filter: `drop-shadow(0 0 20px ${tier.icoDrop})` }} />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              </div>
            </motion.div>

            <h3 className={`text-[11px] font-black tracking-[0.5em] ${tier.subtitleColor} uppercase mb-1`}>
              {isCelebration ? "FocusFlow Streak" : "Seri Tehlikede"}
            </h3>

            <div className={`w-20 h-[2px] bg-gradient-to-r from-transparent ${tier.lineColor} to-transparent rounded-full mb-6`} />

            <h2 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b ${tier.titleGradient} tracking-tight mb-2`}>
              {isCelebration ? `${streakCount} Gün ${tier.emoji}` : "Dikkat!"}
            </h2>
            <p className={`text-[12px] ${tier.descColor} font-medium opacity-50 mb-6`}>
              {isCelebration ? "Bugünkü serini kutla..." : "Serin tehlikede olabilir..."}
            </p>

            <motion.div
              className="relative"
              animate={{ y: [0, -6, 0], rotateZ: [0, 3, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className={`absolute inset-0 ${tier.logoGlow} blur-xl rounded-full scale-150 opacity-50`} />
              <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${tier.mysteryGrad} ${tier.mysteryBorder} border flex items-center justify-center ${tier.mysteryShadow}`}>
                <span className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b ${tier.mysteryText}`}>?</span>
              </div>
            </motion.div>
          </div>

          <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tier.goldBar}`} />

          <Sparkles className={`absolute top-6 right-6 w-5 h-5 ${tier.icoCol} opacity-20`} />
          <Star className={`absolute bottom-6 left-6 w-5 h-5 ${tier.icoCol} opacity-20 fill-current`} />
          <Flame className={`absolute top-6 left-6 w-4 h-4 ${tier.icoCol} opacity-15`} />
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═════════════════════════════════════ */
/*  Reveal Card                          */
/* ═════════════════════════════════════ */

/* ═══ CELEBRATION Reveal Card ═══ */
function CelebrationRevealCard({ tier, streakCount, onClose }: { tier: any, streakCount: number, onClose: () => void }) {
  const [canClose, setCanClose] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 1500)
    return () => clearTimeout(t)
  }, [])

  // Fire confetti on mount — only for celebrations!
  React.useEffect(() => {
    const colors = ["#f59e0b", "#fbbf24", "#f97316", "#ef4444", "#eab308", "#d97706"]
    setTimeout(() => confetti({ particleCount: 150, spread: 120, origin: { y: 0.6 }, colors, disableForReducedMotion: true, zIndex: 201 }), 150)
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5, x: 0.3 }, colors, disableForReducedMotion: true, zIndex: 201 })
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5, x: 0.7 }, colors, disableForReducedMotion: true, zIndex: 201 })
    }, 600)
  }, [])

  const mouseX = useMotionValue(200)
  const mouseY = useMotionValue(250)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })
  const rotateX = useTransform(springY, [0, 500], ["15deg", "-15deg"])
  const rotateY = useTransform(springX, [0, 400], ["-15deg", "15deg"])
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${springX}px ${springY}px, rgba(255,255,255,0.05) 0%, transparent 50%)`
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => { const rect = e.currentTarget.getBoundingClientRect(); mouseX.set(e.clientX - rect.left); mouseY.set(e.clientY - rect.top) }
  const handleMouseLeave = () => { mouseX.set(200); mouseY.set(250) }
  const TierIcon = tier.icon || Flame

  return (
    <motion.div
      key="streak-celebration-reveal"
      initial={{ opacity: 0, scale: 0.3, y: 150, rotateX: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20, rotateX: -20 }}
      transition={{ type: "spring", stiffness: 110, damping: 14, mass: 1.1 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
      style={{ perspective: 1200 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => { e.stopPropagation(); if (canClose) onClose() }}
        className="relative w-[380px] sm:w-[400px] aspect-[3/4] min-h-[500px] rounded-[2.5rem] p-[2px] cursor-pointer group pointer-events-auto"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", boxShadow: `0 40px 100px -20px ${tier.glow}, 0 0 50px -10px ${tier.shimmer}` }}
      >
        <motion.div className="absolute inset-0 rounded-[2.5rem] opacity-70" animate={{ background: [`conic-gradient(from 0deg, transparent, ${tier.border}, transparent)`, `conic-gradient(from 360deg, transparent, ${tier.border}, transparent)`] }} />
        <div className="relative w-full h-full rounded-[2.4rem] overflow-hidden flex flex-col items-center justify-center p-8 text-center" style={{ background: tier.bg }}>
          <div className="absolute inset-0 z-50 overflow-hidden rounded-[2.4rem] pointer-events-none mix-blend-overlay"><motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: glareBackground }} /></div>
          <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }} className="absolute inset-0 w-1/2 h-full pointer-events-none skew-x-[-20deg]" style={{ background: `linear-gradient(90deg, transparent, ${tier.shimmer}, transparent)` }} />
          <div className={`absolute inset-2 border ${tier.innerBorder} rounded-[2rem] z-0`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute top-12 left-12 opacity-30"><Orbit className={`w-32 h-32 ${tier.icoCol} opacity-10`} /></motion.div>

          <div style={{ transform: "translateZ(80px)" }} className="flex flex-col items-center justify-center z-20 pointer-events-none w-full">
            <div className="relative mb-12">
              <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute inset-0 ${tier.pulseGlow} blur-[40px] rounded-full scale-150`} />
              <div className={`relative w-36 h-36 bg-gradient-to-br ${tier.trophyGrad} rounded-full p-[3px]`} style={{ boxShadow: `0 0 60px ${tier.trophyShadow}` }}>
                <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center relative overflow-hidden">
                  <motion.div animate={{ y: ["100%", "-100%"] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent skew-y-12" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${tier.trophyInner} to-transparent`} />
                  <TierIcon className={`w-16 h-16 ${tier.icoCol}`} style={{ filter: `drop-shadow(0 0 20px ${tier.icoDrop})` }} />
                </div>
              </div>
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: "spring", stiffness: 200 }} className="absolute -top-4 -right-4"><Sparkles className={`w-12 h-12 ${tier.spark}`} style={{ filter: `drop-shadow(0 0 15px ${tier.sparkDrop})` }} /></motion.div>
              <motion.div initial={{ scale: 0, rotate: 180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5, type: "spring", stiffness: 200 }} className="absolute -bottom-2 -left-6"><Star className={`w-10 h-10 ${tier.botStar}`} style={{ filter: `drop-shadow(0 0 15px ${tier.botStarDrop})` }} /></motion.div>
            </div>
            <h3 className="text-white/50 text-xs font-black tracking-[0.4em] uppercase mb-4">{tier.label} SERİSİ</h3>
            <h2 className={`text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b ${tier.titleText} drop-shadow-xl text-center leading-normal mb-4 px-4 py-2 z-30 break-words w-full`}>{streakCount} Gün {tier.emoji}</h2>
            <div className={`w-16 h-[3px] ${tier.divider} rounded-full mb-6`} />
            <p className={`text-[15px] font-medium ${tier.descColor} max-w-[280px] leading-relaxed text-center`}>
              {streakCount >= 30 ? "Efsanevi bir süreklilik! Durmak bilmez iraden herkese ilham veriyor." : streakCount >= 7 ? "Muhteşem gidiyorsun! Serisini korumaya devam et, büyüklük yakın." : "Harika! Bugünkü streak'in güvende. Yarın da gel, efsane ol!"}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══ WARNING Reveal Card — SCARY ═══ */
function WarningRevealCard({ tier, streakCount, onClose }: { tier: any, streakCount: number, onClose: () => void }) {
  const [canClose, setCanClose] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      key="streak-warning-reveal"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
    >
      {/* Screen shake on entry */}
      <motion.div
        animate={{ x: [0, -8, 8, -5, 5, -3, 3, 0], y: [0, 3, -3, 2, -2, 1, 0] }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative w-[400px] sm:w-[420px] pointer-events-auto"
      >
        {/* Danger pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-6 rounded-[2.5rem] border-2 border-rose-500/40 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          className="absolute -inset-10 rounded-[3rem] border border-rose-500/20 pointer-events-none"
        />

        {/* RED GLOW behind card */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-8 bg-rose-500/20 blur-[60px] rounded-[3rem] pointer-events-none"
        />

        {/* The Card */}
        <div
          className="relative rounded-[2rem] overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #1a0008 0%, #050002 40%, #1a0008 100%)",
            border: "2px solid rgba(244,63,94,0.3)",
            boxShadow: "0 0 40px rgba(244,63,94,0.2), 0 30px 80px rgba(0,0,0,0.8), inset 0 0 80px rgba(244,63,94,0.05)",
          }}
        >
          {/* Crack / fracture lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06] z-10" viewBox="0 0 400 600" preserveAspectRatio="none">
            <line x1="180" y1="0" x2="200" y2="120" stroke="rgba(244,63,94,1)" strokeWidth="1" />
            <line x1="200" y1="120" x2="170" y2="250" stroke="rgba(244,63,94,1)" strokeWidth="0.8" />
            <line x1="200" y1="120" x2="240" y2="200" stroke="rgba(244,63,94,0.8)" strokeWidth="0.5" />
            <line x1="300" y1="400" x2="280" y2="520" stroke="rgba(244,63,94,0.6)" strokeWidth="0.8" />
            <line x1="280" y1="520" x2="310" y2="600" stroke="rgba(244,63,94,0.4)" strokeWidth="0.5" />
          </svg>

          {/* Red vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_30%,_rgba(127,29,29,0.3)_100%)] pointer-events-none z-0" />

          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

          <div className="relative z-20 p-10 flex flex-col items-center text-center">

            {/* Danger Icon with heartbeat pulse */}
            <div className="relative mb-8">
              {/* Background threat glow */}
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-rose-600/50 blur-[40px] rounded-full scale-[2]"
              />

              <motion.div
                animate={{ scale: [1, 1.08, 1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-600 via-red-700 to-rose-900 p-[3px]" style={{ boxShadow: "0 0 50px rgba(244,63,94,0.5), 0 0 100px rgba(244,63,94,0.2)" }}>
                  <div className="w-full h-full bg-[#0a0004] rounded-full flex items-center justify-center relative overflow-hidden">
                    {/* Inner red glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-rose-900/40 to-transparent" />
                    <motion.div
                      animate={{ opacity: [0.1, 0.4, 0.1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 bg-rose-500/10"
                    />
                    <AlertTriangle className="w-14 h-14 text-rose-400" style={{ filter: "drop-shadow(0 0 25px rgba(244,63,94,0.8))" }} />
                  </div>
                </div>
              </motion.div>

              {/* Danger crosses */}
              <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="absolute -top-3 -right-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center"><X className="w-4 h-4 text-rose-400" /></div>
              </motion.div>
              <motion.div initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.4, type: "spring", stiffness: 200 }} className="absolute -bottom-1 -left-4">
                <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center"><Skull className="w-3.5 h-3.5 text-rose-400" /></div>
              </motion.div>
            </div>

            {/* Title section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3 className="text-rose-500/60 text-[10px] font-black tracking-[0.5em] uppercase mb-3">⚠ SERİ TEHLİKEDE ⚠</h3>

              <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-rose-200 via-rose-400 to-red-700 mb-2 leading-tight">
                {streakCount > 0 ? `${streakCount} Günlük Serin` : "Serin"}
              </h2>
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-300 to-red-800 mb-4">
                {streakCount > 0 ? "Yok Olmak Üzere!" : "Henüz Başlamadı!"}
              </h2>

              <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent rounded-full mx-auto mb-5" />

              <p className="text-[14px] font-medium text-rose-200/60 max-w-[290px] leading-relaxed mx-auto mb-6">
                {streakCount > 0
                  ? "Bugün hiçbir görev eklemedin veya tamamlamadın. Gece yarısına kadar aksiyona geçmezsen tüm emeğin boşa gidecek."
                  : "Henüz bir serin yok. İlk görevini ekle ve disiplin zincirini başlat — yoksa hep sıfırda kalırsın."
                }
              </p>
            </motion.div>

            {/* Streak counter — what you'll lose */}
            {streakCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="mb-6 bg-rose-500/[0.06] border border-rose-500/20 rounded-2xl px-6 py-4 w-full max-w-[280px]"
              >
                <div className="flex items-center justify-center gap-3">
                  <Flame className="w-5 h-5 text-rose-500/40" />
                  <div className="text-center">
                    <span className="text-2xl font-black text-rose-400 tabular-nums">{streakCount}</span>
                    <span className="text-xs text-rose-400/50 font-bold ml-1">GÜN</span>
                  </div>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <span className="text-rose-500/60 text-lg">→</span>
                  </motion.div>
                  <div className="text-center">
                    <span className="text-2xl font-black text-zinc-600 tabular-nums line-through">0</span>
                    <span className="text-xs text-zinc-700 font-bold ml-1">GÜN</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={(e) => { e.stopPropagation(); if (canClose) onClose() }}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 text-white font-bold text-sm tracking-wider shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all hover:scale-105 active:scale-95 border border-rose-400/20 pointer-events-auto cursor-pointer"
            >
              Tamam, Hemen Yapacağım! 🔥
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═════════════════════════════════════ */
/*  Main Modal                           */
/* ═════════════════════════════════════ */

export function StreakCelebrationModal({ mode, streakCount, onClose }: StreakCelebrationModalProps) {
  const [phase, setPhase] = React.useState<"pack" | "burst" | "reveal">("pack")
  const [canCloseBg, setCanCloseBg] = React.useState(false)

  const isCelebration = mode === "celebration"
  const tier = isCelebration ? getStreakTier(streakCount) : WARNING_TIER

  React.useEffect(() => {
    setPhase("pack")
    setCanCloseBg(false)
  }, [mode])

  React.useEffect(() => {
    if (phase === "reveal") {
      const t = setTimeout(() => setCanCloseBg(true), 1500)
      return () => clearTimeout(t)
    } else {
      setCanCloseBg(false)
    }
  }, [phase])

  const handleOpenPack = React.useCallback(() => {
    setPhase("burst")
    setTimeout(() => setPhase("reveal"), 400)
  }, [])

  const handleClose = React.useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-[#09090b]/90 backdrop-blur-xl"
          onClick={(phase === "reveal" && canCloseBg) ? handleClose : undefined}
        />

        {/* Background Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: phase === "reveal" ? 1 : 0.4, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div className={`w-[600px] h-[600px] ${tier.blurRing} rounded-full blur-[100px]`} />
        </motion.div>

        {/* Burst flash overlay */}
        <AnimatePresence>
          {phase === "burst" && (
            <motion.div
              key="streak-burst-flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
            >
              <div
                className="w-[500px] h-[500px] rounded-full blur-[80px]"
                style={{ background: `radial-gradient(circle, ${tier.glow}, transparent 70%)` }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pack Phase */}
        <AnimatePresence>
          {phase === "pack" && (
            <StreakPack onOpen={handleOpenPack} tier={tier} mode={mode} streakCount={streakCount} />
          )}
        </AnimatePresence>

        {/* Reveal Phase */}
        <AnimatePresence>
          {phase === "reveal" && isCelebration && (
            <CelebrationRevealCard tier={tier} streakCount={streakCount} onClose={handleClose} />
          )}
          {phase === "reveal" && !isCelebration && (
            <WarningRevealCard tier={tier} streakCount={streakCount} onClose={handleClose} />
          )}
        </AnimatePresence>

        {/* Overlay Confetti particles — ONLY for celebrations */}
        {phase === "reveal" && isCelebration && Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={`streak-c-${i}`}
            initial={{ opacity: 1, top: "100%", left: `${Math.random() * 100}%`, scale: Math.random() * 0.8 + 0.4, rotate: Math.random() * 360 }}
            animate={{ top: "-10%", x: (Math.random() - 0.5) * 400, rotate: Math.random() * 720, opacity: 0 }}
            transition={{ duration: 2.5 + Math.random() * 2, ease: "easeOut", delay: Math.random() * 0.4 }}
            className={cn("absolute z-[201] w-3 h-3 md:w-4 md:h-4 rounded-sm shadow-sm pointer-events-none", tier.confetti[i % tier.confetti.length])}
          />
        ))}

        {/* Falling ember / ash particles — ONLY for warnings */}
        {phase === "reveal" && !isCelebration && Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={`ember-${i}`}
            initial={{ opacity: 0.8, top: "-5%", left: `${Math.random() * 100}%`, scale: Math.random() * 0.6 + 0.2 }}
            animate={{ top: "110%", x: (Math.random() - 0.5) * 200, rotate: Math.random() * 360, opacity: [0.8, 0.5, 0] }}
            transition={{ duration: 3 + Math.random() * 3, ease: "linear", delay: Math.random() * 2 }}
            className="absolute z-[201] w-2 h-2 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, rgba(244,63,94,${0.4 + Math.random() * 0.4}), rgba(127,29,29,0.2))`, boxShadow: `0 0 6px rgba(244,63,94,${0.2 + Math.random() * 0.3})` }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
