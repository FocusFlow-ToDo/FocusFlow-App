"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import {
  Flame, Snowflake, Shield, AlertTriangle, CheckCircle2,
  Coins, Sparkles, X, Plus, ArrowRight
} from "lucide-react"
import { useSettings } from "@/hooks/useSettings"
import { useToast } from "@/contexts/ToastContext"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"

interface StreakFreezeModalProps {
  open: boolean
  onClose: () => void
}

const FREEZE_COST = 50

export function StreakFreezeModal({ open, onClose }: StreakFreezeModalProps) {
  const { settings, updateSettings } = useSettings()
  const { showToast } = useToast()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  const streakCount = settings.streakCount || 0
  const streakFreezes = settings.streakFreezes ?? 3
  const focusCoins = settings.focusCoins ?? 100

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  const isFrozenToday = settings.lastFrozenDate === today
  const isCompletedToday = settings.lastActionDate === today && !isFrozenToday
  const isAtRisk = !isFrozenToday && !isCompletedToday

  // Trigger ice confetti when frozen
  const triggerIceConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#38bdf8", "#06b6d4", "#e0f2fe", "#ffffff"],
    })
  }

  // Handle Manual Freeze Activation for Today
  const handleUseFreeze = () => {
    if (isFrozenToday) {
      showToast({ type: "info", message: "Bugün zaten dondurma koruması aktif! ❄️" })
      return
    }

    if (isCompletedToday) {
      showToast({ type: "info", message: "Bugün zaten görev tamamladın, serin güvende! 🔥" })
      return
    }

    if (streakFreezes <= 0) {
      showToast({ type: "error", message: "Yeterli seri dondurucun bulunmuyor." })
      return
    }

    const nextFreezes = streakFreezes - 1

    updateSettings({
      streakFreezes: nextFreezes,
      lastFrozenDate: today,
      lastActionDate: today,
    })

    triggerIceConfetti()
    showToast({
      type: "success",
      message: "❄️ Seri donduruldu! Bugün görev tamamlayamasan bile serin koruma altında.",
    })
  }

  // Handle purchasing an extra freeze with Focus Coins
  const handleBuyFreeze = () => {
    if (focusCoins < FREEZE_COST) {
      showToast({
        type: "error",
        message: `Yetersiz bakiye! 1 dondurucu için ${FREEZE_COST} Focus Para gerekiyor.`,
      })
      return
    }

    updateSettings({
      focusCoins: focusCoins - FREEZE_COST,
      streakFreezes: streakFreezes + 1,
    })

    showToast({
      type: "success",
      message: `❄️ 1 adet Seri Dondurucu satın alındı! (Kalan: ${focusCoins - FREEZE_COST} 🪙)`,
    })
  }

  const handleFocusTaskInput = () => {
    onClose()
    setTimeout(() => {
      document.querySelector<HTMLInputElement>("[data-task-input]")?.focus()
    }, 150)
  }

  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md bg-[#121218] border border-white/15 rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] z-10"
          >
            {/* Ambient Aura Top */}
            <div
              className={cn(
                "absolute top-0 inset-x-0 h-32 blur-3xl opacity-35 pointer-events-none transition-all duration-500",
                isFrozenToday
                  ? "bg-cyan-500"
                  : isCompletedToday
                  ? "bg-amber-500"
                  : "bg-rose-500",
              )}
            />

            {/* Header (Always Visible) */}
            <div className="relative px-5 py-4 flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center border",
                    isFrozenToday
                      ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                      : isCompletedToday
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                      : "bg-rose-500/15 border-rose-500/30 text-rose-400",
                  )}
                >
                  {isFrozenToday ? (
                    <Snowflake className="w-5 h-5 animate-spin-slow" />
                  ) : (
                    <Flame className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Seri & Dondurma Koruması
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Devamlılığını koru, emeğini kaybetme
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Kapat"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* Status Banner */}
              <div
                className={cn(
                  "p-4 rounded-2xl border transition-all duration-300",
                  isFrozenToday
                    ? "bg-cyan-950/30 border-cyan-500/30 shadow-[0_0_24px_rgba(6,182,212,0.12)]"
                    : isCompletedToday
                    ? "bg-amber-950/30 border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.12)]"
                    : "bg-rose-950/30 border-rose-500/30 shadow-[0_0_24px_rgba(244,63,94,0.12)]",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                      {streakCount} Gün
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">
                      Seri
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      isFrozenToday
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : isCompletedToday
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse",
                    )}
                  >
                    {isFrozenToday
                      ? "Donduruldu ❄️"
                      : isCompletedToday
                      ? "Bugün Güvende 🔥"
                      : "Tehlikede ⚠️"}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isFrozenToday
                    ? "Bugün dondurma hakkı kullandın. Görev yapmasan bile serin bozulmayacak ve güvenle devam edecek."
                    : isCompletedToday
                    ? "Bugün görevini tamamlayarak serini büyüttün! Yarın yeni görevlerle serini sürdürebilirsin."
                    : "Bugün henüz bir görev tamamlamadın. Gece yarısına kadar görev yapmaz veya serini dondurmazsan devamlılığın sıfırlanabilir!"}
                </p>
              </div>

              {/* Logic / Purpose Explanation Card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Dondurucu (Freeze) Mantığı</span>
                </div>
                <p className="text-[12px] text-zinc-300 leading-relaxed">
                  Haftalarca veya aylarca uğraştığın serini;
                  <span className="text-cyan-300 font-medium"> hasta olduğun, yoğun olduğun ya da mola vermek istediğin günlerde </span>
                  kaybetmemek adına dondurucu kullanabilirsin. Dondurulan günlerde serin kesilmez.
                </p>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      Dondurucu
                    </span>
                    <span className="text-xl font-black text-cyan-400 tabular-nums">
                      {streakFreezes} <span className="text-[10px] font-semibold text-zinc-400">adet</span>
                    </span>
                  </div>
                  <Snowflake className="w-5 h-5 text-cyan-400 opacity-80" />
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      Focus Para
                    </span>
                    <span className="text-xl font-black text-amber-400 tabular-nums">
                      {focusCoins.toLocaleString()} <span className="text-[10px] font-semibold text-zinc-400">🪙</span>
                    </span>
                  </div>
                  <Coins className="w-5 h-5 text-amber-400 opacity-80" />
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-1">
                {isFrozenToday ? (
                  <div className="w-full py-3 px-4 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Bugün Seri Koruma Altında (Donduruldu)</span>
                  </div>
                ) : isCompletedToday ? (
                  <div className="w-full py-3 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Bugünün Görevi Tamamlandı</span>
                  </div>
                ) : (
                  <button
                    onClick={handleUseFreeze}
                    disabled={streakFreezes <= 0}
                    className={cn(
                      "w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg",
                      streakFreezes > 0
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 active:scale-[0.98]"
                        : "bg-white/[0.05] text-zinc-500 border border-white/[0.05] cursor-not-allowed",
                    )}
                  >
                    <Snowflake className="w-4 h-4" />
                    <span>
                      {streakFreezes > 0
                        ? "Bugünü Dondur (1 ❄️ Kullan)"
                        : "Dondurucu Hakkın Kalmadı"}
                    </span>
                  </button>
                )}
              </div>

              {/* Secondary Options */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={handleBuyFreeze}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dondurucu Al ({FREEZE_COST} 🪙)</span>
                </button>

                <button
                  onClick={handleFocusTaskInput}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 transition-all font-semibold cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Görev Tamamla</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
