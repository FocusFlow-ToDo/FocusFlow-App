"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Volume2, VolumeX, Sparkles, AlertCircle, RefreshCw,
  Gift, Trophy, Flame, ChevronRight, CheckCircle2, Shield,
  Coins, Zap, Crown, Gem, RotateCcw
} from "lucide-react"
import confetti from "canvas-confetti"
import {
  Cs2CaseItem,
  CS2_CASE_ITEMS,
  Cs2Rarity,
  FRAME_STYLES,
  CaseTierId,
  CASE_TIERS
} from "@/hooks/useShop"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"

interface Cs2CaseOpeningModalProps {
  isOpen: boolean
  onClose: () => void
  focusCoins: number
  onOpenCase: (tierId: CaseTierId) => Cs2CaseItem | null
  onQuicksell?: (item: Cs2CaseItem, tierPrice: number) => void
}

const CARD_WIDTH = 144
const CARD_GAP = 12
const CARD_STEP = CARD_WIDTH + CARD_GAP // 156px
const WINNER_INDEX = 40
const TOTAL_CARDS = 55

// Helper to generate randomized strip of items based on tier odds
function generateRandomStrip(items: Cs2CaseItem[], count: number, tierId: CaseTierId = "case_operation"): Cs2CaseItem[] {
  const strip: Cs2CaseItem[] = []
  const tier = CASE_TIERS[tierId] || CASE_TIERS.case_operation
  const { odds } = tier

  for (let i = 0; i < count; i++) {
    const pool = items.filter((it) => {
      const rand = Math.random()
      if (rand < odds.blue) return it.rarity === "blue"
      if (rand < odds.blue + odds.purple) return it.rarity === "purple"
      if (rand < odds.blue + odds.purple + odds.pink) return it.rarity === "pink"
      if (rand < odds.blue + odds.purple + odds.pink + odds.red) return it.rarity === "red"
      return it.rarity === "gold"
    })
    const picked = pool[Math.floor(Math.random() * pool.length)] || items[0]
    strip.push(picked)
  }
  return strip
}


// Rich Visual Component for items (Personalized with User's Photo / Initials)
function Cs2ItemVisual({
  item,
  size = "md",
  userPhoto,
  userInitials
}: {
  item: Cs2CaseItem
  size?: "sm" | "md" | "lg"
  userPhoto?: string | null
  userInitials?: string
}) {
  const isSm = size === "sm"
  const isLg = size === "lg"

  // Frame Item Visual (Renders actual frame style with user avatar!)
  if (item.type === "frame" && item.frameId && FRAME_STYLES[item.frameId]) {
    return (
      <div className={cn("relative flex items-center justify-center", isSm ? "w-12 h-12" : isLg ? "w-20 h-20" : "w-14 h-14")}>
        <div
          className={cn(
            "w-full h-full rounded-full flex items-center justify-center p-1 bg-zinc-900/90 transition-all duration-300 border-2 shadow-md",
            FRAME_STYLES[item.frameId]
          )}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
            {userPhoto ? (
              <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className={cn("font-black", isSm ? "text-[10px]" : isLg ? "text-sm" : "text-xs")}>
                {userInitials || "CO"}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Profile Effect Item Visual
  if (item.type === "effect") {
    return (
      <div className={cn("relative flex items-center justify-center rounded-2xl overflow-hidden border border-white/20 bg-gradient-to-tr from-purple-950/60 via-indigo-950/60 to-slate-900/80 shadow-lg", isSm ? "w-12 h-12" : isLg ? "w-20 h-20" : "w-14 h-14")}>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-cyan-500/20 animate-pulse" />
        <div className="relative z-10 w-3/4 h-3/4 rounded-full overflow-hidden border border-white/30 shadow-md">
          {userPhoto ? (
            <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-[10px] font-black">
              {userInitials || "CO"}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Coin Stack Item Visual
  if (item.type === "coin") {
    return (
      <div className={cn("relative flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]", isSm ? "w-12 h-12" : isLg ? "w-20 h-20" : "w-14 h-14")}>
        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/20 to-orange-500/10 flex items-center justify-center text-amber-300 shadow-inner">
          <Coins className={cn("text-amber-400 drop-shadow-md", isSm ? "w-6 h-6" : isLg ? "w-10 h-10" : "w-7 h-7")} />
        </div>
      </div>
    )
  }

  // Freeze Shield Item Visual
  if (item.type === "freeze") {
    return (
      <div className={cn("relative flex items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.2)]", isSm ? "w-12 h-12" : isLg ? "w-20 h-20" : "w-14 h-14")}>
        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-sky-500/20 via-blue-500/20 to-cyan-500/10 flex items-center justify-center text-sky-300 shadow-inner">
          <Shield className={cn("text-sky-300 drop-shadow-md", isSm ? "w-6 h-6" : isLg ? "w-10 h-10" : "w-7 h-7")} />
        </div>
      </div>
    )
  }

  // Booster Item Visual
  if (item.type === "booster") {
    return (
      <div className={cn("relative flex items-center justify-center rounded-2xl bg-yellow-500/10 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]", isSm ? "w-12 h-12" : isLg ? "w-20 h-20" : "w-14 h-14")}>
        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-yellow-500/20 via-amber-500/20 to-orange-500/10 flex items-center justify-center text-yellow-300 shadow-inner">
          <Zap className={cn("text-yellow-400 drop-shadow-md", isSm ? "w-6 h-6" : isLg ? "w-10 h-10" : "w-7 h-7")} />
        </div>
      </div>
    )
  }

  // Title Item Visual
  return (
    <div className={cn("relative flex items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]", isSm ? "w-12 h-12" : isLg ? "w-20 h-20" : "w-14 h-14")}>
      <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-pink-500/10 flex items-center justify-center text-purple-300 shadow-inner">
        <Crown className={cn("text-purple-300 drop-shadow-md", isSm ? "w-6 h-6" : isLg ? "w-10 h-10" : "w-7 h-7")} />
      </div>
    </div>
  )
}

export function Cs2CaseOpeningModal({
  isOpen,
  onClose,
  focusCoins,
  onOpenCase,
  onQuicksell
}: Cs2CaseOpeningModalProps) {
  const { user } = useAuth()
  const userPhoto = user?.photoURL || null
  const userInitials = user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "CO"

  const { settings, updateSettings } = useSettings()

  // Selected Case Tier
  const [selectedTier, setSelectedTier] = React.useState<CaseTierId>("case_operation")
  const currentTier = CASE_TIERS[selectedTier] || CASE_TIERS.case_operation

  // Stage Machine: "idle" -> "cracking" -> "opening" -> "spinning" -> "result"
  const [stage, setStage] = React.useState<"idle" | "cracking" | "opening" | "spinning" | "result">("idle")
  const [reelItems, setReelItems] = React.useState<Cs2CaseItem[]>([])
  const [winnerItem, setWinnerItem] = React.useState<Cs2CaseItem | null>(null)
  const [needleBounce, setNeedleBounce] = React.useState(false)
  const [isQuicksold, setIsQuicksold] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close with Escape key when idle or result
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (stage === "idle" || stage === "result")) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, stage, onClose])

  // Check if winner cosmetic is currently equipped
  const isWinnerEquipped = React.useMemo(() => {
    if (!winnerItem) return false
    if (winnerItem.type === "frame" && winnerItem.frameId) {
      return settings.equippedFrame === winnerItem.frameId
    }
    if (winnerItem.type === "effect" && winnerItem.effectId) {
      return settings.equippedProfileEffect === winnerItem.effectId
    }
    if (winnerItem.type === "title" && (winnerItem.titleName || winnerItem.name)) {
      const titleClean = (winnerItem.titleName || winnerItem.name).replace(/^Unvan:\s*['"]?|['"]?$/g, "").trim()
      return settings.equippedTitle === titleClean || settings.equippedTitle === winnerItem.titleName
    }
    return false
  }, [winnerItem, settings.equippedFrame, settings.equippedProfileEffect, settings.equippedTitle])

  // Instant equip handler
  const handleEquipWinner = React.useCallback(() => {
    if (!winnerItem) return
    if (winnerItem.type === "frame" && winnerItem.frameId) {
      updateSettings({ equippedFrame: winnerItem.frameId })
    } else if (winnerItem.type === "effect" && winnerItem.effectId) {
      updateSettings({ equippedProfileEffect: winnerItem.effectId })
    } else if (winnerItem.type === "title") {
      const titleClean = (winnerItem.titleName || winnerItem.name).replace(/^Unvan:\s*['"]?|['"]?$/g, "").trim()
      updateSettings({ equippedTitle: titleClean })
    }
  }, [winnerItem, updateSettings])

  // Ray burst state (for Red / Gold pulls like kasa-açma.html)
  const [showRayBurst, setShowRayBurst] = React.useState(false)
  const [rayColor, setRayColor] = React.useState<string>("#e4ae39")

  const [isMuted, setIsMuted] = React.useState(false)
  const [activeFilter, setActiveFilter] = React.useState<"all" | Cs2Rarity>("all")

  const viewportRef = React.useRef<HTMLDivElement>(null)
  const stripRef = React.useRef<HTMLDivElement>(null)
  const audioCtxRef = React.useRef<AudioContext | null>(null)
  const timeoutsRef = React.useRef<NodeJS.Timeout[]>([])

  // Clear all pending timeouts
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  // Initialize Audio Context on demand
  const getAudioContext = React.useCallback(() => {
    if (typeof window === "undefined") return null
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx()
      }
    }
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {})
    }
    return audioCtxRef.current
  }, [])

  // Audio: Generic tone helper (from kasa-açma.html)
  const playTone = React.useCallback((freq: number, dur: number, type: OscillatorType = "square", vol = 0.06) => {
    if (isMuted) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const now = ctx.currentTime
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, now)
      g.gain.setValueAtTime(vol, now)
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
      o.connect(g)
      g.connect(ctx.destination)
      o.start(now)
      o.stop(now + dur)
    } catch {}
  }, [getAudioContext, isMuted])

  // Audio: Noise sweep whoosh (from kasa-açma.html)
  const playNoiseSweep = React.useCallback((dur = 0.5) => {
    if (isMuted) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const now = ctx.currentTime
      const bufferSize = ctx.sampleRate * dur
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
      }
      const src = ctx.createBufferSource()
      src.buffer = buffer
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.15, now)
      g.gain.exponentialRampToValueAtTime(0.001, now + dur)
      src.connect(g)
      g.connect(ctx.destination)
      src.start(now)
      src.stop(now + dur)
    } catch {}
  }, [getAudioContext, isMuted])

  // Audio: CS2 Metallic Wheel Tick
  const playCs2TickSound = React.useCallback((pitchModifier = 1) => {
    if (isMuted) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const now = ctx.currentTime

      // 1. High metallic click snap (bandpass white noise burst)
      const bufferSize = ctx.sampleRate * 0.014
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = "bandpass"
      filter.frequency.setValueAtTime(2600 * pitchModifier, now)
      filter.Q.setValueAtTime(3.5, now)
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.35, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.014)
      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.start(now)

      // 2. Low casing resonance thump
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(190 * pitchModifier, now)
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.03)
      oscGain.gain.setValueAtTime(0.2, now)
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
      osc.connect(oscGain)
      oscGain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.03)
    } catch {}
  }, [getAudioContext, isMuted])

  // Audio: Latch lock sound when wheel stops
  const playLockLatchSound = React.useCallback(() => {
    if (isMuted) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(340, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06)
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.06)
    } catch {}
  }, [getAudioContext, isMuted])

  // Audio: Fanfare for gold/red
  const playVictorySound = React.useCallback((rarity: Cs2Rarity) => {
    if (isMuted) return
    try {
      const ctx = getAudioContext()
      if (!ctx) return
      const now = ctx.currentTime
      if (rarity === "gold" || rarity === "red") {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(freq, now + idx * 0.09)
          gain.gain.setValueAtTime(0.25, now + idx * 0.09)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 1.2)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + idx * 0.09)
          osc.stop(now + idx * 0.09 + 1.2)
        })
      } else if (rarity === "pink" || rarity === "purple") {
        const notes = [440, 554.37, 659.25, 880]
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "triangle"
          osc.frequency.setValueAtTime(freq, now + idx * 0.08)
          gain.gain.setValueAtTime(0.2, now + idx * 0.08)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + idx * 0.08)
          osc.stop(now + idx * 0.08 + 0.6)
        })
      } else {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(330, now)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.4)
      }
    } catch {}
  }, [getAudioContext, isMuted])

  // Reset to initial state whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStage("idle")
      setWinnerItem(null)
      setIsQuicksold(false)
      setShowRayBurst(false)
      const initial = generateRandomStrip(CS2_CASE_ITEMS, TOTAL_CARDS, selectedTier)
      setReelItems(initial)
    } else {
      clearAllTimeouts()
      setStage("idle")
      setShowRayBurst(false)
      setIsQuicksold(false)
    }
    return () => clearAllTimeouts()
  }, [isOpen, selectedTier])

  // Trigger spin animation when stage changes to "spinning" (Guaranteed DOM existence!)
  React.useEffect(() => {
    if (stage !== "spinning" || !winnerItem) return

    const timer = setTimeout(() => {
      const stripEl = stripRef.current
      if (!stripEl) return

      const viewportW = viewportRef.current?.offsetWidth || 700
      const startX = (viewportW / 2) - (2 * CARD_STEP + CARD_WIDTH / 2)
      stripEl.style.transition = "none"
      stripEl.style.transform = `translateX(${startX}px)`

      // Force layout reflow
      void stripEl.offsetWidth

      const centerOffset = (viewportW / 2) - (WINNER_INDEX * CARD_STEP + CARD_WIDTH / 2)
      const maxJitter = Math.floor(CARD_WIDTH * 0.2) // ~28px safe boundary within card
      const jitter = Math.floor(Math.random() * (maxJitter * 2)) - maxJitter
      const targetX = centerOffset + jitter

      const spinDuration = 5600 // 5.6s
      stripEl.style.transition = `transform ${spinDuration}ms cubic-bezier(0.09, 0.75, 0.15, 1.0)`
      stripEl.style.transform = `translateX(${targetX}px)`

      const startTime = Date.now()
      let lastCardTick = 2

      const tickInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        if (elapsed >= spinDuration) {
          clearInterval(tickInterval)
          return
        }
        const t = elapsed / spinDuration
        const progress = 1 - Math.pow(1 - t, 3.2)
        const currentCard = 2 + progress * (WINNER_INDEX - 2)

        if (Math.floor(currentCard) > lastCardTick) {
          lastCardTick = Math.floor(currentCard)
          const pitch = 0.95 + Math.min(0.35, (lastCardTick / WINNER_INDEX) * 0.35)
          playCs2TickSound(pitch)
          setNeedleBounce(true)
          setTimeout(() => setNeedleBounce(false), 45)
        }
      }, 30)

      const stopTimer = setTimeout(() => {
        clearInterval(tickInterval)
        playLockLatchSound()
        setStage("result")
        playVictorySound(winnerItem.rarity)

        if (winnerItem.rarity === "gold" || winnerItem.rarity === "red") {
          setRayColor(winnerItem.hexColor)
          setShowRayBurst(true)
          setTimeout(() => setShowRayBurst(false), 3200)

          confetti({
            particleCount: winnerItem.rarity === "gold" ? 170 : 120,
            spread: 100,
            origin: { y: 0.45 },
            colors: winnerItem.rarity === "gold"
              ? ["#ffd700", "#f59e0b", "#fbbf24", "#ffffff"]
              : ["#ef4444", "#dc2626", "#f87171", "#ffffff"]
          })
        }
      }, spinDuration + 100)

      timeoutsRef.current.push(stopTimer)
    }, 50)

    return () => {
      clearTimeout(timer)
    }
  }, [stage, winnerItem, playCs2TickSound, playLockLatchSound, playVictorySound])

  // Fast skip function for instant gratification
  const handleInstantReveal = () => {
    if (!winnerItem) return
    clearAllTimeouts()
    playLockLatchSound()
    setStage("result")
    playVictorySound(winnerItem.rarity)
    if (winnerItem.rarity === "gold" || winnerItem.rarity === "red") {
      setRayColor(winnerItem.hexColor)
      setShowRayBurst(true)
      setTimeout(() => setShowRayBurst(false), 3200)
    }
  }

  // ─── COMPLETE CS2 OPENING FLOW (INSPIRED BY KASA-AÇMA.HTML) ───
  const handleStartCaseOpening = () => {
    if (stage !== "idle" && stage !== "result") return
    if (focusCoins < currentTier.price) {
      alert(`Yetersiz Focus Para! "${currentTier.name}" açmak için en az ${currentTier.price} Focus Parası gerekir.`)
      return
    }

    const winner = onOpenCase(selectedTier)
    if (!winner) return

    clearAllTimeouts()
    setWinnerItem(winner)
    setIsQuicksold(false)

    const freshStrip = generateRandomStrip(CS2_CASE_ITEMS, TOTAL_CARDS, selectedTier)
    freshStrip[WINNER_INDEX] = winner
    setReelItems(freshStrip)

    // 1. STAGE: CRACKING (Case shuddering with metallic clicks)
    setStage("cracking")
    playTone(190, 0.08, "square", 0.07)
    
    const t1 = setTimeout(() => {
      playTone(230, 0.08, "square", 0.08)
    }, 400)
    const t2 = setTimeout(() => {
      playTone(280, 0.09, "square", 0.09)
    }, 800)

    // 2. STAGE: SEAL BREAK & LID OPEN (Flash + noise sweep)
    const t3 = setTimeout(() => {
      setStage("opening")
      playNoiseSweep(0.4)
      playTone(130, 0.35, "sawtooth", 0.1)

      // 3. STAGE: REEL REVEAL & SPIN
      const t4 = setTimeout(() => {
        setStage("spinning")
      }, 500)
      timeoutsRef.current.push(t4)
    }, 1100)

    timeoutsRef.current.push(t1, t2, t3)
  }

  const filteredCaseItems = React.useMemo(() => {
    if (activeFilter === "all") return CS2_CASE_ITEMS
    return CS2_CASE_ITEMS.filter((i) => i.rarity === activeFilter)
  }, [activeFilter])

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div
      onClick={() => {
        if (stage === "idle" || stage === "result") {
          onClose()
        }
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto custom-scrollbar select-none"
    >
      
      {/* ─────────────────────────────────────────────────────────────
          FULL-SCREEN ROTATING SUNBURST RAYS (FROM KASA-AÇMA.HTML)
      ───────────────────────────────────────────────────────────── */}
      {showRayBurst && (
        <div className="fixed inset-0 pointer-events-none z-[60] flex items-center justify-center animate-ray-cycle">
          <svg viewBox="0 0 200 200" className="w-[140vmax] h-[140vmax] animate-spin-rays">
            <defs>
              <radialGradient id="rayGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={rayColor} stopOpacity="0.65" />
                <stop offset="100%" stopColor={rayColor} stopOpacity="0" />
              </radialGradient>
            </defs>
            <g fill="url(#rayGrad)">
              {Array.from({ length: 14 }).map((_, i) => (
                <rect
                  key={i}
                  x="98"
                  y="0"
                  width="4"
                  height="100"
                  transform={`rotate(${i * (360 / 14)} 100 100)`}
                />
              ))}
            </g>
          </svg>
          <div className="w-4 h-4 rounded-full shadow-[0_0_80px_40px_currentColor]" style={{ color: rayColor }} />
        </div>
      )}

      {/* Scoped CSS Keyframes for authentic CS2 Case 3D & Rays animations */}
      <style jsx global>{`
        @keyframes hoverCase {
          0%, 100% { transform: translateY(0) rotateX(0deg); }
          50% { transform: translateY(-10px) rotateX(3deg); }
        }
        @keyframes caseShudder {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-5px) rotate(-1.5deg); }
          75% { transform: translateX(5px) rotate(1.5deg); }
        }
        @keyframes flashOut {
          0% { opacity: 0; transform: scale(0.4); }
          35% { opacity: 0.95; }
          100% { opacity: 0; transform: scale(2.6); }
        }
        @keyframes spinRays {
          to { transform: rotate(360deg); }
        }
        @keyframes rayCycle {
          0% { opacity: 0; }
          15% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-hover-case {
          animation: hoverCase 4s ease-in-out infinite;
        }
        .animate-case-shudder {
          animation: caseShudder 0.45s ease-in-out infinite;
        }
        .animate-flash-out {
          animation: flashOut 0.7s ease-out forwards;
        }
        .animate-spin-rays {
          animation: spinRays 6s linear infinite;
        }
        .animate-ray-cycle {
          animation: rayCycle 3.2s ease-in-out forwards;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl border border-white/15 bg-[#0b0f19] shadow-2xl overflow-y-auto custom-scrollbar flex flex-col my-auto"
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 rounded-full blur-3xl pointer-events-none transition-all duration-500"
          style={{ backgroundColor: currentTier.glowColor }}
        />

        {/* ─────────────────────────────────────────────────────────────
            HEADER BAR (FOCUSFLOW CS2 KASA AÇIMI)
        ───────────────────────────────────────────────────────────── */}
        <div className="relative z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner text-lg"
              style={{
                backgroundColor: `${currentTier.hexColor}20`,
                borderColor: `${currentTier.hexColor}40`
              }}
            >
              <span>{currentTier.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  {currentTier.name}
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                  style={{
                    backgroundColor: `${currentTier.hexColor}20`,
                    borderColor: `${currentTier.hexColor}40`,
                    color: currentTier.hexColor
                  }}
                >
                  {currentTier.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {currentTier.subtitle} • {currentTier.price} Focus Parası
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Coin Balance */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-inner">
              <span className="text-xs font-bold font-mono">{focusCoins.toLocaleString()}</span>
              <span className="text-xs">🪙</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={stage === "cracking" || stage === "opening" || stage === "spinning"}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            CASE TIER SELECTOR CARDS (ÇIRAK, OPERASYON, MİTİK)
        ───────────────────────────────────────────────────────────── */}
        <div className="relative z-10 px-4 sm:px-6 py-3 bg-black/50 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎰 Açmak İstediğin Kasayı Seç:</span>
            </span>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              Farklı kademeler, farklı şans oranları ve ödül havuzları sunar
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(Object.keys(CASE_TIERS) as CaseTierId[]).map((tierKey) => {
              const t = CASE_TIERS[tierKey]
              const isSelected = selectedTier === tierKey
              return (
                <button
                  type="button"
                  key={tierKey}
                  onClick={() => {
                    if (stage === "idle" || stage === "result") {
                      setSelectedTier(tierKey)
                    }
                  }}
                  disabled={stage !== "idle" && stage !== "result"}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-2xl text-left transition-all flex items-center justify-between border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    isSelected
                      ? "text-white shadow-xl ring-2"
                      : "bg-white/[0.03] text-zinc-400 border-white/10 hover:bg-white/[0.08] hover:text-white"
                  )}
                  style={{
                    backgroundColor: isSelected ? `${t.hexColor}25` : undefined,
                    borderColor: isSelected ? t.hexColor : undefined,
                    boxShadow: isSelected ? `0 0 25px ${t.glowColor}` : undefined
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl sm:text-2xl shrink-0">{t.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs sm:text-sm text-white truncate">{t.name}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">{t.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-mono text-xs sm:text-sm font-black text-amber-300 px-2 py-0.5 rounded-lg bg-black/40 border border-amber-500/20 block">
                      {t.price} 🪙
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            CENTRAL STAGE: 3D CRATE OR CS2 ROULETTE REEL
        ───────────────────────────────────────────────────────────── */}
        <div className="relative p-6 sm:p-10 bg-gradient-to-b from-[#090c14] via-[#0a0e18] to-[#0d121f] border-b border-white/10 min-h-[420px] flex flex-col items-center justify-center">

          {/* Ambient glow behind case */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            animate={{
              backgroundColor: stage === 'cracking' ? 'rgba(245, 158, 11, 0.15)' : stage === 'opening' ? 'rgba(245, 158, 11, 0.3)' : currentTier.glowColor,
              scale: stage === 'opening' ? [1, 1.5] : stage === 'cracking' ? [1, 1.1, 1] : 1
            }}
            transition={{ duration: stage === 'cracking' ? 0.5 : 0.7, repeat: stage === 'cracking' ? Infinity : 0 }}
          />

          {/* 1. 3D CASE DISPLAY & CRACKING */}
          <div className={cn("w-full flex flex-col items-center justify-center py-4 transition-all duration-300", (stage === "spinning" || stage === "result") ? "hidden" : "flex")}>
            
            {/* 3D Case Container - BIGGER */}
            <div
              className="w-[240px] h-[240px] relative mb-8"
              style={{ perspective: "1000px" }}
            >
              {/* Radial Crack Flash - More dramatic */}
              {stage === "opening" && (
                <>
                  <div className="absolute -inset-16 rounded-full bg-[radial-gradient(circle,rgba(228,174,57,0.8),transparent_60%)] pointer-events-none z-30 animate-flash-out" />
                  <div className="absolute -inset-20 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.4),transparent_50%)] pointer-events-none z-30 animate-flash-out" style={{ animationDelay: '0.1s' }} />
                </>
              )}

              {/* Case 3D Body */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br from-[#3b4453] via-[#1c222c] to-[#0d1117] border border-[#55606f] shadow-[0_30px_60px_-18px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] transition-transform duration-500",
                  stage === "idle" && "animate-hover-case",
                  stage === "cracking" && "animate-case-shudder"
                )}
                style={{ borderColor: currentTier.hexColor }}
              >
                {/* Metallic texture overlay */}
                <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0.04)_75%,transparent_75%)] bg-[size:8px_8px] pointer-events-none" />

                {/* Embossed Inner Border */}
                <div className="absolute inset-5 border border-[#616c7d]/60 rounded-xl" />

                {/* Inner glow */}
                <div className="absolute inset-5 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

                {/* 3D Hinged Lid on Top */}
                <div
                  className={cn(
                    "absolute left-3 right-3 top-3 h-[40%] rounded-t-xl bg-gradient-to-b from-[#565f70] to-[#2a313c] border border-[#626d7e] border-b-0 origin-top transition-all duration-700",
                    stage === "opening" && "opacity-0 -translate-y-20 [transform:rotateX(95deg)]"
                  )}
                >
                  {/* Lid highlight */}
                  <div className="absolute inset-x-4 top-2 h-1 rounded-full bg-white/10" />
                </div>

                {/* Golden Diamond Seal with "FF" Logo - Bigger */}
                <div
                  className={cn(
                    "absolute left-1/2 top-1/2 w-20 h-20 -ml-10 -mt-10 border-2 bg-zinc-950/80 flex items-center justify-center rotate-45 transition-all duration-500 z-10",
                    stage === "cracking" && "shadow-[0_0_45px_rgba(228,174,57,0.7)]",
                    stage === "opening" && "opacity-0 scale-[2]"
                  )}
                  style={{
                    borderColor: currentTier.hexColor,
                    boxShadow: `0 0 30px ${currentTier.glowColor}`
                  }}
                >
                  <span className="-rotate-45 font-black text-base tracking-widest" style={{ color: currentTier.hexColor }}>
                    FF
                  </span>
                </div>

                {/* Corner Rivet Screws */}
                <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-zinc-400/80 shadow-sm border border-zinc-500/30" />
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-zinc-400/80 shadow-sm border border-zinc-500/30" />
                <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-zinc-400/80 shadow-sm border border-zinc-500/30" />
                <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-zinc-400/80 shadow-sm border border-zinc-500/30" />
              </div>
            </div>

            {/* CS2 Odds Chips Row (Dynamic from currentTier) */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-7">
              <div className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                <span>Askeri {currentTier.oddsText.blue}</span>
              </div>
              <div className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                <span>Kısıtlı {currentTier.oddsText.purple}</span>
              </div>
              <div className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.5)]" />
                <span>Sınıflandırılmış {currentTier.oddsText.pink}</span>
              </div>
              <div className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                <span>Gizli {currentTier.oddsText.red}</span>
              </div>
              <div className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                <span>★ Nadir {currentTier.oddsText.gold}</span>
              </div>
            </div>

            {/* Big Action Open Button & Instant Skip */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartCaseOpening}
                disabled={stage !== "idle" || focusCoins < currentTier.price}
                className={cn(
                  "relative px-10 py-4 rounded-2xl font-black text-base uppercase tracking-wider transition-all flex items-center gap-3 shadow-2xl cursor-pointer overflow-hidden",
                  stage !== "idle"
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : focusCoins < currentTier.price
                    ? "bg-white/10 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#ffe08a] via-amber-400 to-amber-500 text-zinc-950 hover:brightness-110 hover:scale-105 active:scale-95 shadow-[0_10px_30px_-8px_rgba(228,174,57,0.6)]"
                )}
              >
                {/* Shimmer on button */}
                {stage === "idle" && focusCoins >= currentTier.price && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                  />
                )}
                {stage === "cracking" ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Kasa Kilidi Kırılıyor...</span>
                  </>
                ) : stage === "opening" ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-bounce" />
                    <span>Kapak Açılıyor!</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    <span>KASAYI AÇ</span>
                    <span className="text-xs font-mono opacity-80">{currentTier.price} 🪙</span>
                  </>
                )}
              </button>

              {(stage === "cracking" || stage === "opening") && (
                <button
                  onClick={handleInstantReveal}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 font-bold text-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Animasyonu atla ve sonucu hemen gör"
                >
                  <span>Geç ⏩</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. CS2 HORIZONTAL ROULETTE REEL */}
          <div className={cn("w-full transition-all duration-300", (stage === "spinning" || stage === "result") ? "block" : "hidden")}>
              {/* Outer Frame with side gradient fades */}
              <div
                ref={viewportRef}
                className="relative w-full h-[220px] rounded-2xl overflow-hidden border-2 border-white/10 bg-[#06080e] shadow-[inset_0_0_50px_rgba(0,0,0,0.95)]"
              >
                {/* Left Vignette Fade */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#06080e] via-[#06080e]/80 to-transparent z-20 pointer-events-none" />

                {/* Right Vignette Fade */}
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#06080e] via-[#06080e]/80 to-transparent z-20 pointer-events-none" />

                {/* CS2 ICONIC YELLOW CENTER POINTER NEEDLE (ROCK SOLID, PERFECTLY STRAIGHT) */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center justify-between py-1 transition-all duration-75",
                    needleBounce ? "brightness-125" : "brightness-100"
                  )}
                >
                  <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
                  <div className="w-[3px] h-full bg-gradient-to-b from-yellow-400 via-amber-300 to-yellow-400 shadow-[0_0_14px_#facc15]" />
                  <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[14px] border-b-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
                </div>

                {/* Moving Strip of Cards */}
                <div
                  ref={stripRef}
                  className="absolute top-0 bottom-0 left-0 flex items-center"
                  style={{ willChange: "transform" }}
                >
                  {reelItems.map((item, idx) => {
                    const isWinner = stage === "result" && idx === WINNER_INDEX
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        style={{
                          width: `${CARD_WIDTH}px`,
                          height: "184px",
                          marginRight: `${CARD_GAP}px`,
                          borderColor: item.hexColor
                        }}
                        className={cn(
                          "relative shrink-0 rounded-xl overflow-hidden flex flex-col justify-between p-3 transition-all duration-300 bg-gradient-to-b from-[#141b2a] via-[#0e131e] to-[#0a0d15] border shadow-lg",
                          isWinner && "scale-105 shadow-[0_0_35px_rgba(255,255,255,0.4)] z-10 border-2"
                        )}
                      >
                        {/* Top Rarity Tag */}
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span
                            className="font-black tracking-wider uppercase truncate"
                            style={{ color: item.hexColor }}
                          >
                            {item.rarity === "gold" ? "★ ÖZEL ★" : item.rarityLabel.split(" ")[0]}
                          </span>
                        </div>

                        {/* Central High-Quality Visual (Shop-style card visuals!) */}
                        <div className="relative my-auto flex items-center justify-center">
                          <div
                            className="absolute w-16 h-16 rounded-full blur-xl opacity-40"
                            style={{ backgroundColor: item.hexColor }}
                          />
                          <Cs2ItemVisual item={item} size="md" userPhoto={userPhoto} userInitials={userInitials} />
                        </div>

                        {/* Item Info */}
                        <div className="text-center relative z-10">
                          <div className="text-[11px] font-bold text-white leading-tight truncate">
                            {item.name}
                          </div>
                          <div className="text-[9px] text-zinc-400 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>

                        {/* CS2 Bottom Solid Rarity Color Bar */}
                        <div
                          className="absolute bottom-0 inset-x-0 h-1.5 shadow-sm"
                          style={{
                            backgroundColor: item.hexColor,
                            boxShadow: `0 -2px 10px ${item.borderGlow}`
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 3. CS2 RESULT PANEL (INSPIRED DIRECTLY BY KASA-AÇMA.HTML) */}
              {stage === "result" && winnerItem && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-6 p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-2xl relative overflow-hidden",
                    winnerItem.isLoss
                      ? "bg-blue-950/30 border-blue-500/40"
                      : winnerItem.rarity === "gold"
                      ? "bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-yellow-400/80 shadow-[0_0_50px_rgba(250,204,21,0.25)]"
                      : winnerItem.rarity === "red"
                      ? "bg-red-950/35 border-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.25)]"
                      : "bg-purple-950/35 border-purple-500/50"
                  )}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full">
                    {/* Big Item Box */}
                    <div
                      className="w-24 h-24 rounded-2xl flex items-center justify-center border-2 shadow-2xl shrink-0 p-2 relative overflow-hidden bg-black/40"
                      style={{
                        borderColor: winnerItem.hexColor,
                        boxShadow: `0 0 25px ${winnerItem.borderGlow}`
                      }}
                    >
                      <Cs2ItemVisual item={winnerItem} size="lg" userPhoto={userPhoto} userInitials={userInitials} />
                      <div
                        className="absolute bottom-0 inset-x-0 h-1.5"
                        style={{ backgroundColor: winnerItem.hexColor }}
                      />
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        {/* Rarity Tag */}
                        <span
                          className="text-[11px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded border"
                          style={{
                            color: winnerItem.hexColor,
                            borderColor: winnerItem.hexColor,
                            backgroundColor: `${winnerItem.hexColor}15`
                          }}
                        >
                          {winnerItem.rarityLabel}
                        </span>

                        {/* Item Type Badge */}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/10 flex items-center gap-1">
                          {winnerItem.type === "coin" && <span>🪙 Focus Para</span>}
                          {winnerItem.type === "frame" && <span>🖼️ Avatar Çerçevesi</span>}
                          {winnerItem.type === "effect" && <span>✨ Profil Efekti</span>}
                          {winnerItem.type === "freeze" && <span>🛡️ Seri Kalkanı</span>}
                          {winnerItem.type === "booster" && <span>⚡ Güçlendirici</span>}
                          {winnerItem.type === "title" && <span>🏷️ Özel Unvan</span>}
                        </span>

                        {/* Profit or Outcome Badge */}
                        {winnerItem.isDuplicate ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>YİNELENEN EŞYA TELAFİSİ (%60 İADE)</span>
                          </span>
                        ) : winnerItem.isLoss ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                            💧 TELAFİ ÖDÜLÜ
                          </span>
                        ) : winnerItem.rarity === "gold" || winnerItem.rarity === "red" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 text-[10px] font-black border border-amber-500/40 animate-pulse">
                            ⭐ BÜYÜK İKRAMİYE!
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            🎉 KÂRLI KAZANÇ!
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                        {winnerItem.name}
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {winnerItem.desc}
                      </p>

                      {/* DUPLICATE REFUND NOTICE BANNER */}
                      {winnerItem.isDuplicate && (
                        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              <strong>Yinelenen Eşya Telafisi:</strong> Bu eşyaya zaten sahip olduğun için harcamanın %60&apos;ı (<strong>+{winnerItem.duplicateRefundAmount} Focus Para</strong>) hesabına iade edildi!
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono font-bold shrink-0">
                            +{winnerItem.duplicateRefundAmount} 🪙 İADE
                          </span>
                        </div>
                      )}

                      {/* FOCUSFLOW NATIVE REWARD STATUS CARD */}
                      <div className="pt-1 max-w-lg">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                          {winnerItem.type === "coin" && (
                            <>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                                  <Coins className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-[10px] text-zinc-400 font-medium">Kazanılan Miktar</div>
                                  <div className="text-amber-300 font-black text-sm">+{winnerItem.amount} Focus Para</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Hesabına Aktarıldı</span>
                              </div>
                            </>
                          )}

                          {winnerItem.type === "freeze" && (
                            <>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold shrink-0">
                                  <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-[10px] text-zinc-400 font-medium">Seri Koruma Kalkanı</div>
                                  <div className="text-sky-300 font-black text-sm">+{winnerItem.amount || 1} Günlük Güvence</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Envanterinde Hazır</span>
                              </div>
                            </>
                          )}

                          {winnerItem.type === "booster" && (
                            <>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-bold shrink-0">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-[10px] text-zinc-400 font-medium">Çarpan Güçlendirici</div>
                                  <div className="text-yellow-300 font-black text-sm">12 Saat 2x Para</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Anında Aktifleşti</span>
                              </div>
                            </>
                          )}

                          {(winnerItem.type === "frame" || winnerItem.type === "effect" || winnerItem.type === "title") && (
                            <>
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 border"
                                  style={{
                                    backgroundColor: `${winnerItem.hexColor}20`,
                                    borderColor: `${winnerItem.hexColor}40`,
                                    color: winnerItem.hexColor
                                  }}
                                >
                                  {winnerItem.type === "frame" ? <Crown className="w-4 h-4" /> : winnerItem.type === "effect" ? <Sparkles className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                                </div>
                                <div>
                                  <div className="text-[10px] text-zinc-400 font-medium">Özel Koleksiyon Eşyası</div>
                                  <div className="text-white font-bold text-xs flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Kalıcı Olarak Envanterinde
                                  </div>
                                </div>
                              </div>

                              {/* Quick Equip / Kuşan Button */}
                              <div>
                                {isWinnerEquipped ? (
                                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Şu An Kuşanılmış</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={handleEquipWinner}
                                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Hemen Kuşan ✨</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                    {/* Quicksell Option */}
                    {onQuicksell && !isQuicksold && (winnerItem.type === "frame" || winnerItem.type === "effect" || winnerItem.type === "title") && (
                      <button
                        onClick={() => {
                          onQuicksell(winnerItem, currentTier.price)
                          setIsQuicksold(true)
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Bu eşyayı Focus Parasına dönüştür"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Paraya Bozdur (+{Math.round(currentTier.price * 0.75)} 🪙)</span>
                      </button>
                    )}
                    {isQuicksold && (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Bozduruldu (+{Math.round(currentTier.price * 0.75)} 🪙)</span>
                      </div>
                    )}

                    <button
                      onClick={handleStartCaseOpening}
                      disabled={focusCoins < currentTier.price}
                      className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tekrar Aç ({currentTier.price} 🪙)</span>
                    </button>
                    <button
                      onClick={() => setStage("idle")}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Kasaya Dön
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Bitir
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            CASE CONTENTS PREVIEW (CS2 KASA İÇERİĞİ VE OLASILIKLAR)
        ───────────────────────────────────────────────────────────── */}
        <div className="p-6 bg-[#090c15]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Kasa İçeriği ve Çıkma Olasılıkları</span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Kasadan çıkabilecek tüm 24 eşya, nadirlik dereceleri ve oranları
              </p>
            </div>

            {/* Rarity Tabs Filter (100% TÜRKÇE) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all", label: "Tümü (24)", color: "text-zinc-300" },
                { id: "gold", label: "★ Özel Nadir (%1)", color: "text-yellow-400" },
                { id: "red", label: "Gizli (%3)", color: "text-red-400" },
                { id: "pink", label: "Sınıflandırılmış (%8)", color: "text-pink-400" },
                { id: "purple", label: "Kısıtlı (%18)", color: "text-purple-400" },
                { id: "blue", label: "Askeri Sınıf (%70)", color: "text-blue-400" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer",
                    activeFilter === tab.id
                      ? "bg-white/15 text-white"
                      : "bg-white/5 hover:bg-white/10 text-zinc-400"
                  )}
                >
                  <span className={tab.color}>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Potential Drops */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {filteredCaseItems.map((item) => (
              <div
                key={item.id}
                className="relative rounded-xl border border-white/10 bg-white/[0.02] p-2.5 flex flex-col justify-between hover:bg-white/[0.05] transition-colors group overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <Cs2ItemVisual item={item} size="sm" userPhoto={userPhoto} userInitials={userInitials} />
                  <span
                    className="text-[9px] font-mono font-bold uppercase"
                    style={{ color: item.hexColor }}
                  >
                    {item.rarity === "gold" ? "★" : item.rarityLabel.split(" ")[0]}
                  </span>
                </div>

                <div className="mt-2.5">
                  <div className="text-[11px] font-bold text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </div>
                  <div className="text-[9px] text-zinc-400 truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>

                {/* Bottom colored bar */}
                <div
                  className="absolute bottom-0 inset-x-0 h-1"
                  style={{ backgroundColor: item.hexColor }}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
