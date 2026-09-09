"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, AlertCircle, CheckCircle2, Trophy, Flame, ChevronUp, ChevronDown, Star } from "lucide-react"
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
      { name: "İlk Kan", target: 1, current: completedTotal, suffix: "görev" },
      { name: "Isınan Motorlar", target: 10, current: completedTotal, suffix: "görev" },
      { name: "Acemi Savaşçı", target: 20, current: completedTotal, suffix: "görev" },
      { name: "Deneyimli Çırak", target: 50, current: completedTotal, suffix: "görev" },
      { name: "Yüzbaşı", target: 100, current: completedTotal, suffix: "görev" },
      { name: "Usta Savaşçı", target: 250, current: completedTotal, suffix: "görev" },
      { name: "Zamanın Efendisi", target: 500, current: completedTotal, suffix: "görev" },
      { name: "Efsanevi Titan", target: 1000, current: completedTotal, suffix: "görev" },

      { name: "Ufak Konsantrasyon", target: 30, current: focusMins, suffix: "dk" },
      { name: "Zihin Dalışı", target: 300, current: focusMins, suffix: "dk" },
      { name: "Derin Odak", target: 1000, current: focusMins, suffix: "dk" },
      { name: "Zen Ustası", target: 3000, current: focusMins, suffix: "dk" },

      { name: "Parçalama Sanatı", target: 10, current: completedSub, suffix: "alt görev" },
      { name: "Bölen ve Yöneten", target: 50, current: completedSub, suffix: "alt görev" },
      { name: "Detaycı", target: 100, current: completedSub, suffix: "alt görev" },
      { name: "Mikro Yönetici", target: 500, current: completedSub, suffix: "alt görev" }
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
             hypeMessage = `Muazzam! Başarımı açmak için son ${remaining} adım, dayan! 🔥`;
           } else if (urgency === 2) {
             hypeMessage = `İnanılmaz yaklaştın! Sadece ${remaining} ${b.suffix} kaldı! 🚀`;
           } else {
             hypeMessage = `Harika ilerliyorsun. ${remaining} ${b.suffix} sonra başarımı açacaksın! ⚡`;
           }

           upcomingBadge = { 
               name: b.name, 
               desc: hypeMessage, 
               target: b.target, 
               current: b.current, 
               remaining: remaining, 
               suffix: b.suffix,
               urgency 
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

  return (
    <div className="w-full mb-6 relative group">
      <AnimatePresence mode="wait">
        {settings.statusMilestonesMinimized ? (
          <motion.div
            key="minimized"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="w-full flex justify-end px-1"
          >
            <div className="relative flex items-center">
              <button
                onClick={() => updateSettings({ statusMilestonesMinimized: false })}
                className={cn(
                  "group flex items-center gap-2.5 px-3 py-1.5 rounded-full border shadow-lg transition-all active:scale-95 cursor-pointer relative",
                  displayMode === "all-done" ? "glass-card !border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
                  displayMode === "overdue" ? "glass-card !border-rose-500/20 bg-rose-500/10 text-rose-400" :
                  "glass-card bg-white/[0.04] text-zinc-400"
                )}
              >
                {displayMode === "all-done" ? <Trophy className="w-3.5 h-3.5" /> : 
                 displayMode === "overdue" ? <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> : 
                 <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {displayMode === "all-done" ? "HARİKA!" : displayMode === "overdue" ? "GECİKMİŞ" : `%${Math.round(displayMode === "week" ? weekProgress : todayProgress)}`}
                  </span>
                  
                  {displayMode !== "all-done" && displayMode !== "overdue" && (
                     <span className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-purple-500/20 whitespace-nowrap drop-shadow-sm flex items-center gap-1">
                       SV. {gameStats.level}
                     </span>
                  )}
                </span>
                
                <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity ml-1" />
              </button>
            </div>
          </motion.div>
        ) : displayMode === "all-done" ? (
          <motion.div
            key="all-done"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="glass-card !border-emerald-500/15 bg-emerald-500/[0.02] p-3 px-4 rounded-2xl flex items-center gap-3.5 shadow-lg shadow-emerald-500/5 relative"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <Trophy className="w-5 h-5 shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-emerald-400 font-black tracking-tight text-[13px] uppercase">
                {isWeekAllDone ? "HAFTANIN KAHRAMANI!" : "GÜNÜN KAHRAMANI!"}
              </h3>
              <p className="text-zinc-500 text-[11px] font-medium truncate">
                {isWeekAllDone ? "Bu haftanın tüm hedeflerini tamamladın!" : "Günün tüm hedeflerini tamamladın!"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-emerald-500/40" />
              <button 
                onClick={() => updateSettings({ statusMilestonesMinimized: true })} 
                className="p-1 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.05] transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : displayMode === "overdue" ? (
          <motion.div
            key="overdue"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="glass-card !border-rose-500/15 bg-rose-500/[0.02] p-3 px-4 rounded-2xl flex items-center gap-3.5 shadow-lg shadow-rose-500/5 relative"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5 shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-rose-400 font-black tracking-tight text-[13px] uppercase">GECİKMİŞ GÖREVLER</h3>
              <p className="text-zinc-500 text-[11px] font-medium truncate">Tamamlanması gereken <span className="text-rose-400 font-bold">{overdueCount}</span> gecikmiş göreviniz var.</p>
            </div>
            <div className="flex items-center gap-3">
              <Flame className="w-4 h-4 text-rose-500/40 animate-pulse" />
              <button 
                onClick={() => updateSettings({ statusMilestonesMinimized: true })} 
                className="p-1 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.05] transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : displayMode === "today" || displayMode === "week" ? (
          <motion.div
            key={`progress-${displayMode}`}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className={cn(
              "p-3 px-4 rounded-2xl space-y-2.5 relative group/progress transition-colors duration-500",
              (displayMode === "week" && isTodayAllDone)
                ? "glass-card !border-emerald-500/20 bg-emerald-500/[0.04] shadow-[0_0_20px_rgba(16,185,129,0.06)]"
                : "glass-card"
            )}
          >
            <button 
              onClick={() => updateSettings({ statusMilestonesMinimized: true })} 
              className="absolute top-2 right-2 p-1 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.05] transition-all opacity-0 group-hover/progress:opacity-100 z-10"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <div className="flex items-center justify-between gap-4 pr-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm",
                  displayMode === "week" 
                    ? (isTodayAllDone ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20") 
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                )}>
                  <CheckCircle2 className="w-5 h-5 drop-shadow-sm" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-zinc-200 font-black tracking-widest text-[11px] uppercase">
                      {displayMode === "week" ? "HAFTALIK İLERLEME" : "GÜNLÜK İLERLEME"}
                    </h3>
                    {displayMode === "week" && isTodayAllDone && (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                        BUGÜN BİTTİ <span className="ml-0.5">✅</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                      {displayMode === "week" ? `${weekCompleted}/${totalWeek}` : `${todayCompleted}/${totalToday}`} GÖREV
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={cn(
                  "text-[20px] font-black tabular-nums transition-colors drop-shadow-sm",
                  displayMode === "week" 
                    ? (isTodayAllDone ? "text-emerald-400" : "text-purple-400")
                    : "text-blue-400"
                )}>
                  %{Math.round(displayMode === "week" ? weekProgress : todayProgress)}
                </span>
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                  1 GÖREV = <span className="text-emerald-400 font-black drop-shadow-sm">+50 XP</span>
                </span>
              </div>
            </div>
            
            <div className="relative w-full py-1.5 px-1">
              {/* Background Track */}
              <div className="absolute top-1/2 -translate-y-1/2 left-1 right-1 h-1.5 bg-white/[0.04] rounded-full border border-white/[0.02]" />
              
              {/* Stage Nodes */}
              {(() => {
                const total = displayMode === "week" ? totalWeek : totalToday;
                const completed = displayMode === "week" ? weekCompleted : todayCompleted;
                if (total > 0 && total <= 50) {
                  return Array.from({ length: total }).map((_, i) => {
                    const isCompleted = i < completed;
                    const leftPct = ((i + 1) / total) * 100;
                    return (
                      <div 
                        key={i}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 rounded-full z-15 transition-all duration-500 ring-2 ring-[#09090b] flex items-center justify-center",
                          isCompleted 
                            ? "w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-600 shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
                            : "w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/10"
                        )}
                        style={{ left: `calc(${leftPct}% - ${isCompleted ? 8 : 4}px)` }}
                      >
                        {isCompleted && <span className="text-[7px] sm:text-[9px] font-black text-emerald-100/90 leading-none drop-shadow-sm mt-[1px]">✓</span>}
                      </div>
                    )
                  })
                }
                return null;
              })()}

              {/* Foreground Filled Track */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${displayMode === "week" ? weekProgress : todayProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "relative h-1.5 rounded-full transition-all duration-500 flex items-center z-10",
                  "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                )}
              >
                {/* Thumb / Knob */}
                <div 
                  className={cn(
                     "absolute right-0 translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center border-[2px] border-[#09090b] shadow-md z-20",
                     (displayMode === "week" ? weekProgress : todayProgress) === 100 ? "bg-emerald-400" 
                     : (displayMode === "week" ? (isTodayAllDone ? "bg-emerald-400" : "bg-purple-400") : "bg-blue-400")
                  )}
                >
                  {(displayMode === "week" ? weekProgress : todayProgress) === 100 ? (
                    <span className="text-[10px]">✅</span>
                  ) : (
                     <div className="w-1.5 h-1.5 bg-[#09090b] rounded-full opacity-60" />
                  )}
                </div>
              </motion.div>
            </div>

            {/* Minimal Gamification Addon */}
            <div className="pt-2 mt-1 border-t border-white/[0.04]">
              <div className="flex items-center gap-3 w-full px-1 opacity-60 hover:opacity-100 transition-opacity duration-300">
                 <div className="flex items-center gap-1.5 min-w-max">
                   <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                   <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest drop-shadow-sm">SV. {gameStats.level}</span>
                 </div>
                 
                 {/* Ultra-thin Bar inline */}
                 <div className="relative flex-1 py-1">
                   <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-white/[0.06] rounded-full" />
                   <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${gameStats.levelPercentage}%` }}
                     transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                     className="relative h-0.5 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 shadow-[0_0_8px_rgba(168,85,247,0.4)] flex items-center z-10"
                   >
                     {/* Tiny Gamification Thumb */}
                     <div className="absolute right-0 translate-x-1/2 w-2 h-2 bg-purple-300 rounded-full border border-[#09090b] shadow-[0_0_10px_rgba(168,85,247,0.6)] z-20" />
                   </motion.div>
                 </div>
                 
                 <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase text-right max-w-[80px] truncate min-w-[50px]">
                   {gameStats.xpNeeded} XP
                 </span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      <AnimatePresence>
        {/* Dynamic Upcoming Achievement Alert (Only shown if expanded and close to badge) */}
        {displayMode !== "hidden" && displayMode !== "minimized" && gameStats.upcomingBadge && !settings.statusMilestonesMinimized && (
           (() => {
             const urg = gameStats.upcomingBadge.urgency || 3;
             const theme = urg === 1 ? {
                bgGrad: "from-rose-500/10 via-red-500/5 to-rose-500/10",
                border: "border-rose-500/40 shadow-[0_0_30px_rgba(225,29,72,0.25)]",
                glow1: "bg-rose-500/25", glow2: "bg-red-500/15",
                iconBg: "from-rose-400 to-red-600 shadow-[0_0_15px_rgba(225,29,72,0.5)]",
                iconInner: "text-rose-400 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]",
                iconInnerBg: "bg-rose-500/10",
                tagBg: "bg-rose-500/20 text-rose-400 border-rose-500/30",
                titleText: "from-rose-200 to-red-500",
                descText: "text-rose-200/80",
                barGrad: "from-rose-600 to-red-400",
                pctText: "text-rose-400 drop-shadow-[0_0_10px_rgba(225,29,72,0.4)]",
                pctSub: "text-rose-500/60 border-l border-rose-500/10",
                pulse: "animate-pulse",
                sparkle: "text-rose-200"
             } : urg === 2 ? {
                bgGrad: "from-amber-500/10 via-yellow-500/5 to-amber-500/10",
                border: "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
                glow1: "bg-amber-500/20", glow2: "bg-yellow-500/10",
                iconBg: "from-amber-400 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
                iconInner: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]",
                iconInnerBg: "bg-amber-500/10",
                tagBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                titleText: "from-amber-200 to-yellow-500",
                descText: "text-amber-200/80",
                barGrad: "from-amber-600 to-yellow-400",
                pctText: "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]",
                pctSub: "text-amber-500/60 border-l border-amber-500/10",
                pulse: "",
                sparkle: "text-yellow-300"
             } : {
                bgGrad: "from-blue-500/10 via-indigo-500/5 to-blue-500/10",
                border: "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
                glow1: "bg-blue-500/20", glow2: "bg-indigo-500/10",
                iconBg: "from-blue-400 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.4)]",
                iconInner: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]",
                iconInnerBg: "bg-blue-500/10",
                tagBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                titleText: "from-blue-200 to-indigo-400",
                descText: "text-blue-200/80",
                barGrad: "from-blue-600 to-indigo-400",
                pctText: "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]",
                pctSub: "text-blue-500/60 border-l border-blue-500/10",
                pulse: "",
                sparkle: "text-blue-200"
             };

             return (
               <motion.div
                 key="upcoming-badge-alert"
                 initial={{ opacity: 0, y: -10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95, y: -10 }}
                 className="mt-3 relative group/badge transition-all"
               >
                  {/* Flashy Animated Background & Borders */}
                  <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-r", theme.bgGrad, theme.pulse)} />
                  <div className={cn("absolute inset-0 rounded-2xl border-[1px] pointer-events-none transition-colors", theme.border)} />
                  
                  <div className="relative p-3.5 px-4 rounded-2xl flex items-center justify-between gap-4 w-full glass-card bg-[#09090b]/60 backdrop-blur-xl z-10 overflow-hidden">
                     {/* Internal glows */}
                     <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors", theme.glow1)} />
                     <div className={cn("absolute bottom-0 left-0 w-24 h-24 blur-[30px] translate-y-1/2 -translate-x-1/2 pointer-events-none transition-colors", theme.glow2)} />

                     <div className="flex items-center gap-4 w-full relative z-20">
                        {/* Glowing Trophy Icon */}
                        <div className={cn("w-11 h-11 rounded-[14px] p-[1.5px] flex-shrink-0 relative bg-gradient-to-br transition-all", theme.iconBg)}>
                           <div className="w-full h-full bg-[#0a0a0f] rounded-[12px] flex items-center justify-center relative overflow-hidden">
                               <div className={cn("absolute inset-0 transition-colors", theme.iconInnerBg)} />
                               <Trophy className={cn("w-5 h-5 transition-colors", theme.iconInner)} />
                           </div>
                           <Sparkles className={cn("w-3 h-3 absolute -top-1 -right-1 animate-pulse transition-colors", theme.sparkle)} />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border transition-colors", theme.tagBg)}>
                              {gameStats.upcomingBadge.remaining} KALDI!
                            </span>
                            <h4 className={cn("text-[13px] font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r truncate drop-shadow-sm transition-all", theme.titleText)}>
                              "{gameStats.upcomingBadge.name}"
                            </h4>
                          </div>
                          
                          <p className={cn("text-[10px] font-medium mt-0.5 truncate tracking-wide drop-shadow-sm transition-colors", theme.descText)}>
                             {gameStats.upcomingBadge.desc}
                          </p>
                          
                          {/* Mini Progress Bar for Badge */}
                          <div className="w-full h-1 bg-black/50 rounded-full mt-2 relative border border-white/[0.03] overflow-hidden">
                             <motion.div 
                               className={cn("absolute top-0 left-0 bottom-0 rounded-full bg-gradient-to-r transition-all", theme.barGrad)}
                               initial={{ width: 0 }}
                               animate={{ width: `${(gameStats.upcomingBadge.current / gameStats.upcomingBadge.target) * 100}%` }}
                               transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                             />
                          </div>
                        </div>

                        <div className={cn("flex flex-col items-end flex-shrink-0 pl-3 transition-colors", theme.pctSub)}>
                           <span className={cn("text-[16px] font-black tabular-nums leading-none tracking-tighter transition-colors", theme.pctText)}>
                             %{Math.floor((gameStats.upcomingBadge.current / gameStats.upcomingBadge.target) * 100)}
                           </span>
                           <span className="text-[8px] font-black tracking-[0.15em] uppercase mt-1">YOLUNDA</span>
                        </div>
                     </div>
                  </div>
               </motion.div>
             )
           })()
        )}
      </AnimatePresence>
      
      <AchievementModal 
         badge={celebrationBadge} 
         onClose={() => setCelebrationBadge(null)} 
      />
    </div>
  )
}
