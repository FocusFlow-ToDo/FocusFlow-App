"use client"

import React from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react"
import Image from "next/image"

/* ── Animated counter ── */
function Counter({ from = 0, to, duration = 1.4, delay = 0.6 }: { from?: number; to: number; duration?: number; delay?: number }) {
  const count = useMotionValue(from)
  const rounded = useTransform(count, (v) => Math.round(v))
  const [display, setDisplay] = React.useState(from)

  React.useEffect(() => {
    const unsub = rounded.on("change", setDisplay)
    const controls = animate(count, to, { duration, delay, ease: [0.16, 1, 0.3, 1] })
    return () => { controls.stop(); unsub() }
  }, [to])

  return <span className="tabular-nums">{display}</span>
}

/* ── Orbiting particle ── */
function Particle({ radius, angle, size, color, duration }: { radius: number; angle: number; size: number; color: string; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size, height: size,
        background: color,
        top: "50%", left: "50%",
        marginTop: -size / 2, marginLeft: -size / 2,
      }}
      animate={{
        x: [
          Math.cos(angle) * radius, Math.cos(angle + Math.PI) * radius,
          Math.cos(angle + Math.PI * 2) * radius,
        ],
        y: [
          Math.sin(angle) * radius * 0.4, Math.sin(angle + Math.PI) * radius * 0.4,
          Math.sin(angle + Math.PI * 2) * radius * 0.4,
        ],
        opacity: [0.2, 0.8, 0.2],
      }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    />
  )
}

/* ── Pre-computed stable star data (avoids Math.random() hydration mismatch) ── */
const STARS = [
  { w: 1.5, h: 1.5, top: "7.3%",  left: "14.2%", dur: 3.1, delay: 0 },
  { w: 1.0, h: 1.0, top: "18.6%", left: "72.8%", dur: 4.2, delay: 0.4 },
  { w: 1.8, h: 1.8, top: "31.2%", left: "5.4%",  dur: 2.8, delay: 1.1 },
  { w: 1.2, h: 1.2, top: "44.5%", left: "88.1%", dur: 3.7, delay: 0.7 },
  { w: 0.9, h: 0.9, top: "53.9%", left: "33.4%", dur: 5.0, delay: 1.8 },
  { w: 1.6, h: 1.6, top: "62.7%", left: "61.0%", dur: 2.5, delay: 0.2 },
  { w: 1.1, h: 1.1, top: "75.3%", left: "20.5%", dur: 4.5, delay: 1.3 },
  { w: 1.4, h: 1.4, top: "84.1%", left: "47.9%", dur: 3.3, delay: 0.9 },
  { w: 0.8, h: 0.8, top: "91.6%", left: "79.2%", dur: 4.8, delay: 1.6 },
  { w: 1.7, h: 1.7, top: "11.8%", left: "39.7%", dur: 2.9, delay: 0.5 },
  { w: 1.3, h: 1.3, top: "23.4%", left: "56.3%", dur: 3.8, delay: 1.0 },
  { w: 1.0, h: 1.0, top: "36.9%", left: "91.4%", dur: 4.1, delay: 1.4 },
  { w: 1.5, h: 1.5, top: "49.2%", left: "8.7%",  dur: 2.7, delay: 0.3 },
  { w: 0.9, h: 0.9, top: "58.4%", left: "44.6%", dur: 5.2, delay: 1.9 },
  { w: 1.8, h: 1.8, top: "67.1%", left: "26.3%", dur: 3.5, delay: 0.8 },
  { w: 1.2, h: 1.2, top: "78.8%", left: "68.5%", dur: 4.0, delay: 1.2 },
  { w: 1.6, h: 1.6, top: "87.5%", left: "12.1%", dur: 2.6, delay: 0.6 },
  { w: 1.0, h: 1.0, top: "93.2%", left: "53.8%", dur: 3.9, delay: 1.7 },
  { w: 1.4, h: 1.4, top: "4.7%",  left: "83.6%", dur: 4.4, delay: 0.1 },
  { w: 1.1, h: 1.1, top: "16.3%", left: "29.1%", dur: 3.2, delay: 1.5 },
  { w: 1.9, h: 1.9, top: "42.0%", left: "66.7%", dur: 2.4, delay: 0.0 },
  { w: 0.8, h: 0.8, top: "72.6%", left: "37.4%", dur: 4.7, delay: 1.1 },
]

/* ══════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════ */
export function LoadingScreen({ isVisible }: { isVisible: boolean }) {
  const [progress, setProgress] = React.useState(0)
  const [phase, setPhase] = React.useState<"init" | "loading" | "done">("init")
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => { setIsMounted(true) }, [])

  React.useEffect(() => {
    if (!isVisible) { setProgress(0); setPhase("init"); return }

    setPhase("loading")

    // Simulate phased loading
    const steps = [
      { to: 28, delay: 100, duration: 400 },
      { to: 55, delay: 500, duration: 500 },
      { to: 78, delay: 1000, duration: 400 },
      { to: 92, delay: 1400, duration: 600 },
      { to: 100, delay: 2000, duration: 300 },
    ]

    const timers: ReturnType<typeof setTimeout>[] = []
    steps.forEach(({ to, delay, duration }) => {
      timers.push(setTimeout(() => setProgress(to), delay))
    })
    timers.push(setTimeout(() => setPhase("done"), 2400))

    return () => timers.forEach(clearTimeout)
  }, [isVisible])

  const particles = [
    { radius: 110, angle: 0,           size: 4, color: "rgba(99,102,241,0.9)",  duration: 5.5 },
    { radius: 110, angle: Math.PI / 2, size: 3, color: "rgba(59,130,246,0.7)",  duration: 5.5 },
    { radius: 140, angle: Math.PI / 3, size: 2.5, color: "rgba(167,139,250,0.8)", duration: 8 },
    { radius: 140, angle: Math.PI,     size: 3, color: "rgba(96,165,250,0.6)",  duration: 8 },
    { radius: 90,  angle: Math.PI * 1.5, size: 2, color: "rgba(139,92,246,0.9)", duration: 4.5 },
    { radius: 160, angle: Math.PI * 0.7, size: 2, color: "rgba(59,130,246,0.5)", duration: 10 },
  ]

  const loadingPhrases = [
    "Kalibrasyonlar yapılıyor...",
    "Görevler derleniyor...",
    "Odak modu hazırlanıyor...",
    "Neredeyse hazır...",
    "Hoş geldin!",
  ]

  const phraseIndex = Math.min(Math.floor(progress / 20), loadingPhrases.length - 1)

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.08,
            filter: "blur(20px)",
            transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: "#030307" }}
        >
          {/* ── Deep space background ── */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Main radial glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, rgba(99,102,241,0.05) 40%, transparent 70%)" }}
            />
            {/* Top-left blue leak */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1.2 }}
              className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)" }}
            />
            {/* Bottom-right purple leak */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.4 }}
              className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }}
            />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.018]"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "60px 60px"
              }}
            />

            {/* Noise texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
              }}
            />
          </div>

          {/* ── Floating star particles (only rendered client-side) ── */}
          {isMounted && STARS.map((s, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full bg-white"
              style={{ width: s.w, height: s.h, top: s.top, left: s.left }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, s.w * 0.22, 0] }}
              transition={{
                duration: s.dur,
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}

          {/* ── Main content ── */}
          <div className="relative flex flex-col items-center">

            {/* ── Logo with orbital ring ── */}
            <div className="relative flex items-center justify-center mb-10" style={{ width: 200, height: 200 }}>
              {/* Outer ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 rounded-full"
                style={{
                  border: "1px solid rgba(99,102,241,0.15)",
                  boxShadow: "0 0 60px rgba(99,102,241,0.08), inset 0 0 60px rgba(99,102,241,0.04)"
                }}
              />
              {/* Inner ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute rounded-full"
                style={{
                  inset: "20px",
                  border: "1px solid rgba(59,130,246,0.12)",
                }}
              />

              {/* Slow rotating dashed ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute rounded-full"
                style={{
                  inset: "12px",
                  border: "1px dashed rgba(99,102,241,0.12)",
                }}
              />

              {/* Orbiting particles */}
              {particles.map((p, i) => <Particle key={i} {...p} />)}

              {/* Arc glow sweep */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full overflow-hidden"
              >
                <div style={{
                  position: "absolute", top: 0, left: "50%",
                  width: "50%", height: "50%",
                  background: "conic-gradient(from 0deg, rgba(99,102,241,0.3) 0deg, transparent 60deg)",
                  transformOrigin: "0% 100%",
                  borderRadius: "0 100% 0 0",
                }} />
              </motion.div>

              {/* Logo box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10"
              >
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-[72px] h-[72px] rounded-[22px] flex items-center justify-center overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #131320, #0c0c18)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(99,102,241,0.2), inset 0 1px 1px rgba(255,255,255,0.08)"
                  }}
                >
                  {/* Logo inner glow */}
                  <div className="absolute inset-0 rounded-[22px]"
                    style={{ background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.15) 0%, transparent 60%)" }} />

                  <Image src="/logo.png" alt="FocusFlow" width={44} height={44} className="relative z-10 object-contain" priority />

                  {/* Shine sweep */}
                  <motion.div
                    initial={{ left: "-100%" }}
                    animate={{ left: "150%" }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
                    className="absolute top-0 w-1/2 h-full skew-x-12"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* ── App name & tagline ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-2 mb-10"
            >
              <h1 className="text-[28px] font-black tracking-[-0.03em] text-white leading-none"
                style={{ textShadow: "0 0 40px rgba(99,102,241,0.3)" }}>
                FocusFlow
              </h1>
              <p className="text-[12px] uppercase tracking-[0.35em] font-semibold"
                style={{ color: "rgba(99,102,241,0.7)" }}>
                Akıllı Görev Yönetimi
              </p>
            </motion.div>

            {/* ── Progress bar ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col items-center gap-3 w-[240px]"
            >
              {/* Track */}
              <div className="relative w-full h-[2px] rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                {/* Glow bar */}
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, rgba(59,130,246,0.8), rgba(99,102,241,1), rgba(167,139,250,0.9))",
                    boxShadow: "0 0 12px rgba(99,102,241,0.8), 0 0 4px rgba(167,139,250,0.6)"
                  }}
                />
                {/* Shine runner */}
                <motion.div
                  animate={{ left: ["-30%", "130%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 w-[30%] h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
                />
              </div>

              {/* Status row */}
              <div className="flex items-center justify-between w-full">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={phraseIndex}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.3 }}
                    className="text-[11px] font-medium"
                    style={{ color: "rgba(148,163,184,0.7)" }}
                  >
                    {loadingPhrases[phraseIndex]}
                  </motion.span>
                </AnimatePresence>
                <span className="text-[11px] font-black tabular-nums"
                  style={{ color: "rgba(99,102,241,0.8)" }}>
                  <Counter to={progress} duration={0.5} delay={0} />%
                </span>
              </div>
            </motion.div>

            {/* ── Bottom version label ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="absolute -bottom-16 text-[10px] font-medium tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.1)" }}
            >
              v0.1.0 · Desktop
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
