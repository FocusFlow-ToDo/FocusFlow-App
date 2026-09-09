/* ═══════════════════════════════════════════════════════════
   FocusFlow Design Tokens
   Tüm sayfalarda tutarlılık sağlamak için tek kaynak.
   ═══════════════════════════════════════════════════════════ */

/* ── Priority System ── */
export const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export interface PriorityConfig {
  label: string
  color: string
  bg: string
  border: string
  dot: string
}

export const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
  urgent: {
    label: "Acil",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
  high: {
    label: "Yüksek",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Orta",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
  low: {
    label: "Düşük",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
}

/* ── Animation ── */
export const EASING = {
  apple: [0.32, 0.72, 0, 1] as const,
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  springBouncy: { type: "spring" as const, stiffness: 350, damping: 25 },
}

/* ── Motion Defaults ── */
export const MOTION = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  fadeScale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  slideUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
}
