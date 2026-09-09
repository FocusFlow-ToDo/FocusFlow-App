"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Search, Bell, Command } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"
import { motion, AnimatePresence } from "motion/react"
import { useNotifications, NotificationType } from "@/contexts/NotificationContext"
import { Check, X, Trash2, AlertTriangle, Info, CheckCircle2, RotateCcw, Flame, Coins, Snowflake } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { StreakFreezeModal } from "@/components/focus/StreakFreezeModal"

const PAGE_TITLES: Record<string, string> = {
  "/": "Focus",
  "/planner": "Planlayıcı",
  "/tasks": "Görevler",
  "/projects": "Projelerim",
  "/shop": "Mağaza",
  "/profile": "Profilim",
  "/achievements": "Başarımlar",
  "/community": "Topluluk",
  "/analytics": "Analizler",
  "/archive": "Arşiv",
  "/settings": "Ayarlar",
}

const FRAME_STYLES: Record<string, string> = {
  frame_neon: "ring-2 ring-cyan-400 border-fuchsia-500 shadow-[0_0_12px_rgba(34,211,238,0.7)]",
  frame_gold: "ring-2 ring-amber-400 border-yellow-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]",
  frame_flame: "ring-2 ring-orange-500 border-red-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]",
  frame_amethyst: "ring-2 ring-purple-500 border-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.7)]",
  frame_emerald: "ring-2 ring-emerald-400 border-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
}

interface TopBarProps {
  onSearchClick?: () => void
}

export function TopBar({ onSearchClick }: TopBarProps) {
  const { settings } = useSettings()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications()
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [streakModalOpen, setStreakModalOpen] = React.useState(false)
  const notifRef = React.useRef<HTMLDivElement>(null)

  const title = PAGE_TITLES[pathname] || "FocusFlow"
  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"

  React.useEffect(() => {
    if (!notifOpen) return
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [notifOpen])

  const today = new Date().toISOString().split("T")[0]
  const streakCount = settings.streakCount || 0
  const isFrozenToday = settings.lastFrozenDate === today
  const isStreakActive = (settings.lastActionDate === today || isFrozenToday) && streakCount > 0
  
  return (
    <header
      className={cn(
        "h-[56px] flex items-center justify-between px-6",
        "border-b border-white/[0.015]",
        "backdrop-blur-3xl sticky top-0 bg-white/[0.015]",
        "flex-shrink-0 z-30",
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-[14px] font-extrabold uppercase tracking-[0.2em] text-zinc-100 select-none bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Global Streak Button */}
        <button
          type="button"
          onClick={() => setStreakModalOpen(true)}
          className="relative group/streak mr-1 flex items-center justify-center focus:outline-none"
        >
          <div className={cn(
            "streak-badge flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-500 relative overflow-hidden cursor-pointer active:scale-95",
            isFrozenToday
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              : isStreakActive 
              ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
              : "bg-zinc-500/5 border-white/[0.05] text-zinc-500 hover:bg-white/[0.04]"
          )}>
            {/* Sweep background glow */}
            {(isStreakActive || isFrozenToday) && (
               <div className="streak-sweep absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 z-0" />
            )}
            
            <div className={cn("streak-flame relative z-10", (isStreakActive || isFrozenToday) && "streak-flame-active")}>
              {isFrozenToday ? (
                <Snowflake className="w-4 h-4 text-cyan-400 fill-cyan-400/20 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              ) : (
                <Flame className={cn("w-4 h-4", isStreakActive ? "fill-amber-500 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "")} />
              )}
            </div>
            
            {(isStreakActive || isFrozenToday) && (
              <span className="text-[13px] font-black tabular-nums pr-0.5 relative z-10 flex items-center">
                 <span className={cn("drop-shadow-md", isFrozenToday ? "text-cyan-300" : "text-amber-400")}>
                   {streakCount}
                 </span>
              </span>
            )}
            
            {!isStreakActive && !isFrozenToday && (
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0a0a0f] shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
            )}
            
            {/* Floating Sparks */}
            {(isStreakActive || isFrozenToday) && (
               <div className="streak-sparks absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-xl">
                  <div className={cn("streak-spark-1 absolute bottom-0 left-2 w-1.5 h-1.5 rounded-full blur-[1px]", isFrozenToday ? "bg-cyan-300" : "bg-amber-400")} />
                  <div className={cn("streak-spark-2 absolute bottom-0 left-5 w-1 h-1 rounded-full blur-[0.5px]", isFrozenToday ? "bg-sky-200" : "bg-yellow-300")} />
                  <div className={cn("streak-spark-3 absolute bottom-0 right-2 w-1.5 h-1.5 rounded-full blur-[1px]", isFrozenToday ? "bg-blue-400" : "bg-orange-500")} />
               </div>
            )}
          </div>
          
          <div className="absolute top-full mt-2 right-0 w-max max-w-[220px] pointer-events-none opacity-0 group-hover/streak:opacity-100 transition-opacity z-50">
            <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-xs text-zinc-300 text-center">
              {isFrozenToday
                ? "❄️ Serin bugün dondurma koruması altında! (Tıkla)"
                : isStreakActive 
                ? "🔥 Harika! Bugünün serisi güvende. (Tıkla)" 
                : "⚠️ Serini kaybetmek üzeresin! Görev yap veya dondur. (Tıkla)"}
            </div>
          </div>
        </button>

        {/* Focus Coins Pill */}
        <Link
          href="/shop"
          title="Focus Para Mağazası"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.1)]"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{(settings.focusCoins ?? 100).toLocaleString()}</span>
        </Link>

        {/* Streak Freezes Pill Button */}
        <button
          type="button"
          onClick={() => setStreakModalOpen(true)}
          title={`${settings.streakFreezes ?? 3} Seri Dondurma Hakkı (Yönetmek için tıkla)`}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.1)] hover:border-cyan-500/50"
        >
          <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
          <span>{settings.streakFreezes ?? 3}</span>
        </button>

        {/* Search */}
        <button
          onClick={onSearchClick}
          className={cn(
            "flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-xl transition-all duration-300",
            "bg-white/[0.04] border border-white/[0.05] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.07] hover:border-white/[0.1]",
            "text-[13px] group/search",
          )}
        >
          <Search className="w-4 h-4 group-hover/search:scale-110 transition-transform" />
          <span className="hidden sm:inline text-zinc-600 group-hover/search:text-zinc-400">Ara...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 ml-2 text-[9px] text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded-lg font-mono border border-white/[0.04] shadow-inner font-extrabold uppercase">
            <span>Ctrl</span>
            <span>+</span>
            <span>K</span>
          </kbd>
        </button>

        {/* Notifications */}
        {settings.features.notifications && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={cn(
                "p-2.5 rounded-xl transition-all relative",
                "text-zinc-500 hover:text-zinc-100 bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.07] hover:border-white/[0.1]",
                notifOpen && "bg-white/[0.08] text-white border-white/[0.2]",
              )}
            >
              <Bell className={cn("w-4.5 h-4.5", notifOpen && "fill-current")} />
              {/* Notification Dot */}
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0a0a0f] animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute right-0 top-full mt-2 w-80 glass-dropdown rounded-2xl overflow-hidden z-50 border border-white/[0.1] shadow-2xl"
                >
                  <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                    <h4 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Bildirimler</h4>
                    <div className="flex items-center gap-1">
                       <button onClick={markAllAsRead} title="Hepsini okundu yap" className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-600 hover:text-zinc-300 transition-colors">
                          <Check className="w-3.5 h-3.5" />
                       </button>
                       <button onClick={clearAll} title="Hepsini temizle" className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-600 hover:text-zinc-300 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4 border border-white/[0.05]">
                          <Bell className="w-6 h-6 text-zinc-700" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-400">Her şey yolunda</p>
                        <p className="text-[11px] text-zinc-600 mt-1 max-w-[180px]">Yeni bir bildirim olduğunda burada görebilirsin.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                         {notifications.map((n) => (
                           <div 
                              key={n.id} 
                              onClick={() => markAsRead(n.id)}
                              className={cn(
                                "p-4 flex gap-3.5 transition-colors cursor-pointer relative group",
                                n.read ? "opacity-60 bg-transparent" : "bg-white/[0.02] hover:bg-white/[0.04]"
                              )}
                           >
                              <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border",
                                n.type === "warning" || n.type === "trash" ? "bg-amber-500/10 border-amber-500/10 text-amber-500" :
                                n.type === "success" ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-500" :
                                "bg-blue-500/10 border-blue-500/10 text-blue-500"
                              )}>
                                {n.type === "trash" ? <Trash2 className="w-4.5 h-4.5" /> : 
                                 n.type === "warning" ? <AlertTriangle className="w-4.5 h-4.5" /> : 
                                 n.type === "success" ? <CheckCircle2 className="w-4.5 h-4.5" /> : 
                                 <Bell className="w-4.5 h-4.5" />}
                              </div>
                              <div className="flex-1 min-w-0 pr-2">
                                <p className={cn(
                                  "text-[13px] font-bold leading-tight",
                                  n.read ? "text-zinc-500 line-through decoration-zinc-700" : "text-zinc-100"
                                )}>
                                  {n.title}
                                </p>
                                <p className={cn(
                                   "text-[11px] mt-1 line-clamp-2 leading-relaxed",
                                   n.read ? "text-zinc-600 line-through decoration-zinc-800" : "text-zinc-500"
                                )}>
                                   {n.message}
                                </p>
                                <p className="text-[10px] text-zinc-700 mt-1.5 font-medium tabular-nums lowercase italic">
                                   {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: tr })}
                                </p>
                              </div>
                              {!n.read && (
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); clearNotification(n.id) }} 
                                className="absolute right-2 top-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-200"
                              >
                                 <X className="w-3.5 h-3.5" />
                              </button>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Avatar → Profile */}
        <Link href="/profile" className="ml-1" title="Profilim">
          {user?.photoURL ? (
            <div className="relative group">
              <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={user.photoURL}
                alt="Avatar"
                data-no-invert
                className={cn(
                  "w-9 h-9 rounded-xl cursor-pointer border-2 transition-all hover:scale-105 active:scale-95 relative z-10",
                  settings.equippedFrame ? FRAME_STYLES[settings.equippedFrame] || "border-white/[0.08]" : "border-white/[0.08] hover:border-purple-500/50"
                )}
              />
            </div>
          ) : (
            <div
              className={cn(
                "w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center cursor-pointer border hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all hover:scale-105 active:scale-95 shadow-lg",
                settings.equippedFrame ? FRAME_STYLES[settings.equippedFrame] || "border-white/[0.1]" : "border-white/[0.1]"
              )}
            >
              <span className="text-[12px] font-extrabold text-white uppercase">{initial}</span>
            </div>
          )}
        </Link>
      </div>

      <StreakFreezeModal
        open={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
      />
    </header>
  )
}