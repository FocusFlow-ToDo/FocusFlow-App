"use client"

import React, { useEffect } from "react"
import { motion, useMotionValue, useTransform, useSpring, useMotionTemplate } from "motion/react"
import { Trophy, Star, Sparkles, X, Orbit } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AchievementTheme } from "./AchievementModal"
import type { AchievementData } from "./AchievementModal"
import confetti from "canvas-confetti"

interface AchievementCardProps {
  badge: AchievementData
  theme: AchievementTheme
  onClose: () => void
}

export function AchievementCard({ badge, theme: T, onClose }: AchievementCardProps) {
  const [canClose, setCanClose] = React.useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 500)
    return () => clearTimeout(t)
  }, [])

  const mouseX = useMotionValue(200)
  const mouseY = useMotionValue(250)

  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  const rotateX = useTransform(springY, [0, 500], ["15deg", "-15deg"])
  const rotateY = useTransform(springX, [0, 400], ["-15deg", "15deg"])

  const glareBackground = useMotionTemplate`radial-gradient(circle at ${springX}px ${springY}px, rgba(255,255,255,0.05) 0%, transparent 50%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const handleMouseLeave = () => {
    mouseX.set(200)
    mouseY.set(250)
  }

  useEffect(() => {
    // Fire real confetti on mount
    const colors = [
      "#6366f1", "#10b981", "#f43f5e", "#f59e0b", 
      "#3b82f6", "#14b8a6", "#ec4899", "#ef4444"
    ]
    
    // Short delay to sync with card pop
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.6 },
        colors,
        disableForReducedMotion: true,
        zIndex: 101, // Above backdrop
      })
    }, 150)
  }, [])

  return (
    <motion.div
      key="reveal-phase"
      initial={{ opacity: 0, scale: 0.3, y: 150, rotateX: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20, rotateX: -20 }}
      transition={{ 
        type: "spring", 
        stiffness: 180, 
        damping: 18, 
        mass: 0.9,
      }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
      style={{ perspective: 1200 }}
    >
      {/* The Epic Card */}
      <motion.div
         onMouseMove={handleMouseMove}
         onMouseLeave={handleMouseLeave}
         onClick={(e) => { e.stopPropagation(); if (canClose) onClose() }}
         className="relative w-[380px] sm:w-[400px] aspect-[3/4] min-h-[500px] rounded-[2.5rem] p-[2px] cursor-pointer group pointer-events-auto"
         style={{ 
           rotateX, 
           rotateY, 
           transformStyle: "preserve-3d", 
           boxShadow: `0 40px 100px -20px ${T.glowColor}, 0 0 50px -10px ${T.shimmerColor}`
         }}
      >
        {/* Animated outer border */}
        <motion.div 
          className="absolute inset-0 rounded-[2.5rem] opacity-70"
          animate={{ background: [`conic-gradient(from 0deg, transparent, ${T.cardBorder}, transparent)`, `conic-gradient(from 360deg, transparent, ${T.cardBorder}, transparent)`] }}
        />

        <div 
          className="relative w-full h-full rounded-[2.4rem] overflow-hidden flex flex-col items-center justify-center p-8 text-center"
          style={{ background: T.cardBg }}
        >
          {/* Glare Effect */}
          <div className="absolute inset-0 z-50 overflow-hidden rounded-[2.4rem] pointer-events-none mix-blend-overlay">
            <motion.div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: glareBackground }}
            />
          </div>

          {/* Shimmer overlay */}
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            className="absolute inset-0 w-1/2 h-full pointer-events-none skew-x-[-20deg]"
          />

          {/* Inner details */}
          <div className={`absolute inset-2 border ${T.innerBorder} rounded-[2rem] z-0`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />

          {/* Floating symbols */}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute top-12 left-12 opacity-30">
            <Orbit className={`w-32 h-32 ${T.orbitIco}`} />
          </motion.div>
          
          {/* Close Button Removed */}

          {/* 3D Content */}
          <div 
             style={{ transform: "translateZ(80px)" }} 
             className="flex flex-col items-center justify-center z-20 pointer-events-none w-full"
          >
            {/* Main Trophy Icon with huge pulses */}
            <div className="relative mb-12">
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 ${T.pulseGlow} blur-[40px] rounded-full scale-150`} 
              />
              
              <div className={`relative w-36 h-36 bg-gradient-to-br ${T.trophyGrad} rounded-full p-[3px]`} style={{ boxShadow: `0 0 60px ${T.trophyShadow}` }}>
                 <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center relative overflow-hidden">
                    <motion.div 
                      animate={{ y: ["100%", "-100%"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent skew-y-12"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${T.trophyInner} to-transparent`} />
                    <Trophy className={`w-16 h-16 ${T.icoCol}`} style={{ filter: `drop-shadow(0 0 20px ${T.icoDrop})` }} />
                 </div>
              </div>

              <motion.div 
                 initial={{ scale: 0, rotate: -180 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                 className="absolute -top-4 -right-4"
              >
                <Sparkles className={`w-12 h-12 ${T.spark}`} style={{ filter: `drop-shadow(0 0 15px ${T.sparkDrop})` }} />
              </motion.div>

              <motion.div 
                 initial={{ scale: 0, rotate: 180 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                 className="absolute -bottom-2 -left-6"
              >
                <Star className={`w-10 h-10 ${T.botStar}`} style={{ filter: `drop-shadow(0 0 15px ${T.botStarDrop})` }} />
              </motion.div>
            </div>

            <h3 className="text-white/50 text-xs font-black tracking-[0.4em] uppercase mb-4">
              YENİ BAŞARIM!
            </h3>

            <h2 className={`text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b ${T.titleText} drop-shadow-xl text-center leading-normal mb-4 px-4 py-2 z-30 break-words w-full`}>
              &ldquo;{badge.name}&rdquo;
            </h2>

            <div className={`w-16 h-[3px] ${T.divider} rounded-full mb-6`} />

            <p className={`text-[15px] font-medium ${T.descColor} max-w-[280px] leading-relaxed text-center`}>
              {badge.desc || `${badge.target} ${badge.suffix} hedefine başarıyla ulaştın!`}
            </p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
