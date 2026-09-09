"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { AchievementPack } from "./AchievementPack"
import { AchievementCard } from "./AchievementCard"
import { AchievementTheme, getGlobalTheme as getTheme } from "./AchievementThemes"

export type { AchievementTheme }

export interface AchievementData {
  name: string
  target: number
  suffix: string
  desc?: string
  color?: string
}

interface AchievementModalProps {
  badge: AchievementData | null
  onClose: () => void
  forceReveal?: boolean
}

export { getTheme }

export function AchievementModal({ badge, onClose, forceReveal }: AchievementModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [phase, setPhase] = useState<"pack" | "burst" | "reveal">("pack")
  const [canCloseBg, setCanCloseBg] = useState(false)

  useEffect(() => {
    if (badge) {
      if (forceReveal) {
        setPhase("reveal")
        setIsOpen(true)
        setCanCloseBg(true)
      } else {
        setPhase("pack")
        setIsOpen(true)
        setCanCloseBg(false)
      }
    } else {
      setIsOpen(false)
      setPhase("pack")
    }
  }, [badge, forceReveal])

  // Auto-open pack after 600ms if user hasn't clicked
  useEffect(() => {
    if (phase === "pack" && isOpen && !forceReveal) {
      const t = setTimeout(() => {
        handleOpenPack()
      }, 600)
      return () => clearTimeout(t)
    }
  }, [phase, isOpen, forceReveal])

  // Auto-dismiss after 3 seconds in reveal phase
  useEffect(() => {
    if (phase === "reveal" && isOpen && !forceReveal) {
      const t = setTimeout(() => {
        handleClose()
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [phase, isOpen, forceReveal])

  useEffect(() => {
    if (phase === "reveal") {
      const t = setTimeout(() => setCanCloseBg(true), 500)
      return () => clearTimeout(t)
    } else {
      setCanCloseBg(false)
    }
  }, [phase])

  const handleOpenPack = useCallback(() => {
    // Burst flash -> short delay -> reveal
    setPhase("burst")
    setTimeout(() => {
      setPhase("reveal")
    }, 200) // Faster burst (was 400)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    // Tiny delay then call parent
    setTimeout(() => onClose(), 150)
  }, [onClose])

  if (!badge) return null

  const T = getTheme(badge)

  return (
    <AnimatePresence>
      {isOpen && badge && (
        <motion.div 
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
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
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
             <div className={`w-[600px] h-[600px] ${T.blurRing} rounded-full blur-[100px]`} />
          </motion.div>

          {/* Burst flash overlay */}
          <AnimatePresence>
            {phase === "burst" && (
              <motion.div
                key="burst-flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
              >
                <div 
                  className="w-[500px] h-[500px] rounded-full blur-[80px]"
                  style={{ background: `radial-gradient(circle, ${T.glowColor}, transparent 70%)` }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pack Phase */}
          <AnimatePresence>
            {phase === "pack" && (
              <AchievementPack onOpen={handleOpenPack} />
            )}
          </AnimatePresence>

          {/* Reveal Phase */}
          <AnimatePresence>
            {phase === "reveal" && (
              <AchievementCard badge={badge} theme={T} onClose={handleClose} />
            )}
          </AnimatePresence>
           
          {/* Overlay Confetti -- only during reveal */}
          {phase === "reveal" && Array.from({ length: 40 }).map((_, i) => (
             <motion.div
               key={`conf-${i}`}
               initial={{ opacity: 1, top: "100%", left: `${Math.random() * 100}%`, scale: Math.random() * 0.8 + 0.4, rotate: Math.random() * 360 }}
               animate={{ top: "-10%", x: (Math.random() - 0.5) * 400, rotate: Math.random() * 720, opacity: 0 }}
               transition={{ duration: 2 + Math.random() * 1.5, ease: "easeOut", delay: Math.random() * 0.3 }}
               className={cn("absolute z-[101] w-3 h-3 md:w-4 md:h-4 rounded-sm shadow-sm pointer-events-none", T.confetti[i % T.confetti.length])}
             />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
