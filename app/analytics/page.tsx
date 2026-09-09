"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Flame, CheckCircle, Clock, BarChart3, Zap, TrendingUp, TrendingDown,
  Target, Calendar, AlertTriangle, Award, Brain, Star, ChevronDown, ChevronUp,
  Tag, Layers, Activity, Timer, RotateCcw, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTasks } from "@/hooks/useTasks"
import { useCategories } from "@/hooks/useCategories"
import { useSettings } from "@/hooks/useSettings"
import {
  startOfDay, subDays, differenceInMinutes, isSameDay, format,
  startOfWeek, endOfWeek, isWithinInterval, eachDayOfInterval,
  isBefore, getDay,
} from "date-fns"
import { tr } from "date-fns/locale"
import type { Task } from "@/types"
import { CalendarPicker } from "@/components/ui/CalendarPicker"

/* ══════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════ */
const toDate = (val: any): Date | null => {
  if (!val) return null
  if (val instanceof Date) return val
  if (val?.toDate) return val.toDate()
  if (typeof val === "string" || typeof val === "number") return new Date(val)
  return null
}

const fmtMin = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)}s ${m % 60}d` : `${m}dk`

/* ══════════════════════════════════════════════
   Analytics hook
══════════════════════════════════════════════ */
function useAnalytics(tasks: Task[], categories: any[], selectedDate: Date) {
  return React.useMemo(() => {
    const now = new Date()
    const today = startOfDay(now)

    /* ── Streak ── */
    let streak = 0
    let day = today
    if (!tasks.some(t => { const d = toDate(t.completedAt); return d && isSameDay(d, today) }))
      day = subDays(today, 1)
    while (true) {
      const has = tasks.some(t => { const d = toDate(t.completedAt); return t.status === "done" && d && isSameDay(d, day) })
      if (!has) break; streak++; day = subDays(day, 1)
    }
    const maxSt = Math.max(streak, ...Array.from({ length: 60 }, (_, i) => {
      let s = 0; let dd = subDays(today, i)
      while (tasks.some(t => { const d = toDate(t.completedAt); return t.status === "done" && d && isSameDay(d, dd) }))
        { s++; dd = subDays(dd, 1) }
      return s
    }))

    /* ── 30-day chart ── */
    const allSubtasks = tasks.flatMap(t => (t.subtasks || []).map(s => ({ ...s })))

    const chart30 = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(today, 29 - i)
      const done = tasks.filter(t => { const cd = toDate(t.completedAt); return t.status === "done" && cd && isSameDay(cd, d) }).length
      const subDone = allSubtasks.filter(s => { const sd = toDate(s.completedAt); return s.completed && sd && isSameDay(sd, d) }).length
      const created = tasks.filter(t => { const cd = toDate(t.createdAt); return cd && isSameDay(cd, d) }).length
      const overdue = tasks.filter(t => {
        const dd2 = toDate(t.dueDate)
        const cd = toDate(t.completedAt)
        return t.status === "done" && dd2 && cd && isSameDay(cd, d) && isBefore(dd2, cd)
      }).length
      return { date: d, done: done + subDone, taskDone: done, created, overdue, label: format(d, "d", { locale: tr }), month: format(d, "MMM", { locale: tr }), isToday: isSameDay(d, today), dayOfWeek: getDay(d) }
    })
    const max30 = Math.max(...chart30.map(d => Math.max(d.done, d.created)), 1)

    /* ── 7-day summary ── */
    const weekAgo = subDays(today, 7)
    const twoWeeksAgo = subDays(today, 14)
    const thisWeekDone = tasks.filter(t => { const d = toDate(t.completedAt); return t.status === "done" && d && d >= weekAgo })
    const lastWeekDone = tasks.filter(t => { const d = toDate(t.completedAt); return t.status === "done" && d && d >= twoWeeksAgo && d < weekAgo })
    const thisWeekSubDone = allSubtasks.filter(s => { const d = toDate(s.completedAt); return s.completed && d && d >= weekAgo })
    const lastWeekSubDone = allSubtasks.filter(s => { const d = toDate(s.completedAt); return s.completed && d && d >= twoWeeksAgo && d < weekAgo })
    const totalWorkDone = thisWeekDone.length + thisWeekSubDone.length
    const weekChange = totalWorkDone - (lastWeekDone.length + lastWeekSubDone.length)

    /* ── Focus time ── */
    let totalWorkSeconds = 0; let focusTaskCount = 0
    tasks.forEach(t => { if (t.focusTime && t.focusTime > 0) { totalWorkSeconds += t.focusTime; focusTaskCount++ } })
    const totalFocusMinutes = Math.round(totalWorkSeconds / 60)
    const avgMin = focusTaskCount > 0 ? Math.round(totalFocusMinutes / focusTaskCount) : 0

    /* ── Completion rate ── */
    const overdueCount = tasks.filter(t => t.status !== "done" && t.dueDate && toDate(t.dueDate)! < today).length
    const todayPendingCount = tasks.filter(t => t.status !== "done" && t.dueDate && isSameDay(toDate(t.dueDate)!, today)).length
    const totalPotentialPool = totalWorkDone + overdueCount + todayPendingCount
    const rate = totalPotentialPool > 0 ? Math.min(Math.round((totalWorkDone / totalPotentialPool) * 100), 100) : 0

    /* ── Active Dates & Hourly heatmap ── */
    const activeDates = new Set<string>()
    const hourlyData = Array.from({ length: 24 }, (_, h) => {
      let sec = 0
      tasks.forEach(t => {
        t.sessions?.forEach((s: any) => {
          const sd = toDate(s.startTime)
          if (sd) {
             activeDates.add(format(sd, "yyyy-MM-dd"))
             if (isSameDay(sd, selectedDate) && sd.getHours() === h) sec += s.duration
          }
        })
      })
      try {
        const log = JSON.parse(localStorage.getItem("FF_ACTIVITY_LOG") || "{}")
        Object.keys(log).forEach(key => {
           const parts = key.split("-")
           if (parts.length >= 3) activeDates.add(`${parts[0]}-${parts[1]}-${parts[2]}`)
        })
        const d = selectedDate
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${String(h).padStart(2, "0")}`
        if (typeof log[key] === "number") sec += log[key]
      } catch {}
      return { hour: h, count: Math.round(sec / 60) }
    })
    const maxHourly = Math.max(...hourlyData.map(d => d.count), 1)
    const peakHour = hourlyData.reduce((a, b) => b.count > a.count ? b : a, hourlyData[0])

    // Find longest meaningful active block instead of just a single hour
    let activeBlockStr = `${String(peakHour.hour).padStart(2,"0")}:00 - ${String((peakHour.hour + 1) % 24).padStart(2,"0")}:00`
    if (maxHourly > 0) {
      const threshold = maxHourly * 0.4
      const activeIndices = hourlyData.filter(d => d.count >= threshold).map(d => d.hour)
      
      let blocks: number[][] = []
      if (activeIndices.length > 0) {
        let currentBlock = [activeIndices[0]]
        for (let i = 1; i < activeIndices.length; i++) {
          if (activeIndices[i] === currentBlock[currentBlock.length - 1] + 1) {
            currentBlock.push(activeIndices[i])
          } else {
            blocks.push([...currentBlock])
            currentBlock = [activeIndices[i]]
          }
        }
        blocks.push(currentBlock)
        
        // Handle wrap-around (e.g., 23:00 to 01:00)
        if (blocks.length > 1 && blocks[0][0] === 0 && blocks[blocks.length - 1][blocks[blocks.length - 1].length - 1] === 23) {
          blocks[0] = [...blocks[blocks.length - 1], ...blocks[0]]
          blocks.pop()
        }
        
        const blockStats = blocks.map(b => ({
          start: b[0],
          end: (b[b.length - 1] + 1) % 24,
          count: b.length,
          sum: b.reduce((s, h) => s + hourlyData[h].count, 0)
        }))
        
        blockStats.sort((a,b) => b.sum - a.sum)
        const best = blockStats[0]
        
        if (best.count === 24) {
          activeBlockStr = "Tüm gün"
        } else {
          activeBlockStr = `${String(best.start).padStart(2,"0")}:00 - ${String(best.end).padStart(2,"0")}:00`
        }
      }
    }

    /* ── Priority distribution ── */
    const active = tasks.filter(t => t.status !== "done" && t.status !== "trash")
    const prio = {
      urgent: active.filter(t => t.priority === "urgent").length,
      high: active.filter(t => t.priority === "high").length,
      medium: active.filter(t => t.priority === "medium").length,
      low: active.filter(t => t.priority === "low").length,
      total: active.length,
    }

    /* ── Category breakdown ── */
    const catBreakdownBase = categories.map(cat => {
      const catTasks = tasks.filter(t => t.categoryId === cat.id)
      const done = catTasks.filter(t => t.status === "done").length
      const pending = catTasks.filter(t => t.status !== "done" && t.status !== "trash").length
      const focusMins = Math.round(catTasks.reduce((acc, t) => acc + (t.focusTime || 0), 0) / 60)
      return { ...cat, total: catTasks.length, done, pending, focusMins, rate: catTasks.length > 0 ? Math.round((done / catTasks.length) * 100) : 0 }
    }).filter(c => c.total > 0)

    const uncatTasks = tasks.filter(t => !t.categoryId || t.categoryId === "uncategorized")
    if (uncatTasks.length > 0) {
      const done = uncatTasks.filter(t => t.status === "done").length
      const pending = uncatTasks.filter(t => t.status !== "done" && t.status !== "trash").length
      const focusMins = Math.round(uncatTasks.reduce((acc, t) => acc + (t.focusTime || 0), 0) / 60)
      catBreakdownBase.push({
        id: "uncategorized",
        name: "Kategorisiz",
        color: "zinc",
        icon: "Hash",
        total: uncatTasks.length,
        done,
        pending,
        focusMins,
        rate: Math.round((done / uncatTasks.length) * 100)
      } as any)
    }

    const catBreakdown = catBreakdownBase.sort((a, b) => b.total - a.total).slice(0, 6)

    /* ── Top tasks by focus time ── */
    const topTasks = [...tasks].filter(t => t.focusTime > 0).sort((a, b) => (b.focusTime || 0) - (a.focusTime || 0)).slice(0, 5)

    /* ── Best / worst day ── */
    const dayTotals = chart30.map(d => ({ label: d.label, date: d.date, done: d.done }))
    const bestDay = dayTotals.reduce((a, b) => b.done > a.done ? b : a, dayTotals[0])
    const worstDays = [...dayTotals].sort((a, b) => a.done - b.done)

    /* ── Overdue trend (last 14 days) ── */
    const overdueTrend = Array.from({ length: 14 }, (_, i) => {
      const d = subDays(today, 13 - i)
      const count = tasks.filter(t => {
        const dd2 = toDate(t.dueDate)
        return t.status !== "done" && t.status !== "trash" && dd2 && dd2 < d
      }).length
      return { date: d, count, label: format(d, "d", { locale: tr }) }
    })

    /* ── Cleared backlog ── */
    const clearedBacklog = tasks.filter(t => {
      const cd = toDate(t.completedAt); const dd2 = toDate(t.dueDate)
      return t.status === "done" && cd && dd2 && cd >= weekAgo && (isBefore(dd2, cd) || isSameDay(cd, dd2))
    }).length

    /* ── On-time completion rate ── */
    const thisWeekWithDue = thisWeekDone.filter(t => t.dueDate)
    const onTimeCount = thisWeekWithDue.filter(t => {
      const cd = toDate(t.completedAt); const dd2 = toDate(t.dueDate)
      return cd && dd2 && (isBefore(cd, dd2) || isSameDay(startOfDay(cd), startOfDay(dd2)))
    }).length
    const onTimeRate = thisWeekWithDue.length > 0 ? Math.round((onTimeCount / thisWeekWithDue.length) * 100) : null

    /* ── Smart insight ── */
    const buildInsight = () => {
      const parts: string[] = []
      if (totalWorkDone === 0) return "Bu hafta henüz tamamlanan görev bulunmuyor. Hadi başlayalım! 💪"
      parts.push(`Bu hafta **${totalWorkDone}** aktivite tamamlandı`)
      if (totalFocusMinutes > 0) parts.push(`toplam **${fmtMin(totalFocusMinutes)}** derin odaklanma süresi`)
      if (weekChange > 0) parts.push(`geçen haftaya göre **${weekChange} aktivite artış** var 🚀`)
      else if (weekChange < 0) parts.push(`geçen haftaya göre **${Math.abs(weekChange)} aktivite azalma** var`)
      if (clearedBacklog > 0) parts.push(`**${clearedBacklog} gecikmiş görev** temizlendi 🧹`)
      if (onTimeRate !== null) parts.push(`zamanında tamamlanma oranı **%${onTimeRate}**`)
      if (peakHour.count > 0) {
        const h = peakHour.hour
        const timeLabel = h < 6 ? "gece" : h < 12 ? "sabah" : h < 17 ? "öğleden sonra" : h < 21 ? "akşam" : "gece geç"
        parts.push(`seçili günün en yoğun saati **${String(h).padStart(2,"0")}:00 ${timeLabel}** 🕐`)
      }
      return parts.join(", ") + "."
    }

    /* ── Daily Dist (mon-sun) ── */
    const rawDailyData = Array.from({ length: 7 }, (_, dIndex) => {
      let sec = 0
      tasks.forEach(t => {
        t.sessions?.forEach((s: any) => {
          const sd = toDate(s.startTime)
          if (sd && sd >= weekAgo && sd.getDay() === dIndex) sec += s.duration
        })
      })
      try {
        const log = JSON.parse(localStorage.getItem("FF_ACTIVITY_LOG") || "{}")
        for (let i = 0; i < 7; i++) {
          const dDt = subDays(today, i)
          if (dDt.getDay() === dIndex) {
            for (let h = 0; h < 24; h++) {
               const key = `${dDt.getFullYear()}-${String(dDt.getMonth() + 1).padStart(2, "0")}-${String(dDt.getDate()).padStart(2, "0")}-${String(h).padStart(2, "0")}`
               if (typeof log[key] === "number") sec += log[key]
            }
          }
        }
      } catch {}
      return { dayIndex: dIndex, count: Math.round(sec / 60) }
    })
    
    // sort Mon -> Sun (1..6, 0)
    const dailyLabels = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"]
    const dailyData = [1, 2, 3, 4, 5, 6, 0].map(id => ({ ...rawDailyData[id], label: dailyLabels[id] }))
    const maxDaily = Math.max(...dailyData.map(d => d.count), 1)
    const peakDay = dailyData.reduce((a, b) => b.count > a.count ? b : a, dailyData[0])

    return {
      streak, maxStreak: maxSt, chart30, max30, totalWorkDone, weekChange,
      totalFocusMinutes, avgMin, rate, hourlyData, maxHourly, peakHour, activeBlockStr,
      prio, catBreakdown, topTasks, bestDay, overdueTrend,
      clearedBacklog, onTimeRate, thisWeekDone, lastWeekDone,
      thisWeekCompleted: thisWeekDone.length, thisWeekSubCompleted: thisWeekSubDone.length,
      overdueCount, insight: buildInsight(),
      dailyData, maxDaily, peakDay, activeDates
    }
  }, [tasks, categories, selectedDate])
}

/* ══════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const { tasks } = useTasks()
  const { categories } = useCategories()
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [showDatePicker, setShowDatePicker] = React.useState(false)
  const d = useAnalytics(tasks, categories, selectedDate)
  const [rangeLabel] = React.useState("Son 30 Gün")
  const [densityView, setDensityView] = React.useState<"hours" | "days">("days")

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={Flame}
            iconColor="text-orange-400"
            bg="from-orange-500/10 to-transparent"
            title="Streak"
            value={`${d.streak} Gün`}
            sub={d.streak > 0 ? `En uzun: ${d.maxStreak}g` : "Bugün başla!"}
            subColor={d.streak > 0 ? "text-orange-400/70" : "text-zinc-600"}
            delay={0}
          />
          <KpiCard
            icon={Clock}
            iconColor="text-blue-400"
            bg="from-blue-500/10 to-transparent"
            title="Odak Süresi"
            value={fmtMin(d.totalFocusMinutes)}
            sub={d.avgMin > 0 ? `Ort. ${d.avgMin}dk/görev` : "Pomodoro kullan"}
            subColor="text-blue-400/70"
            delay={0.06}
          />
          <KpiCard
            icon={CheckCircle}
            iconColor="text-emerald-400"
            bg="from-emerald-500/10 to-transparent"
            title="Bu Hafta"
            value={`${d.totalWorkDone}`}
            sub={d.weekChange >= 0 ? `↑ ${d.weekChange} artış` : `↓ ${Math.abs(d.weekChange)} azalma`}
            subColor={d.weekChange >= 0 ? "text-emerald-400" : "text-rose-400"}
            delay={0.12}
          />
          <KpiCard
            icon={Target}
            iconColor="text-purple-400"
            bg="from-purple-500/10 to-transparent"
            title="Tamamlanma"
            value={`%${d.rate}`}
            sub={d.overdueCount > 0 ? `${d.overdueCount} gecikmiş var` : "Harika!"}
            subColor={d.overdueCount > 0 ? "text-rose-400/80" : "text-emerald-400"}
            delay={0.18}
            barValue={d.rate}
          />
        </div>

        {/* ── 30-day chart ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Aktivite Trendi</h3>
              <p className="text-[11px] text-zinc-600 mt-0.5">{rangeLabel} · Tamamlanan & Eklenen</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-emerald-500/70" /><span className="text-[10px] text-zinc-500">Tamamlanan</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-blue-500/40" /><span className="text-[10px] text-zinc-500">Eklenen</span></div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex items-end gap-[2px] h-[140px] mb-2">
            {d.chart30.map((item, i) => {
              const pctDone = d.max30 > 0 ? (item.done / d.max30) * 100 : 0
              const pctCreated = d.max30 > 0 ? (item.created / d.max30) * 100 : 0
              const isWeekend = item.dayOfWeek === 0 || item.dayOfWeek === 6
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {(item.done > 0 || item.created > 0) && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 glass-dropdown text-[9px] px-2 py-1.5 rounded-lg z-20 pointer-events-none whitespace-nowrap flex flex-col items-center gap-0.5 shadow-xl">
                      <span className="text-emerald-400 font-bold">{item.done} tamamlandı</span>
                      <span className="text-blue-400">{item.created} eklendi</span>
                      <span className="text-zinc-500">{format(item.date, "d MMM", { locale: tr })}</span>
                    </div>
                  )}
                  <div className="w-full flex justify-center items-end gap-[1px] mb-1 h-full">
                    <motion.div
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.015 }}
                      className={cn("w-full max-w-[11px] rounded-t-sm origin-bottom transition-colors",
                        item.isToday ? "bg-emerald-400" : "bg-emerald-500/60 group-hover:bg-emerald-400/80",
                        isWeekend && !item.isToday && "opacity-60"
                      )}
                      style={{ height: `${Math.max(pctDone, 3)}%` }}
                    />
                    <motion.div
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      transition={{ duration: 0.4, delay: 0.32 + i * 0.015 }}
                      className="w-full max-w-[11px] rounded-t-sm origin-bottom bg-blue-500/35 group-hover:bg-blue-400/55 transition-colors"
                      style={{ height: `${Math.max(pctCreated, 3)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {/* Month labels */}
          <div className="flex items-center gap-[2px]">
            {d.chart30.map((item, i) => (
              <div key={i} className="flex-1 text-center">
                {(i === 0 || item.month !== d.chart30[i - 1]?.month) && (
                  <span className="text-[8px] text-zinc-700 font-medium">{item.month}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Hourly/Daily heatmap */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-5 relative z-20">
            <div className="flex items-start sm:items-center justify-between mb-6 gap-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold text-zinc-200">Aktivite Yoğunluğu</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                {densityView === "hours" ? (
                    d.peakHour.count > 0 && <span className="text-[10px] text-zinc-500 whitespace-nowrap mt-1"><span className="text-emerald-400 font-bold">{d.activeBlockStr}</span> arası zirve</span>
                ) : (
                    d.peakDay.count > 0 && <span className="text-[10px] text-zinc-500 whitespace-nowrap mt-1"><span className="text-emerald-400 font-bold">{d.peakDay.label}</span> günü zirve</span>
                )}
                
                {densityView === "hours" && (
                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-white/[0.03] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition-all border border-white/[0.05]"
                    >
                       <Calendar className="w-3 h-3" />
                       {isSameDay(selectedDate, new Date()) ? "Bugün" : format(selectedDate, "d MMM yyyy", { locale: tr })}
                       <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                    <AnimatePresence>
                      {showDatePicker && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full mt-2 right-0 z-50 origin-top-right"
                        >
                          <CalendarPicker
                            selectedDate={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              setShowDatePicker(false);
                            }}
                            onClose={() => setShowDatePicker(false)}
                            today={new Date()}
                            allowPastDates={true}
                            hideTomorrow={true}
                            activeDates={d.activeDates}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                
                <div className="flex bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.05]">
                  <button onClick={() => setDensityView("hours")} className={cn("px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors", densityView === "hours" ? "bg-white/[0.1] text-zinc-200" : "text-zinc-500 hover:text-zinc-300")}>Saatler</button>
                  <button onClick={() => setDensityView("days")} className={cn("px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors", densityView === "days" ? "bg-white/[0.1] text-zinc-200" : "text-zinc-500 hover:text-zinc-300")}>Günler</button>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-1.5 h-[120px] mb-4 relative pl-3 pr-2">
              {densityView === "hours" ? (
                 d.hourlyData.map((h, i) => {
                    const pct = d.maxHourly > 0 ? (h.count / d.maxHourly) * 100 : 0
                    const isPeak = h.hour === d.peakHour.hour && h.count > 0
                    const isNight = h.hour >= 22 || h.hour < 6
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative mb-4">
                        {h.count > 0 && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#0a0a0f]/95 backdrop-blur-xl rounded-lg border border-white/10 text-[10px] px-2 py-1.5 z-20 pointer-events-none whitespace-nowrap text-white font-bold shadow-2xl transition-all duration-200 group-hover:-translate-y-1">
                            {fmtMin(h.count)}
                          </div>
                        )}
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.5 }}
                          className={cn("w-full rounded-sm min-h-[4px] origin-bottom transition-all duration-300",
                            isPeak ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)] group-hover:brightness-125"
                              : isNight && h.count > 0 ? "bg-purple-500/80 group-hover:bg-purple-400"
                              : h.count > 0 ? "bg-blue-500/80 group-hover:bg-blue-400"
                              : "bg-white/[0.04]"
                          )}
                          style={{ height: `${Math.max(pct, 2)}%` }}
                        />
                        {i % 6 === 0 && <span className="text-[8px] text-zinc-600 mt-2 absolute -bottom-5 w-[20px] text-center font-medium">{String(h.hour).padStart(2,"0")}</span>}
                      </div>
                    )
                 })
              ) : (
                 d.dailyData.map((dItem, i) => {
                    const pct = d.maxDaily > 0 ? (dItem.count / d.maxDaily) * 100 : 0
                    const isPeak = dItem.label === d.peakDay.label && dItem.count > 0
                    const isWeekend = dItem.dayIndex === 0 || dItem.dayIndex === 6
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative mb-4">
                        {dItem.count > 0 && (
                          <div className="absolute -top-11 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 rounded-lg text-[11px] px-2.5 py-1.5 z-20 pointer-events-none whitespace-nowrap text-white font-bold shadow-2xl transition-all duration-200 group-hover:-translate-y-1">
                            {fmtMin(dItem.count)}
                          </div>
                        )}
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.5 }}
                          className={cn("w-full max-w-[28px] rounded-t-md origin-bottom min-h-[6px] transition-all duration-300",
                            isPeak ? "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] group-hover:brightness-125"
                              : isWeekend && dItem.count > 0 ? "bg-pink-500/80 group-hover:bg-pink-400"
                              : dItem.count > 0 ? "bg-blue-500/80 group-hover:bg-blue-400"
                              : "bg-white/[0.04]"
                          )}
                          style={{ height: `${Math.max(pct, 3)}%` }}
                        />
                        <span className="text-[10px] text-zinc-500 mt-2 absolute -bottom-5 w-full text-center font-bold tracking-wider">{dItem.label}</span>
                      </div>
                    )
                 })
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-6 pt-3 border-t border-white/[0.04]">
              {densityView === "hours" ? (
                <>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-400 shadow-sm"/><span className="text-[10px] text-zinc-500 font-bold uppercase">Zirve</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-blue-500/80"/><span className="text-[10px] text-zinc-500 font-bold uppercase">Gündüz</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-purple-500/80"/><span className="text-[10px] text-zinc-500 font-bold uppercase">Gece</span></div>
                  <div className="flexitems-center gap-1.5 ml-auto"><span className="text-[11px] font-bold text-zinc-400">Toplam: {fmtMin(d.hourlyData.reduce((acc, h) => acc + h.count, 0))}</span></div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-400 shadow-sm"/><span className="text-[10px] text-zinc-500 font-bold uppercase">Zirve Gün</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-blue-500/80"/><span className="text-[10px] text-zinc-500 font-bold uppercase">Hafta İçi</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-pink-500/80"/><span className="text-[10px] text-zinc-500 font-bold uppercase">Hafta Sonu</span></div>
                  <div className="flex items-center gap-1.5 ml-auto"><span className="text-[11px] font-bold text-zinc-400">Toplam: {fmtMin(d.dailyData.reduce((acc, d) => acc + d.count, 0))}</span></div>
                </>
              )}
            </div>
          </motion.div>

          {/* Overdue trend */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
            className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Gecikmiş Görev Eğilimi</h3>
                <p className="text-[11px] text-zinc-600 mt-0.5">Son 14 gün</p>
              </div>
              {d.overdueCount > 0 ? (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
                  <AlertTriangle className="w-3 h-3" />
                  {d.overdueCount} aktif
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Temiz!
                </span>
              )}
            </div>
            <div className="flex items-end gap-1 h-[120px]">
              {d.overdueTrend.map((item, i) => {
                const maxO = Math.max(...d.overdueTrend.map(x => x.count), 1)
                const pct = (item.count / maxO) * 100
                const isLast = i === d.overdueTrend.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {item.count > 0 && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 glass-dropdown text-[9px] px-1.5 py-0.5 rounded z-10 pointer-events-none whitespace-nowrap text-rose-300">
                        {item.count} görev
                      </div>
                    )}
                    <motion.div
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.03 }}
                      className={cn("w-full rounded-t-sm origin-bottom min-h-[2px]",
                        isLast ? "bg-rose-400" : item.count > 0 ? "bg-rose-500/50 group-hover:bg-rose-400/70" : "bg-white/[0.025]"
                      )}
                      style={{ height: `${Math.max(pct, 3)}%` }}
                    />
                    {i % 4 === 0 && <span className="text-[8px] text-zinc-700 mt-1">{item.label}</span>}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Priority + Category row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Priority distribution */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-bold text-zinc-200 mb-5">Aktif Öncelik Dağılımı</h3>
            <div className="space-y-3.5">
              {([
                { key: "urgent", label: "Acil", color: "bg-red-500", text: "text-red-400", glow: "shadow-[0_0_8px_rgba(239,68,68,0.4)]" },
                { key: "high",   label: "Yüksek", color: "bg-orange-500", text: "text-orange-400", glow: "" },
                { key: "medium", label: "Orta",   color: "bg-blue-500",   text: "text-blue-400",   glow: "" },
                { key: "low",    label: "Düşük",  color: "bg-emerald-500",text: "text-emerald-400",glow: "" },
              ] as const).map((p) => {
                const count = d.prio[p.key]
                const pct = d.prio.total > 0 ? (count / d.prio.total) * 100 : 0
                return (
                  <div key={p.key} className="flex items-center gap-3">
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", p.color, count > 0 && p.glow)} />
                    <span className={cn("text-[13px] font-semibold w-16 flex-shrink-0", count > 0 ? p.text : "text-zinc-600")}>{p.label}</span>
                    <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: 0.5 }}
                        className={cn("h-full rounded-full", p.color, "opacity-70")} />
                    </div>
                    <span className={cn("text-[13px] font-bold w-6 text-right tabular-nums flex-shrink-0", count > 0 ? p.text : "text-zinc-700")}>{count}</span>
                    <span className="text-[10px] text-zinc-700 w-8 text-right flex-shrink-0">{pct > 0 ? `%${Math.round(pct)}` : ""}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[11px] text-zinc-600">Toplam aktif</span>
              <span className="text-[13px] font-bold text-zinc-300 tabular-nums">{d.prio.total} görev</span>
            </div>
          </motion.div>

          {/* Category breakdown */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
            className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-bold text-zinc-200 mb-5 flex items-center gap-2">
              <Tag className="w-4 h-4 text-zinc-500" />
              Kategori Dağılımı
            </h3>
            {d.catBreakdown.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-zinc-600 text-[13px]">Kategori bulunamadı</div>
            ) : (
              <div className="space-y-3">
                {d.catBreakdown.map((cat, i) => {
                  const color = cat.color?.startsWith("#") ? cat.color : "#6366f1"
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-[12px] font-semibold text-zinc-300 flex-1 min-w-0 truncate">{cat.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-zinc-500 tabular-nums">{cat.done}/{cat.total}</span>
                          {cat.focusMins > 0 && <span className="text-[10px] text-zinc-600">{fmtMin(cat.focusMins)}</span>}
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${cat.rate}%` }} transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                          className="h-full rounded-full" style={{ backgroundColor: color + "99" }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── AI Insight + Top tasks ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Insight */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="lg:col-span-2 glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(59,130,246,0.04) 100%)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Performans Analiz Raporu</h3>
                  <span className="text-[9px] text-indigo-400 font-black tracking-widest uppercase">Haftalık özet</span>
                </div>
              </div>
              <p className="text-[13.5px] text-zinc-400 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: d.insight.replace(/\*\*(.*?)\*\*/g, '<b class="text-zinc-100">$1</b>') }}
              />
              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/[0.05]">
                {[
                  { label: "Haftalık başarı", value: `%${d.rate}`, color: d.rate >= 70 ? "text-emerald-400" : d.rate >= 40 ? "text-amber-400" : "text-rose-400" },
                  { label: d.weekChange >= 0 ? "Artış" : "Azalma", value: `${d.weekChange >= 0 ? "+" : ""}${d.weekChange}`, color: d.weekChange >= 0 ? "text-emerald-400" : "text-rose-400" },
                  { label: "Zamanında", value: d.onTimeRate !== null ? `%${d.onTimeRate}` : "—", color: d.onTimeRate !== null && d.onTimeRate >= 70 ? "text-emerald-400" : "text-zinc-400" },
                ].map(s => (
                  <div key={s.label} className="flex flex-col">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{s.label}</span>
                    <span className={cn("text-[18px] font-black tabular-nums", s.color)}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top tasks by focus time */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}
            className="glass-card rounded-2xl p-5 flex flex-col">
            <h3 className="text-sm font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-400" />
              En Uzun Odaklanılan
            </h3>
            {d.topTasks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-zinc-600 text-[12px] text-center">
                Henüz pomodoro oturumu yok
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between space-y-3">
                {d.topTasks.map((t, i) => {
                  const mins = Math.round((t.focusTime || 0) / 60)
                  const maxMin = Math.round((d.topTasks[0].focusTime || 1) / 60)
                  return (
                    <div key={t.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-700 w-4 tabular-nums">#{i + 1}</span>
                        <span className="text-[12px] font-semibold text-zinc-300 flex-1 min-w-0 truncate">{t.title}</span>
                        <span className="text-[11px] font-bold text-blue-400 flex-shrink-0 tabular-nums">{fmtMin(mins)}</span>
                      </div>
                      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden ml-6">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(mins / maxMin) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.6 + i * 0.08 }}
                          className="h-full rounded-full bg-blue-500/60" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Quick badges ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: Award,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
              title: "En İyi Gün",
              value: d.bestDay.done > 0 ? `${format(d.bestDay.date, "d MMM", { locale: tr })}` : "—",
              sub: d.bestDay.done > 0 ? `${d.bestDay.done} aktivite` : "Veri yok",
            },
            {
              icon: Activity,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
              title: "Zamanında",
              value: d.onTimeRate !== null ? `%${d.onTimeRate}` : "—",
              sub: "Bu hafta",
            },
            {
              icon: RotateCcw,
              color: "text-purple-400",
              bg: "bg-purple-500/10 border-purple-500/20",
              title: "Backlog Temizlendi",
              value: `${d.clearedBacklog}`,
              sub: "Gecikmiş tamamlandı",
            },
            {
              icon: Layers,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
              title: "Alt Görev Oranı",
              value: d.totalWorkDone > 0 ? `%${Math.round((d.thisWeekSubCompleted / d.totalWorkDone) * 100)}` : "—",
              sub: `${d.thisWeekSubCompleted} alt görev`,
            },
          ].map((b, i) => (
            <div key={i} className={cn("rounded-2xl border p-4 flex flex-col gap-2", b.bg, "glass-card")}>
              <b.icon className={cn("w-5 h-5", b.color)} />
              <div>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{b.title}</p>
                <p className="text-[22px] font-black text-zinc-100 tabular-nums leading-tight">{b.value}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{b.sub}</p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  )
}

/* ── KPI Card ── */
function KpiCard({ icon: Icon, iconColor, bg, title, value, sub, subColor, delay, barValue }: {
  icon: React.FC<any>; iconColor: string; bg: string; title: string; value: string
  sub: string; subColor: string; delay: number; barValue?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}
      className={cn("glass-card glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col relative overflow-hidden")}>
      <div className={cn("absolute top-0 left-0 w-full h-full bg-gradient-to-br opacity-40", bg)} />
      <Icon className={cn("w-6 h-6 mb-3 relative", iconColor)} />
      <p className="text-2xl sm:text-3xl font-black text-zinc-100 tabular-nums mb-1 relative leading-none">{value}</p>
      <p className="text-[11px] text-zinc-500 font-medium mb-2 relative">{title}</p>
      <p className={cn("text-[10px] font-bold mt-auto relative", subColor)}>{sub}</p>
      {barValue !== undefined && (
        <div className="w-full h-1 bg-white/[0.04] rounded-full mt-2 overflow-hidden relative">
          <motion.div className="h-full bg-purple-500/70 rounded-full" initial={{ width: 0 }} animate={{ width: `${barValue}%` }} transition={{ duration: 1, delay: delay + 0.4 }} />
        </div>
      )}
    </motion.div>
  )
}