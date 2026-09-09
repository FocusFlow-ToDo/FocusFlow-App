import { startOfDay, subDays, format } from "date-fns"
import { Task } from "@/types"

export function calculateUserStats(rawTasks: Task[]) {
  let completedTotal = 0;
  let focusMinsTotal = 0;
  let earlyBirdTasks = 0;
  let nightOwlTasks = 0;
  let noonTasks = 0;
  let subtasksTotal = 0;
  let hasMarathonDay = false;
  const completedDates = new Set<string>();
  const dailyCounts: Record<string, number> = {};

  rawTasks.forEach((t) => {
    const hasSubtasks = t.subtasks && t.subtasks.length > 0;
    if (hasSubtasks) {
      t.subtasks.forEach(s => {
        if (s.completed && s.completedAt) {
          const cd = new Date(s.completedAt);
          completedTotal++;
          subtasksTotal++;
          const dateKey = format(cd, "yyyy-MM-dd");
          completedDates.add(dateKey);
          dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
          
          const hour = cd.getHours();
          if (hour >= 5 && hour < 9) earlyBirdTasks++;
          if (hour >= 22 || hour < 3) nightOwlTasks++;
          if (hour >= 12 && hour < 14) noonTasks++;
        }
      });
    } else if (t.status === "done" && t.completedAt) {
      const cd = new Date(t.completedAt);
      completedTotal++;
      const dateKey = format(cd, "yyyy-MM-dd");
      completedDates.add(dateKey);
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      
      const hour = cd.getHours();
      if (hour >= 5 && hour < 9) earlyBirdTasks++;
      if (hour >= 22 || hour < 3) nightOwlTasks++;
      if (hour >= 12 && hour < 14) noonTasks++;
    }

    if (t.focusTime) focusMinsTotal += Math.floor(t.focusTime / 60);
  });

  // Check for marathon day (10+ tasks in a single day)
  for (const count of Object.values(dailyCounts)) {
    if (count >= 10) { hasMarathonDay = true; break; }
  }

  let currentStreak = 0;
  let checkDate = startOfDay(new Date());
  while (completedDates.has(format(checkDate, "yyyy-MM-dd"))) {
    currentStreak++;
    checkDate = subDays(checkDate, 1);
  }
  if (currentStreak === 0 && completedDates.has(format(subDays(startOfDay(new Date()), 1), "yyyy-MM-dd"))) {
    currentStreak = 1;
    checkDate = subDays(startOfDay(new Date()), 2);
    while (completedDates.has(format(checkDate, "yyyy-MM-dd"))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  const mainTasksTotal = completedTotal - subtasksTotal;
  
  let badgeBonusXP = 0;

  // Gorev Tamamlama Rozetleri XP Odulleri
  if (completedTotal >= 1) badgeBonusXP += 100;
  if (completedTotal >= 10) badgeBonusXP += 300;
  if (completedTotal >= 20) badgeBonusXP += 800;
  if (completedTotal >= 50) badgeBonusXP += 2000;
  if (completedTotal >= 100) badgeBonusXP += 5000;
  if (completedTotal >= 250) badgeBonusXP += 15000;
  if (completedTotal >= 500) badgeBonusXP += 35000;
  if (completedTotal >= 1000) badgeBonusXP += 120000;
  if (completedTotal >= 2000) badgeBonusXP += 200000;
  if (completedTotal >= 3000) badgeBonusXP += 350000;
  if (completedTotal >= 5000) badgeBonusXP += 600000;
  if (completedTotal >= 10000) badgeBonusXP += 1500000;

  // Seri (Streak) Rozetleri XP Odulleri
  if (currentStreak >= 3) badgeBonusXP += 150;
  if (currentStreak >= 7) badgeBonusXP += 500;
  if (currentStreak >= 14) badgeBonusXP += 1500;
  if (currentStreak >= 30) badgeBonusXP += 5000;
  if (currentStreak >= 60) badgeBonusXP += 15000;
  if (currentStreak >= 100) badgeBonusXP += 60000;
  if (currentStreak >= 180) badgeBonusXP += 120000;
  if (currentStreak >= 365) badgeBonusXP += 500000;
  if (currentStreak >= 500) badgeBonusXP += 800000;
  if (currentStreak >= 730) badgeBonusXP += 1500000;

  // Saat Dilimi Rozetleri XP Odulleri
  if (earlyBirdTasks >= 10) badgeBonusXP += 1000;
  if (earlyBirdTasks >= 50) badgeBonusXP += 5000;
  if (nightOwlTasks >= 10) badgeBonusXP += 1000;
  if (nightOwlTasks >= 50) badgeBonusXP += 5000;
  if (noonTasks >= 15) badgeBonusXP += 1000;
  if (hasMarathonDay) badgeBonusXP += 3000;

  // Odaklanma Rozetleri XP Odulleri
  if (focusMinsTotal >= 30) badgeBonusXP += 150;
  if (focusMinsTotal >= 120) badgeBonusXP += 500;
  if (focusMinsTotal >= 300) badgeBonusXP += 1000;
  if (focusMinsTotal >= 1000) badgeBonusXP += 5000;
  if (focusMinsTotal >= 3000) badgeBonusXP += 25000;
  if (focusMinsTotal >= 6000) badgeBonusXP += 60000;
  if (focusMinsTotal >= 12000) badgeBonusXP += 150000;
  if (focusMinsTotal >= 30000) badgeBonusXP += 400000;
  if (focusMinsTotal >= 60000) badgeBonusXP += 1000000;

  // Alt Gorev Rozetleri XP Odulleri
  if (subtasksTotal >= 10) badgeBonusXP += 100;
  if (subtasksTotal >= 50) badgeBonusXP += 500;
  if (subtasksTotal >= 100) badgeBonusXP += 1500;
  if (subtasksTotal >= 250) badgeBonusXP += 4000;
  if (subtasksTotal >= 500) badgeBonusXP += 7500;
  if (subtasksTotal >= 1000) badgeBonusXP += 20000;
  if (subtasksTotal >= 2500) badgeBonusXP += 50000;

  const totalXP = (mainTasksTotal * 50) + (subtasksTotal * 10) + (focusMinsTotal * 5) + badgeBonusXP;

  let level = 1;
  let nextLevelXP = 200;
  let currentLevelXP = 0;
  let requiredForNext = 200;

  const getXpForLevel = (l: number) => Math.floor(250 * Math.pow(l, 1.8));
  
  while (totalXP >= getXpForLevel(level)) {
    level++;
  }
  
  currentLevelXP = getXpForLevel(level - 1);
  nextLevelXP = getXpForLevel(level);
  requiredForNext = nextLevelXP - currentLevelXP;
  const progressInLevel = totalXP - currentLevelXP;
  const levelPercentage = (progressInLevel / requiredForNext) * 100;

  const rankData = getRankData(level);

  return {
    completedTotal,
    subtasksTotal,
    focusMinsTotal,
    earlyBirdTasks,
    nightOwlTasks,
    noonTasks,
    hasMarathonDay,
    currentStreak,
    activeDays: completedDates.size,
    totalXP,
    level,
    levelPercentage,
    progressInLevel,
    requiredForNext,
    rankName: rankData.name,
    rankColor: rankData.color,
    mainTasksTotal
  };
}

export const getRankData = (l: number) => {
  if (l < 5) return { name: "Acemi Cirak", color: "text-zinc-400" };
  if (l < 10) return { name: "Disiplin Yolcusu", color: "text-blue-400" };
  if (l < 15) return { name: "Odak Savascisi", color: "text-emerald-400" };
  if (l < 25) return { name: "Uretken Sovalye", color: "text-teal-400" };
  if (l < 40) return { name: "Zaman Bukucu", color: "text-indigo-400" };
  if (l < 60) return { name: "Golge Ustasi", color: "text-fuchsia-400" };
  if (l < 80) return { name: "Yuce Aydinlanmis", color: "text-rose-400" };
  if (l < 100) return { name: "Galaktik Gezgin", color: "text-amber-400" };
  if (l < 150) return { name: "Titanyum Irade", color: "text-cyan-400" };
  if (l < 250) return { name: "Zamanin Efendisi", color: "text-orange-400" };
  if (l < 500) return { name: "Evrenin Dokuyucusu", color: "text-purple-400" };
  return { name: "Efsanevi Olumsuz", color: "text-yellow-400" };
};
