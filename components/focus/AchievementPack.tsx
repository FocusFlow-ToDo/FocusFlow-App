"use client"

import React from "react"
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "motion/react"
import { Trophy, Star, Sparkles } from "lucide-react"

interface AchievementPackProps {
  onOpen: () => void
}

export function AchievementPack({ onOpen }: AchievementPackProps) {
  const [canOpen, setCanOpen] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setCanOpen(true), 400)
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

  return (
    <motion.div
      key="pack-phase"
      initial={{ opacity: 0, scale: 0.5, y: 80 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ 
        opacity: 0, 
        scale: 1.1, 
        y: 20,
      }}
      transition={{ 
        type: "spring", stiffness: 200, damping: 18, mass: 0.8,
      }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={() => { if (canOpen) onOpen() }}
      style={{ perspective: 1200 }}
    >
      {/* Pack Card */}
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
          style={{ background: `linear-gradient(135deg, rgba(251,191,36,0.4), transparent 40%, rgba(245,158,11,0.3), transparent 70%, rgba(217,119,6,0.4))` }}
        />

        {/* Secondary glow ring */}
        <div
          className="absolute -inset-6 rounded-[2.5rem] pointer-events-none opacity-20"
          style={{ background: "conic-gradient(from 0deg, transparent, rgba(251,191,36,0.6), transparent, rgba(245,158,11,0.4), transparent)" }}
        />

        <div 
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ 
            background: "linear-gradient(145deg, #1a1508 0%, #0d0a04 30%, #1a1508 50%, #0d0a04 70%, #1a1508 100%)",
            boxShadow: `0 0 20px rgba(251,191,36,0.15), 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(251,191,36,0.2), inset 0 -1px 0 rgba(251,191,36,0.1)`,
            border: "2px solid rgba(251,191,36,0.25)"
          }}
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
          />

          {/* Top gold bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-700 via-amber-400 to-yellow-700" />
          
          {/* Ornamental gold border frame */}
          <div className="absolute inset-3 border border-amber-500/20 rounded-2xl" />
          <div className="absolute inset-5 border border-amber-500/10 rounded-xl" />
          
          {/* Corner ornaments */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-500/40 rounded-tl-xl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-500/40 rounded-tr-xl" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-500/40 rounded-bl-xl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-500/40 rounded-br-xl" />

          {/* Background texture pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(251,191,36,1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          
          {/* Floating gold particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              animate={{ 
                y: [0, -15, 0], 
                opacity: [0.1, 0.5, 0.1],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              className="absolute w-1 h-1 rounded-full bg-amber-400/60 pointer-events-none"
              style={{ left: `${15 + i * 10}%`, top: `${20 + (i % 3) * 25}%` }}
            />
          ))}

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
            
            {/* FocusFlow Logo */}
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-amber-500/30 blur-[30px] rounded-full scale-[2.5]" />
              
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                <img src="/logo.png" alt="FocusFlow" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              </div>
            </motion.div>

            <h3 className="text-[11px] font-black tracking-[0.5em] text-amber-400/50 uppercase mb-1">
              FocusFlow
            </h3>

            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent rounded-full mb-6" />

            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 tracking-tight mb-2">
              Yeni Başarım!
            </h2>
            <p className="text-[12px] text-amber-200/30 font-medium mb-6">
              Bir efsane seni bekliyor...
            </p>

            <motion.div 
              className="relative"
              animate={{ y: [0, -6, 0], rotateZ: [0, 3, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-150" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500">?</span>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-700 via-amber-400 to-yellow-700" />

          <Sparkles className="absolute top-6 right-6 w-5 h-5 text-amber-500/20" />
          <Star className="absolute bottom-6 left-6 w-5 h-5 text-amber-500/20 fill-amber-500/10" />
          <Trophy className="absolute top-6 left-6 w-4 h-4 text-amber-500/15" />
        </div>
      </motion.div>
      
      {/* Removed CTA buttons entirely per user request */}
    </motion.div>
  )
}
