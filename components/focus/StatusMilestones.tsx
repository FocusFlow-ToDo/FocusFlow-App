"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, AlertCircle, CheckCircle2, Trophy, Flame, ChevronUp, ChevronDown, Star, Coins, Info, X, Zap, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/useTasks"
import { useSettings } from "@/hooks/useSettings"
import { startOfDay, isBefore, isSameDay, startOfWeek, endOfWeek } from "date-fns"
import { AchievementModal, AchievementData } from "./AchievementModal"
import { BADGES } from "@/lib/badges"
import { calculateUserStats } from "@/lib/stats"

export function StatusMilestones() {
  const { tasks } = useTasks()
  const { settings, updateSettings } = useSettings()
  
  const [celebrationBadge, setCelebrationBadge] = React.useState<AchievementData | null>(null)
  const [showEconomyInfo, setShowEconomyInfo] = React.useState(false)
  const isFirstCheckRef = React.useRef(true)

  React.useEffect(() => {
    if (tasks.length === 0 && isFirstCheckRef.current) return

    const stats = calculateUserStats(tasks)
    
    // Map stats to badge definitions
    const checks = BADGES.map(b => {
      let currentVal = 0
      if (b.category === "tasks") currentVal = stats.completedTotal
      else if (b.category === "streak") currentVal = settings.streakCount || stats.currentStreak
      else if (b.category === "focus") currentVal = stats.focusMinsTotal
      else if (b.category === "subtasks") currentVal = stats.subtasksTotal
      else if (b.id === "early_bird" || b.id === "early_master") currentVal = stats.earlyBirdTasks
      else if (b.id === "night_owl" || b.id === "night_hunter") currentVal = stats.nightOwlTasks
      else if (b.id === "noon_hunter") currentVal = stats.noonTasks || 0
      else if (b.id === "marathon_runner") currentVal = stats.hasMarathonDay ? 1 : 0
      else if (b.category === "economy") currentVal = settings.focusCoins || 0
      else if (b.category === "shop") currentVal = settings.inventory?.length || 0
      else if (b.category === "social") currentVal = settings.friends?.length || 0
      else currentVal = stats.completedTotal

      return {
        id: b.id,
        name: b.name,
        target: b.target,
        current: currentVal,
        suffix: b.label,
        desc: b.desc,
        color: b.color,
        rewardCoins: b.rewardCoins
      }
    })

    try {
      const localStored: string[] = JSON.parse(localStorage.getItem("FF_UNLOCKED_BADGES") || "[]")
      const earnedSet = new Set([...(settings.earnedBadges || []), ...localStored])

      let newlyUnlocked: any = null
      let coinsToAdd = 0

      for (const b of checks) {
        if (b.current >= b.target && !earnedSet.has(b.id) && !earnedSet.has(b.name)) {
          earnedSet.add(b.id)
          earnedSet.add(b.name)
          coinsToAdd += b.rewardCoins || 50
          if (!isFirstCheckRef.current && !newlyUnlocked) {
            newlyUnlocked = b
          }
        }
      }

      const updatedList = Array.from(earnedSet)
      localStorage.setItem("FF_UNLOCKED_BADGES", JSON.stringify(updatedList))

      if (coinsToAdd > 0 || updatedList.length !== (settings.earnedBadges || []).length) {
        updateSettings({
          earnedBadges: updatedList,
          focusCoins: (settings.focusCoins || 100) + coinsToAdd
        })
      }

      // ONLY celebrate if this happened AFTER initial boot/mount (user completed a task during active session)
      if (newlyUnlocked && !isFirstCheckRef.current) {
        setTimeout(() => setCelebrationBadge(newlyUnlocked as any), 500)
      }
    } catch(e) {}

    isFirstCheckRef.current = false
  }, [tasks, settings.earnedBadges, settings.streakCount, settings.focusCoins, settings.inventory, settings.friends, updateSettings])
  
  const today = startOfDay(new Date())
  const todayTime = today.getTime()
  
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekStartTime = weekStart.getTime()
  
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const weekEndTime = weekEnd.getTime()

  const toDate = (val: any): Date | null => {
    if (!val) return null; if (val instanceof Date) return val; if (val?.toDate) return val.toDate()
    if (typeof val === "string" || typeof val === "number") return new Date(val); return null
  }

  const overdueCount = tasks.filter(t => t.status !== "done" && t.status !== "trash" && t.dueDate && isBefore(startOfDay(new Date(t.dueDate)), today)).length

  const { todayStats, weekStats, gameStats } = React.useMemo(() => {
    let tTotal = 0, tDone = 0;
    let wTotal = 0, wDone = 0;
    
    let completedMain = 0;
    let completedSub = 0;
    let focusMins = 0;

    tasks.forEach(t => {
      if (t.status === "trash") return;

      // Gamification XP Tracking
      const hasSubtasks = t.subtasks && t.subtasks.length > 0;
      if (hasSubtasks) {
        completedSub += t.subtasks!.filter(s => s.completed).length;
      } else if (t.status === "done") {
        completedMain++;
      }
      const timeSpent = (t as any).focusTime || (t as any).timeSpent || 0;
      focusMins += Math.floor(timeSpent / 60);

      // Date Tracking
      let isToday = false;
      let isWeek = false;

      const dueDateMs = t.dueDate ? startOfDay(new Date(t.dueDate)).getTime() : null;
      const completedMs = toDate(t.completedAt)?.getTime() || null;

      if (t.status === "done") {
        if (completedMs) {
          if (completedMs >= todayTime && completedMs < todayTime + 86400000) isToday = true;
          if (completedMs >= weekStartTime && completedMs <= weekEndTime + 86400000) isWeek = true;
        }
      } else {
        if (dueDateMs !== null) {
          if (dueDateMs <= todayTime) isToday = true;
          if (dueDateMs >= weekStartTime && dueDateMs <= weekEndTime) isWeek = true;
          if (dueDateMs < weekStartTime) isWeek = true; // Overdue tasks count into week's burden
        }
      }

      const count = hasSubtasks ? t.subtasks!.length : 1;
      const doneCount = hasSubtasks ? t.subtasks!.filter(s => s.completed).length : (t.status === "done" ? 1 : 0);

      if (isToday) { tTotal += count; tDone += doneCount; }
      if (isWeek) { wTotal += count; wDone += doneCount; }
    });

    const totalXP = (completedMain * 50) + (completedSub * 10) + (focusMins * 5);
    let level = 1;
    const getXpForLevel = (l: number) => Math.floor(100 * Math.pow(l, 1.5));
    while (totalXP >= getXpForLevel(level)) { level++; }
    
    const currentLevelXP = getXpForLevel(level - 1);
    const requiredForCurrentLevel = getXpForLevel(level) - currentLevelXP;
    const progressInCurrentLevel = totalXP - currentLevelXP;
    const levelPercentage = requiredForCurrentLevel > 0 ? (progressInCurrentLevel / requiredForCurrentLevel) * 100 : 0;
    
    // Proximity to Nearest Badge Logic
    let upcomingBadge = null;
    const completedTotal = completedMain + completedSub;
    const badgeChecks = [
      { name: "İlk Kan", target: 1, current: completedTotal, suffix: "görev", rewardCoins: 50 },
      { name: "Isınan Motorlar", target: 10, current: completedTotal, suffix: "görev", rewardCoins: 100 },
      { name: "Acemi Savaşçı", target: 20, current: completedTotal, suffix: "görev", rewardCoins: 150 },
      { name: "Deneyimli Çırak", target: 50, current: completedTotal, suffix: "görev", rewardCoins: 250 },
      { name: "Yüzbaşı", target: 100, current: completedTotal, suffix: "görev", rewardCoins: 400 },
      { name: "Usta Savaşçı", target: 250, current: completedTotal, suffix: "görev", rewardCoins: 600 },
      { name: "Zamanın Efendisi", target: 500, current: completedTotal, suffix: "görev", rewardCoins: 1000 },
      { name: "Efsanevi Titan", target: 1000, current: completedTotal, suffix: "görev", rewardCoins: 2000 },

      { name: "Ufak Konsantrasyon", target: 30, current: focusMins, suffix: "dk", rewardCoins: 50 },
      { name: "Zihin Dalışı", target: 300, current: focusMins, suffix: "dk", rewardCoins: 200 },
      { name: "Derin Odak", target: 1000, current: focusMins, suffix: "dk", rewardCoins: 500 },
      { name: "Zen Ustası", target: 3000, current: focusMins, suffix: "dk", rewardCoins: 1200 },

      { name: "Parçalama Sanatı", target: 10, current: completedSub, suffix: "alt görev", rewardCoins: 50 },
      { name: "Bölen ve Yöneten", target: 50, current: completedSub, suffix: "alt görev", rewardCoins: 150 },
      { name: "Detaycı", target: 100, current: completedSub, suffix: "alt görev", rewardCoins: 300 },
      { name: "Mikro Yönetici", target: 500, current: completedSub, suffix: "alt görev", rewardCoins: 1200 }
    ];

    for (const b of badgeChecks) {
      if (b.current < b.target) {
        const remaining = b.target - b.current;
        let threshold = 3; 

        // Tightly control proximity for 'hype' creation
        if (b.suffix === "dk") {
           threshold = Math.max(15, Math.ceil(b.target * 0.10));
        } else {
           threshold = Math.min(10, Math.max(3, Math.ceil(b.target * 0.05)));
        }

        if (remaining <= threshold) {
           let urgency = 3;
           if (b.suffix === "dk") {
              if (remaining <= 5) urgency = 1;
              else if (remaining <= 10) urgency = 2;
           } else {
              if (remaining === 1) urgency = 1;
              else if (remaining === 2) urgency = 2;
           }

           let hypeMessage = "";
           if (urgency === 1) {
             hypeMessage = `Son ${remaining} adım, dayan! 🔥`;
           } else if (urgency === 2) {
             hypeMessage = `Sadece ${remaining} ${b.suffix} kaldı! 🚀`;
           } else {
             hypeMessage = `${remaining} ${b.suffix} sonra başarım açılacak! ⚡`;
           }

           upcomingBadge = { 
               name: b.name, 
               desc: hypeMessage, 
               target: b.target, 
               current: b.current, 
               remaining: remaining, 
               suffix: b.suffix,
               urgency,
               rewardCoins: b.rewardCoins
           };
           break;
        }
      }
    }
    
    return {
      todayStats: { total: tTotal, done: tDone, pct: tTotal > 0 ? (tDone / tTotal) * 100 : 0 },
      weekStats: { total: wTotal, done: wDone, pct: wTotal > 0 ? (wDone / wTotal) * 100 : 0 },
      gameStats: { level, xpNeeded: getXpForLevel(level) - totalXP, totalXP, levelPercentage, upcomingBadge }
    }
  }, [tasks, todayTime, weekStartTime, weekEndTime])

  const { total: totalToday, done: todayCompleted, pct: todayProgress } = todayStats
  const { total: totalWeek, done: weekCompleted, pct: weekProgress } = weekStats

  const activeTodayCount = totalToday - todayCompleted
  const isTodayAllDone = activeTodayCount === 0 && totalToday > 0

  const activeWeekCount = totalWeek - weekCompleted
  const isWeekAllDone = activeWeekCount === 0 && totalWeek > 0

  const isOverdue = overdueCount > 0

  // State priority: Overdue -> Today's Progress -> Week's Progress -> All Done
  let displayMode = "hidden";
  if (isOverdue) displayMode = "overdue";
  else if (totalToday > 0 && !isTodayAllDone) displayMode = "today";
  else if (totalWeek > 0 && !isWeekAllDone) displayMode = "week";
  else if (isWeekAllDone || isTodayAllDone) displayMode = "all-done";

  if (displayMode === "hidden" || !settings.statusMilestonesEnabled) return null

  // Calculate potential coins for today
  const todayRemaining = totalToday - todayCompleted
  const potentialCoins = todayRemaining * 10
  const currentBalance = settings.focusCoins ?? 100

  // Progress values based on display mode
  const currentProgress = displayMode === "week" ? weekProgress : todayProgress
  const currentDone = displayMode === "week" ? weekCompleted : todayCompleted
  const currentTotal = displayMode === "week" ? totalWeek : totalToday

  return (
    <div className="w-full mb-4 relative group">
      <AnimatePresence mode="wait">
        {settings.statusMilestonesMinimized ? (
          <motion.div
            key="minimized"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="w-full flex justify-end px-1"
          >
            <button
              onClick={() => updateSettings({ statusMilestonesMinimized: false })}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-1.5 rounded-full border shadow-lg transition-all active:scale-95 cursor-pointer",
                displayMode === "all-done" ? "glass-card !border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
                displayMode === "overdue" ? "glass-card !border-rose-500/20 bg-rose-500/10 text-rose-400" :
                "glass-card bg-white/[0.04] text-zinc-400"
              )}
            >
              {displayMode === "all-done" ? <Trophy className="w-3.5 h-3.5" /> : 
               displayMode === "overdue" ? <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> : 
               <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
              
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {displayMode === "all-done" ? "HARİKA!" : displayMode === "overdue" ? "GECİKMİŞ" : `%${Math.round(currentProgress)}`}
              </span>
              
              {displayMode !== "all-done" && displayMode !== "overdue" && (
                <span className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-purple-500/20 whitespace-nowrap flex items-center gap-1">
                  SV. {gameStats.level}
                </span>
              )}

              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400/80">
                <Coins className="w-3 h-3" />
                {currentBalance.toLocaleString()}
              </span>
              
              <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            </button>
          </motion.div>
        ) : displayMode === "all-done" ? (
          <motion.div
            key="all-done"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="glass-card !border-emerald-500/15 bg-emerald-500/[0.03] p-4 rounded-2xl shadow-lg shadow-emerald-500/5 relative overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[60px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            
            <button 
              onClick={() => updateSettings({ statusMilestonesMinimized: true })} 
              className="absolute top-3 right-3 p-1 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.05] transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-emerald-400 font-black tracking-tight text-sm uppercase">
                  {isWeekAllDone ? "HAFTANIN KAHRAMANI!" : "GÜNÜN KAHRAMANI!"}
                </h3>
                <p className="text-zinc-500 text-xs font-medium mt-0.5">
                  {isWeekAllDone ? "Bu haftanın tüm hedeflerini tamamladın!" : "Günün tüm hedeflerini tamamladın!"}
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-emerald-500/40" />
            </div>
          </motion.div>
        ) : displayMode === "overdue" ? (
          <motion.div
            key="overdue"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="glass-card !border-rose-500/15 bg-rose-500/[0.03] p-4 rounded-2xl shadow-lg shadow-rose-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 blur-[60px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            
            <button 
              onClick={() => updateSettings({ statusMilestonesMinimized: true })} 
              className="absolute top-3 right-3 p-1 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.05] transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400 border border-rose-500/20">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-rose-400 font-black tracking-tight text-sm uppercase">GECİKMİŞ GÖREVLER</h3>
                <p className="text-zinc-500 text-xs font-medium mt-0.5">
                  Tamamlanması gereken <span className="text-rose-400 font-bold">{overdueCount}</span> gecikmiş görev var.
                </p>
              </div>
              <Flame className="w-5 h-5 text-rose-500/40 animate-pulse" />
            </div>
          </motion.div>
        ) : (displayMode === "today" || displayMode === "week") ? (
          /* ═══════════════════════════════════════════════════════════════
             UNIFIED PROGRESS CARD — Single card with everything
             ═══════════════════════════════════════════════════════════════ */
          <motion.div
            key={`unified-${displayMode}`}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className={cn(
              "rounded-2xl relative group/card overflow-hidden transition-colors duration-500",
              (displayMode === "week" && isTodayAllDone)
                ? "glass-card !border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.08)]"
                : "glass-card"
            )}
          >
            <button 
              onClick={() => updateSettings({ statusMilestonesMinimized: true })} 
              className="absolute top-3 right-3 p-1 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.05] transition-all opacity-0 group-hover/card:opacity-100 z-20"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* ── Main Content: Two-column layout ── */}
            <div className="flex">
              {/* LEFT COLUMN: Progress info */}
              <div className="flex-1 p-4 pr-3">
                {/* Header row */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center border",
                    displayMode === "week" 
                      ? (isTodayAllDone ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20") 
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-zinc-200 font-black tracking-widest text-[11px] uppercase">
                        {displayMode === "week" ? "HAFTALIK İLERLEME" : "GÜNLÜK İLERLEME"}
                      </h3>
                      {displayMode === "week" && isTodayAllDone && (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border border-emerald-500/20">
                          BUGÜN ✅
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mt-0.5">
                      {currentDone}/{currentTotal} GÖREV
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative w-full h-2 bg-white/[0.04] rounded-full border border-white/[0.03] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${currentProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      currentProgress === 100 
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : displayMode === "week"
                          ? "bg-gradient-to-r from-purple-500 to-indigo-400 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                          : "bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                    )}
                  />
                </div>

                {/* Below bar: Level + XP */}
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest">SV. {gameStats.level}</span>
                  </div>
                  
                  <div className="relative flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${gameStats.levelPercentage}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                    />
                  </div>
                  
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase whitespace-nowrap">
                    {gameStats.xpNeeded} XP
                  </span>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="w-px bg-white/[0.06] my-3" />

              {/* RIGHT COLUMN: Economy & Rewards */}
              <div className="w-[180px] p-4 pl-3 flex flex-col justify-between">
                {/* Percentage display */}
                <div className="text-right mb-2">
                  <span className={cn(
                    "text-3xl font-black tabular-nums leading-none tracking-tight",
                    displayMode === "week" 
                      ? (isTodayAllDone ? "text-emerald-400" : "text-purple-400")
                      : "text-blue-400"
                  )}>
                    %{Math.round(currentProgress)}
                  </span>
                </div>

                {/* Coin rewards info */}
                <div className="space-y-1.5">
                  {/* Per task reward */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600 font-medium">1 Görev</span>
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      🪙 +10 <span className="text-emerald-400">+50 XP</span>
                    </span>
                  </div>

                  {/* Today's potential earnings */}
                  {potentialCoins > 0 && (
                    <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <span className="text-[10px] text-amber-400/70 font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Kazanılabilir
                      </span>
                      <span className="text-[11px] font-black text-amber-400">🪙 +{potentialCoins}</span>
                    </div>
                  )}

                  {/* Balance + info button */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setShowEconomyInfo(true)}
                      className="text-[10px] text-zinc-600 hover:text-amber-400 font-medium flex items-center gap-1 transition-colors"
                      title="Ekonomi Rehberi"
                    >
                      <Info className="w-3 h-3" /> Bakiye
                    </button>
                    <span className="text-[12px] font-black text-amber-400 tabular-nums flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {currentBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Upcoming Badge (Integrated as bottom section) ── */}
            <AnimatePresence>
              {gameStats.upcomingBadge && (() => {
                const badge = gameStats.upcomingBadge;
                const badgePct = Math.floor((badge.current / badge.target) * 100);
                const urg = badge.urgency || 3;
                
                const colors = urg === 1 ? {
                  accent: "text-rose-400", bg: "bg-rose-500/5", border: "border-rose-500/15",
                  bar: "from-rose-500 to-red-400", tag: "bg-rose-500/15 text-rose-400 border-rose-500/25",
                  glow: "shadow-[inset_0_1px_0_rgba(225,29,72,0.1)]"
                } : urg === 2 ? {
                  accent: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/15",
                  bar: "from-amber-500 to-yellow-400", tag: "bg-amber-500/15 text-amber-400 border-amber-500/25",
                  glow: "shadow-[inset_0_1px_0_rgba(245,158,11,0.1)]"
                } : {
                  accent: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/15",
                  bar: "from-blue-500 to-indigo-400", tag: "bg-blue-500/15 text-blue-400 border-blue-500/25",
                  glow: ""
                };

                return (
                  <motion.div
                    key="badge-section"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn("border-t border-white/[0.05]", colors.glow)}
                  >
                    <div className={cn("px-4 py-3 flex items-center gap-3", colors.bg)}>
                      {/* Trophy */}
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.06] flex-shrink-0">
                        <Trophy className={cn("w-4 h-4", colors.accent)} />
                      </div>

                      {/* Badge info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border flex-shrink-0", colors.tag, urg === 1 ? "animate-pulse" : "")}>
                            {badge.remaining} KALDI
                          </span>
                          <span className={cn("text-[12px] font-black tracking-wide truncate", colors.accent)}>
                            "{badge.name}"
                          </span>
                          <span className="text-zinc-600 text-[10px]">·</span>
                          <span className="text-[10px] font-medium text-zinc-500 truncate">{badge.desc}</span>
                        </div>
                        
                        {/* Mini progress */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-black/30 rounded-full overflow-hidden">
                            <motion.div 
                              className={cn("h-full rounded-full bg-gradient-to-r", colors.bar)}
                              initial={{ width: 0 }}
                              animate={{ width: `${badgePct}%` }}
                              transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                            />
                          </div>
                          <span className={cn("text-[10px] font-black tabular-nums", colors.accent)}>%{badgePct}</span>
                        </div>
                      </div>

                      {/* Reward */}
                      <div className="flex-shrink-0 pl-2 text-right">
                        <div className="text-[10px] text-zinc-600 font-medium">Ödül</div>
                        <div className="text-[12px] font-black text-amber-400 flex items-center gap-0.5">
                          🪙 +{badge.rewardCoins || 50}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      <AchievementModal 
         badge={celebrationBadge} 
         onClose={() => setCelebrationBadge(null)} 
      />

      {/* ═══ Economy Guide Modal ═══ */}
      {showEconomyInfo && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowEconomyInfo(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            onClick={e => e.stopPropagation()}
            className="w-[400px] max-h-[80vh] glass-card !border-amber-500/15 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 flex items-center justify-center border border-amber-500/20">
                  <Coins className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-zinc-100 tracking-tight">Ekonomi & Kazanç Rehberi</h2>
                  <p className="text-[11px] text-zinc-500 font-medium">Focus Para nasıl kazanılır & harcanır</p>
                </div>
              </div>
              <button onClick={() => setShowEconomyInfo(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {/* Current Balance */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-600/5 border border-amber-500/15">
                <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">Mevcut Bakiye</span>
                <span className="text-xl font-black text-amber-400 tabular-nums flex items-center gap-1.5">
                  🪙 {currentBalance.toLocaleString()}
                </span>
              </div>

              {/* Earning Sources */}
              <div>
                <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Kazanç Kaynakları
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Görev Tamamlama", amount: "+10", icon: "✅", desc: "Her tamamlanan görev" },
                    { label: "Alt Görev", amount: "+2", icon: "📋", desc: "Her tamamlanan alt görev" },
                    { label: "25dk Odak Süresi", amount: "+15", icon: "🎯", desc: "Her 25 dakikalık odak oturumu" },
                    { label: "Başarım Ödülleri", amount: "+50 ~ +25.000", icon: "🏆", desc: "Başarım açıldığında (zorluk seviyesine göre)" },
                    { label: "Seri Bonusu", amount: "+60 ~ +25.000", icon: "🔥", desc: "Günlük seri milestone'larında" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                      <span className="text-base leading-none">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-zinc-300 block">{item.label}</span>
                        <span className="text-[9px] text-zinc-600 font-medium">{item.desc}</span>
                      </div>
                      <span className="text-[11px] font-black text-amber-400 whitespace-nowrap">🪙 {item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spending */}
              <div>
                <h3 className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> Harcama Alanları
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Mağaza Ürünleri", desc: "Çerçeve, unvan, profil efektleri", icon: "🛒" },
                    { label: "Kasa Açma", desc: "CS2 tarzı kasa açma (150 Para)", icon: "📦" },
                    { label: "Seri Dondurma", desc: "Günlük seriyi korumak için", icon: "🧊" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-base leading-none">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-zinc-300 block">{item.label}</span>
                        <span className="text-[9px] text-zinc-600 font-medium">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-blue-300/70 font-medium leading-relaxed">
                  Focus Para, görevlerini tamamlayarak, odak süresi harcayarak ve başarım açarak kazanılır. 
                  Mağazadan özel kozmetik ürünler satın almak için kullanabilirsin!
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </div>
  )
}
