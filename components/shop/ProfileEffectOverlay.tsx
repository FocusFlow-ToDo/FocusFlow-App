"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Sparkles, Zap, Flame, Star, Coins } from "lucide-react"

export interface ProfileEffectProps {
  effectId: string | null
  className?: string
  intensity?: "normal" | "subtle"
}

export function ProfileEffectOverlay({ effectId, className = "", intensity = "normal" }: ProfileEffectProps) {
  if (!effectId) return null

  switch (effectId) {
    case "effect_matrix":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Cyber scanline */}
          <motion.div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981]"
            animate={{ top: ["0%", "100%"] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
          />
          {/* Matrix code streams */}
          <div className="absolute inset-0 flex justify-around opacity-40 font-mono text-[10px] text-emerald-400 select-none">
            {[0, 1, 2, 3, 4, 5, 6].map((col) => (
              <motion.div
                key={col}
                className="flex flex-col space-y-1 tracking-widest"
                animate={{ y: ["-100%", "100%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2 + (col % 3) * 0.8,
                  delay: col * 0.35,
                  ease: "linear"
                }}
              >
                <span>01</span>
                <span>0x</span>
                <span>λ</span>
                <span>10</span>
                <span>▲</span>
                <span>01</span>
                <span>⌘</span>
                <span>FF</span>
                <span>99</span>
              </motion.div>
            ))}
          </div>
          {/* Ambient matrix tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-emerald-950/20 mix-blend-screen pointer-events-none" />
        </div>
      )

    case "effect_sakura":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Ambient pink aura */}
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-rose-400/5 to-transparent pointer-events-none" />
          {/* Floating Sakura Petals */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-[50%_0_50%_0] bg-gradient-to-br from-pink-300 via-rose-300 to-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)] opacity-70"
              style={{
                left: `${10 + i * 12}%`,
                top: "-15%"
              }}
              animate={{
                y: ["0%", "800%"],
                x: [0, (i % 2 === 0 ? 30 : -30), 0],
                rotate: [0, 360],
                opacity: [0, 0.9, 0.9, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 4.5 + (i % 3) * 1.2,
                delay: i * 0.6,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )

    case "effect_cosmic":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Nebula dust */}
          <motion.div
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.25)_0%,rgba(99,102,241,0.15)_35%,transparent_70%)]"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          />
          {/* Shooting Star */}
          <motion.div
            className="absolute h-[1.5px] w-20 bg-gradient-to-r from-transparent via-cyan-200 to-white shadow-[0_0_10px_#fff]"
            style={{ transform: "rotate(-35deg)", top: "20%", left: "-20%" }}
            animate={{
              left: ["-20%", "120%"],
              top: ["10%", "90%"],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              repeatDelay: 2.5,
              ease: "easeOut"
            }}
          />
          {/* Twinkling stars */}
          {[
            { top: "15%", left: "20%" },
            { top: "65%", left: "80%" },
            { top: "35%", left: "70%" },
            { top: "80%", left: "30%" },
            { top: "25%", left: "55%" }
          ].map((pos, idx) => (
            <motion.div
              key={idx}
              className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#c084fc]"
              style={pos}
              animate={{ scale: [0.5, 1.4, 0.5], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.8 + idx * 0.4, delay: idx * 0.3 }}
            />
          ))}
        </div>
      )

    case "effect_thunder":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Dark storm atmosphere */}
          <motion.div
            className="absolute inset-0 bg-cyan-500/10"
            animate={{ opacity: [0.05, 0.25, 0.05, 0.35, 0.05] }}
            transition={{ repeat: Infinity, duration: 3, repeatDelay: 1.5 }}
          />
          {/* Electric sparks */}
          {[0, 1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className="absolute text-sky-400"
              style={{
                top: `${20 + s * 22}%`,
                left: `${15 + s * 24}%`
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.6, 1.3, 0.7],
                filter: ["drop-shadow(0 0 4px #38bdf8)", "drop-shadow(0 0 14px #0284c7)"]
              }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                repeatDelay: 1.2 + s * 0.5,
                delay: s * 0.4
              }}
            >
              <Zap className="w-5 h-5 fill-sky-300 stroke-cyan-200" />
            </motion.div>
          ))}
          {/* Rain streaks */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.15)_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />
        </div>
      )

    case "effect_flame":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Bottom fiery gradient */}
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-red-600/35 via-orange-500/20 to-transparent pointer-events-none" />
          {/* Rising Ember Sparks */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-t from-yellow-300 via-orange-400 to-red-500 shadow-[0_0_10px_#f97316]"
              style={{
                left: `${12 + i * 13}%`,
                bottom: "0%"
              }}
              animate={{
                y: ["0%", "-400%"],
                x: [0, (i % 2 === 0 ? 15 : -15), 0],
                scale: [1, 0.4],
                opacity: [1, 0.8, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2 + (i % 3) * 0.6,
                delay: i * 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )

    case "effect_synthwave":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Retro Sunset Horizon Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-600/15 via-purple-600/10 to-cyan-500/20" />
          {/* Retro glowing neon sun arc */}
          <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-32 h-16 rounded-t-full bg-gradient-to-t from-amber-400 via-pink-500 to-transparent shadow-[0_0_30px_rgba(244,63,94,0.6)] opacity-70" />
          {/* Perspective grid lines */}
          <div className="absolute bottom-0 inset-x-0 h-20 bg-[linear-gradient(to_bottom,transparent_0%,rgba(168,85,247,0.3)_100%),linear-gradient(to_right,rgba(236,72,153,0.3)_1px,transparent_1px)] bg-[size:100%_100%,18px_100%] opacity-60" />
        </div>
      )

    case "effect_aurora":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Flowing Aurora Waves */}
          <motion.div
            className="absolute -top-10 -inset-x-10 h-40 bg-gradient-to-r from-teal-400/20 via-emerald-400/25 to-indigo-500/25 blur-xl"
            animate={{
              x: ["-10%", "10%", "-10%"],
              scaleY: [1, 1.25, 1],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{
              repeat: Infinity,
              duration: 7,
              ease: "easeInOut"
            }}
          />
          {/* Soft sparkles */}
          {[15, 45, 75].map((pos, idx) => (
            <motion.div
              key={idx}
              className="absolute w-1.5 h-1.5 rounded-full bg-teal-200 shadow-[0_0_8px_#2dd4bf]"
              style={{ top: "30%", left: `${pos}%` }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: idx * 0.7 }}
            />
          ))}
        </div>
      )

    case "effect_gold":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Gold shower particles */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-yellow-400/5 to-transparent" />
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <motion.div
              key={c}
              className="absolute text-yellow-300"
              style={{
                left: `${15 + c * 15}%`,
                top: "-15%"
              }}
              animate={{
                y: ["0%", "500%"],
                rotateY: [0, 360],
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + (c % 3) * 0.7,
                delay: c * 0.5,
                ease: "easeInOut"
              }}
            >
              <Coins className="w-4 h-4 fill-amber-400 stroke-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            </motion.div>
          ))}
        </div>
      )

    // ═══════════════════════════════════════════
    // ██  PRESTİJ & MİTİK PROFİL EFEKTLERİ  ██
    // ═══════════════════════════════════════════

    case "effect_dimension":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Dimensional rift glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/20 via-cyan-500/15 to-purple-700/25"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
          {/* Rotating portal ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] rounded-full border-2 border-fuchsia-400/40 shadow-[0_0_30px_rgba(236,72,153,0.5),inset_0_0_30px_rgba(34,211,238,0.3)]"
            animate={{ rotate: 360, scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            animate={{ rotate: -360, scale: [1.1, 0.85, 1.1] }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          />
          {/* Reality fracture particles */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.div
              key={i}
              className={`absolute w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-fuchsia-400 shadow-[0_0_10px_#d946ef]' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`}
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + (i % 4) * 20}%`
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                y: [0, -20, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 2 + (i % 3) * 0.5,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )

    case "effect_divine_crown":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Holy golden atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 via-yellow-300/10 to-transparent" />
          {/* Crown glow at top */}
          <motion.div
            className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl filter drop-shadow-[0_0_15px_rgba(255,215,0,0.9)]"
            animate={{
              y: [-2, 4, -2],
              filter: ["drop-shadow(0 0 15px rgba(255,215,0,0.9))", "drop-shadow(0 0 25px rgba(255,215,0,1))", "drop-shadow(0 0 15px rgba(255,215,0,0.9))"]
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            👑
          </motion.div>
          {/* Orbiting star dust halo */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-yellow-200 shadow-[0_0_8px_rgba(253,224,71,0.9)]"
              style={{ top: "15%", left: "50%" }}
              animate={{
                x: [Math.cos((i * 40 * Math.PI) / 180) * 50, Math.cos(((i * 40 + 360) * Math.PI) / 180) * 50],
                y: [Math.sin((i * 40 * Math.PI) / 180) * 20, Math.sin(((i * 40 + 360) * Math.PI) / 180) * 20],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                delay: i * 0.3,
                ease: "linear"
              }}
            />
          ))}
          {/* Falling golden sparkles */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={`spark-${i}`}
              className="absolute text-yellow-300 text-sm"
              style={{ left: `${15 + i * 18}%`, top: "-10%" }}
              animate={{
                y: ["0%", "600%"],
                opacity: [0, 0.8, 0],
                rotate: [0, 180]
              }}
              transition={{
                repeat: Infinity,
                duration: 4 + i * 0.5,
                delay: i * 0.8,
                ease: "easeIn"
              }}
            >
              ✦
            </motion.div>
          ))}
        </div>
      )

    case "effect_phoenix_rebirth":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Fiery gradient base */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-red-600/30 via-orange-500/15 to-amber-400/10"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />
          {/* Phoenix wing flames - left */}
          <motion.div
            className="absolute bottom-0 left-0 w-1/3 h-3/4 bg-gradient-to-tr from-red-600/40 via-orange-400/25 to-transparent blur-sm"
            animate={{ scaleY: [0.8, 1.2, 0.8], opacity: [0.5, 0.9, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          {/* Phoenix wing flames - right */}
          <motion.div
            className="absolute bottom-0 right-0 w-1/3 h-3/4 bg-gradient-to-tl from-red-600/40 via-orange-400/25 to-transparent blur-sm"
            animate={{ scaleY: [0.8, 1.2, 0.8], opacity: [0.5, 0.9, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.3, ease: "easeInOut" }}
          />
          {/* Rising fire sparks */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${i % 3 === 0 ? 'w-2.5 h-2.5 bg-yellow-300 shadow-[0_0_12px_#fbbf24]' : i % 3 === 1 ? 'w-2 h-2 bg-orange-400 shadow-[0_0_10px_#fb923c]' : 'w-1.5 h-1.5 bg-red-400 shadow-[0_0_8px_#f87171]'}`}
              style={{ left: `${8 + i * 10}%`, bottom: "0%" }}
              animate={{
                y: ["0%", "-500%"],
                x: [0, (i % 2 === 0 ? 20 : -20), 0],
                scale: [1, 0.3],
                opacity: [1, 0.9, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.8 + (i % 4) * 0.4,
                delay: i * 0.2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )

    case "effect_zeus_storm":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Storm atmosphere */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-cyan-500/10 to-transparent"
            animate={{ opacity: [0.3, 0.7, 0.1, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          {/* Lightning flash */}
          <motion.div
            className="absolute inset-0 bg-cyan-200/40"
            animate={{ opacity: [0, 0, 0.6, 0, 0, 0, 0.4, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          />
          {/* Massive lightning bolts */}
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <motion.div
              key={s}
              className="absolute text-cyan-300"
              style={{
                top: `${10 + s * 16}%`,
                left: `${10 + s * 18}%`
              }}
              animate={{
                opacity: [0, 1, 0.3, 1, 0],
                scale: [0.5, 1.5, 0.8, 1.4, 0.5],
                filter: ["drop-shadow(0 0 5px #22d3ee)", "drop-shadow(0 0 20px #0891b2)", "drop-shadow(0 0 5px #22d3ee)"]
              }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                repeatDelay: 1.5 + s * 0.4,
                delay: s * 0.3
              }}
            >
              <Zap className={`${s % 2 === 0 ? 'w-6 h-6' : 'w-4 h-4'} fill-cyan-200 stroke-blue-300`} />
            </motion.div>
          ))}
          {/* Electric field lines */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(34,211,238,0.15)_0%,transparent_60%)]" />
        </div>
      )

    case "effect_dark_matter":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Void darkness */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-violet-900/20 to-indigo-950/25"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          {/* Dark matter gravitational lensing */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(88,28,135,0.6)_0%,rgba(76,29,149,0.3)_40%,transparent_70%)]"
            animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.5, 0.9, 0.5] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          {/* Orbiting dark particles */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.9)]"
              style={{ top: "50%", left: "50%" }}
              animate={{
                x: [Math.cos((i * 51 * Math.PI) / 180) * 60, Math.cos(((i * 51 + 360) * Math.PI) / 180) * 60],
                y: [Math.sin((i * 51 * Math.PI) / 180) * 40, Math.sin(((i * 51 + 360) * Math.PI) / 180) * 40],
                scale: [0.5, 1.2, 0.5],
                opacity: [0.3, 0.9, 0.3]
              }}
              transition={{
                repeat: Infinity,
                duration: 5 + i * 0.4,
                delay: i * 0.5,
                ease: "linear"
              }}
            />
          ))}
          {/* Purple energy waves */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(124,58,237,0.2)_0%,transparent_50%)]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
        </div>
      )

    case "effect_aurora_supernova":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Multi-color aurora waves */}
          <motion.div
            className="absolute -top-5 -inset-x-5 h-32 bg-gradient-to-r from-red-500/20 via-amber-400/25 via-emerald-400/20 via-cyan-400/25 to-purple-500/20 blur-lg"
            animate={{
              x: ["-15%", "15%", "-15%"],
              scaleY: [1, 1.4, 1],
              opacity: [0.5, 0.9, 0.5]
            }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -top-2 -inset-x-5 h-24 bg-gradient-to-r from-violet-500/15 via-pink-400/20 via-orange-400/15 to-teal-400/20 blur-md"
            animate={{
              x: ["10%", "-10%", "10%"],
              scaleY: [1.2, 0.8, 1.2],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ repeat: Infinity, duration: 5, delay: 1, ease: "easeInOut" }}
          />
          {/* Rainbow sparkle particles */}
          {[
            { color: "bg-red-400 shadow-[0_0_8px_#f87171]", left: "10%" },
            { color: "bg-orange-400 shadow-[0_0_8px_#fb923c]", left: "25%" },
            { color: "bg-yellow-400 shadow-[0_0_8px_#facc15]", left: "40%" },
            { color: "bg-emerald-400 shadow-[0_0_8px_#34d399]", left: "55%" },
            { color: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]", left: "70%" },
            { color: "bg-purple-400 shadow-[0_0_8px_#c084fc]", left: "85%" }
          ].map((p, idx) => (
            <motion.div
              key={idx}
              className={`absolute w-1.5 h-1.5 rounded-full ${p.color}`}
              style={{ left: p.left, top: "20%" }}
              animate={{
                y: [0, -15, 0],
                scale: [0.5, 1.5, 0.5],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                delay: idx * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )

    case "effect_katana":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Katana slash diagonal light beams */}
          <motion.div
            className="absolute h-[2px] w-[140%] bg-gradient-to-r from-transparent via-rose-400 to-white shadow-[0_0_15px_#f43f5e]"
            style={{ transform: "rotate(-32deg)", top: "35%", left: "-20%" }}
            animate={{
              opacity: [0, 1, 0],
              scaleX: [0.2, 1.2, 0.4],
              x: ["-30%", "30%", "-30%"]
            }}
            transition={{
              repeat: Infinity,
              duration: 2.8,
              repeatDelay: 1.2,
              ease: "easeInOut"
            }}
          />
          {/* Blood-red and crimson ambience */}
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/25 via-red-900/10 to-transparent pointer-events-none" />
          {/* Crimson blade sparks & sakura leaves */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${i % 2 === 0 ? "w-2 h-2 bg-rose-400 shadow-[0_0_10px_#f43f5e]" : "w-1.5 h-1.5 bg-amber-300 shadow-[0_0_8px_#f59e0b]"}`}
              style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{
                y: [0, -25, 0],
                x: [0, (i % 2 === 0 ? 18 : -18), 0],
                opacity: [0, 0.9, 0],
                scale: [0.5, 1.4, 0.5]
              }}
              transition={{
                repeat: Infinity,
                duration: 2 + (i % 3) * 0.6,
                delay: i * 0.35,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )

    case "effect_angelic":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Divine golden rays aura */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(254,240,138,0.25)_0%,rgba(245,158,11,0.1)_45%,transparent_75%)]"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          {/* Ascending holy feather particles */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="absolute text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] text-xs"
              style={{ left: `${10 + i * 13}%`, bottom: "-10%" }}
              animate={{
                y: ["0%", "-480%"],
                x: [0, (i % 2 === 0 ? 15 : -15), 0],
                rotate: [0, 45, -30, 0],
                opacity: [0, 0.9, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 4 + (i % 3) * 1.2,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            >
              🪶
            </motion.div>
          ))}
          {/* Angelic stars twinkling */}
          {[18, 48, 78].map((pos, idx) => (
            <motion.div
              key={idx}
              className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
              style={{ top: "25%", left: `${pos}%` }}
              animate={{ scale: [0.6, 1.5, 0.6], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, delay: idx * 0.6 }}
            />
          ))}
        </div>
      )

    case "effect_blackhole":
      return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${className}`}>
          {/* Gravitational center singularity */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-black border border-purple-500/60 shadow-[0_0_40px_rgba(147,51,234,0.7),inset_0_0_20px_rgba(0,0,0,1)]" />
          {/* Accretion disc rotating */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-dashed border-violet-400/40 shadow-[0_0_30px_rgba(139,92,246,0.6)]"
            animate={{ rotate: 360, scale: [0.95, 1.05, 0.95] }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border-2 border-indigo-400/50 shadow-[0_0_25px_rgba(99,102,241,0.5)]"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
          />
          {/* Cosmic particles getting sucked in */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#c084fc]"
              style={{ top: "50%", left: "50%" }}
              animate={{
                x: [Math.cos((i * 60 * Math.PI) / 180) * 80, 0],
                y: [Math.sin((i * 60 * Math.PI) / 180) * 80, 0],
                opacity: [0, 1, 0],
                scale: [1.2, 0.2]
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                delay: i * 0.35,
                ease: "easeIn"
              }}
            />
          ))}
        </div>
      )

    default:
      return null
  }
}
