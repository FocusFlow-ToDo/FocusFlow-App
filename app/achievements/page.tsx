"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, useMotionTemplate } from "motion/react"
import { Trophy, Flame, Star, Target, Zap, Clock, CalendarDays, Award, Medal, Crown, ListTodo, Hexagon, Shield, Sword, Eye, Sparkles, Navigation, X, ScanFace, Activity, Check, Trash2, Layers, HeartHandshake, ShoppingBag } from "lucide-react"
import { useTasks } from "@/hooks/useTasks"
import { db } from "@/firebase/config"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"
import { AchievementModal, getTheme } from "@/components/focus/AchievementModal"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { startOfDay, format, isSameDay, subDays } from "date-fns"
import { BADGES } from "@/lib/badges"
import { calculateUserStats } from "@/lib/stats"

export default function AchievementsPage() {
  const { rawTasks } = useTasks()
  const { user } = useAuth()
  const { settings, updateSettings } = useSettings()

  const stats = React.useMemo(() => {
    return calculateUserStats(rawTasks)
  }, [rawTasks])

  const earnedSet = React.useMemo(() => {
    return new Set([...(settings.earnedBadges || [])])
  }, [settings.earnedBadges])

  const badges = React.useMemo(() => {
    return BADGES.map(b => {
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

      const isUnlocked = currentVal >= b.target || earnedSet.has(b.id) || earnedSet.has(b.name)

      return {
        ...b,
        current: currentVal,
        unlocked: isUnlocked,
        progress: Math.min(100, Math.round((currentVal / b.target) * 100)),
        remaining: Math.max(0, b.target - currentVal)
      }
    })
  }, [stats, settings.streakCount, settings.inventory, settings.friends, settings.focusCoins, earnedSet])

  const showcaseBadges = settings.showcaseBadges || [null, null, null];
  
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = React.useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = React.useState<number | null>(null);

  const handleSlotClick = (index: number) => {
    setSelectedSlotIndex(index);
    setIsShowcaseModalOpen(true);
  };

  const handleSelectBadgeForSlot = (badgeId: string | null) => {
    if (selectedSlotIndex !== null) {
      const newShowcase = [...showcaseBadges];
      
      // If the badge is already in another slot, clear that slot
      if (badgeId !== null) {
         const existingIdx = newShowcase.indexOf(badgeId);
         if (existingIdx !== -1) {
            newShowcase[existingIdx] = null;
         }
      }
      
      newShowcase[selectedSlotIndex] = badgeId;
      updateSettings({ showcaseBadges: newShowcase });
    }
    setIsShowcaseModalOpen(false);
  };

  /* 3D CARD ANIMATIONS (INLINE) */
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  
  const rotateX = useTransform(mouseY, [0, 1], [4, -4]);
  const rotateY = useTransform(mouseX, [0, 1], [-4, 4]);
  
  const springConfig = { damping: 25, stiffness: 200 }
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }
  
  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  /* 3D INSPECT MODAL ANIMATIONS */
  const [isInspecting, setIsInspecting] = React.useState(false);
  const [inspectBadge, setInspectBadge] = React.useState<any>(null);
  
  const inspectRotateX = useMotionValue(0);
  const inspectRotateY = useMotionValue(0);

  const inspectSpringX = useSpring(inspectRotateX, { damping: 50, stiffness: 150, mass: 1.5 });
  const inspectSpringY = useSpring(inspectRotateY, { damping: 50, stiffness: 150, mass: 1.5 });

  // Dynamic light source mapping based on physical rotation
  const lightPosX = useTransform(inspectSpringY, (y) => {
    let raw = y % 360;
    if (raw < 0) raw += 360;
    const angle = raw > 180 ? raw - 360 : raw; // -180 to 180
    // When tilted right (positive Y), highlight moves left
    return 50 - (angle * 0.8);
  });
  const lightPosY = useTransform(inspectSpringX, (x) => {
    // x is bounded -60 to 60 due to pointer constraints
    return 50 + (x * 0.8);
  });
  
  const backLightPosX = useTransform(inspectSpringY, (y) => {
    let raw = (y + 180) % 360;
    if (raw < 0) raw += 360;
    const angle = raw > 180 ? raw - 360 : raw;
    return 50 - (angle * 0.8);
  });

  const frontGlare = useMotionTemplate`radial-gradient(circle at ${lightPosX}% ${lightPosY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
  const backGlare = useMotionTemplate`radial-gradient(circle at ${backLightPosX}% ${lightPosY}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;

  const isDragging = React.useRef(false);
  const lastInteractionTime = React.useRef(Date.now());

  const handlePointerDown = () => {
    isDragging.current = true;
    lastInteractionTime.current = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    lastInteractionTime.current = Date.now();
    
    inspectRotateY.set(inspectRotateY.get() + e.movementX * 0.3);
    const nextX = inspectRotateX.get() - e.movementY * 0.3;
    inspectRotateX.set(Math.max(-60, Math.min(60, nextX)));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    lastInteractionTime.current = Date.now();
  };

  React.useEffect(() => {
    if (isInspecting) {
      inspectRotateX.set(0);
      inspectRotateY.set(0);
      isDragging.current = false;
      lastInteractionTime.current = Date.now();

      let animationFrameId: number;
      let lastTime = performance.now();
      
      const autoRotate = (time: number) => {
        const delta = time - lastTime;
        lastTime = time;
        
        // Eğer 1.5 saniyedir dokunulmuyorsa kendi kendine sergileme modunda dönsün
        if (!isDragging.current && Date.now() - lastInteractionTime.current > 1500) {
          const rotationSpeed = 0.015; // Yavaş ve premium dönüş hızı
          inspectRotateY.set(inspectRotateY.get() + (delta * rotationSpeed));
          
          // X eksenindeki yamukluğu da yavaşça 0'a çekerek dümdüz, kusursuz bir vitrin görünümü sağlayalım
          const currentX = inspectRotateX.get();
          if (Math.abs(currentX) > 0.1) {
            inspectRotateX.set(currentX * 0.95);
          }
        }
        
        animationFrameId = requestAnimationFrame(autoRotate);
      };
      
      animationFrameId = requestAnimationFrame(autoRotate);
      
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [isInspecting, inspectRotateX, inspectRotateY]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar relative bg-black/40 select-none">
      
      {/* Background Ornaments */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="pt-8 px-4 sm:px-6 lg:px-8 pb-6 relative z-10 w-full max-w-6xl mx-auto">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 text-emerald-400 mb-2">
              <Trophy className="w-5 h-5" />
              <span className="text-[11px] font-black tracking-[0.2em] uppercase">BAŞARIMLAR MEYDANI</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-4xl font-bold tracking-tight text-white mb-2">
              Profil & Sergi
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-zinc-400">
              Görevleri bitirdikçe deneyim (XP) kazan, seviye atla ve tüm efsane rozetleri koleksiyonuna ekle.
            </motion.p>
          </div>
        </div>
        
        {/* --- SHOWCASE SLOTS AT TOP --- */}
        <div className="mt-8 flex flex-col items-center justify-center relative z-20">
          <div className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4 text-center">Gurur Tablosu</div>
          <div className="flex gap-4">
             {showcaseBadges.map((badgeId, idx) => {
                const badge = badgeId ? BADGES.find(b => b.id === badgeId) : null;
                return (
                  <div 
                     key={idx} 
                     onClick={() => handleSlotClick(idx)}
                     className="group relative cursor-pointer"
                  >
                     {/* Tooltip */}
                     {badge && (
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-max max-w-[200px] bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 shadow-xl">
                           <p className="text-xs font-bold text-white mb-1">&ldquo;{badge.name}&rdquo;</p>
                           <p className="text-[10px] text-zinc-400">{badge.desc}</p>
                           <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-zinc-900 border-b border-r border-white/10" />
                        </div>
                     )}

                     {/* Slot */}
                     <div className={cn(
                        "w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2 overflow-hidden",
                        badge ? "bg-white/5 border-white/20 hover:border-white/40 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-white/[0.02] border-dashed border-white/10 hover:border-white/30 hover:bg-white/5"
                     )}>
                        {badge ? (
                           <>
                             {/* Badge View */}
                             <div className={cn("w-10 h-10 rounded-full flex items-center justify-center relative z-10", badge.color.replace('bg-', 'bg-').replace('-500', '-500/20').replace('-600', '-600/20').replace('-400', '-400/20'))}>
                               <badge.icon className={cn("w-5 h-5", badge.color.replace('bg-', 'text-'))} />
                             </div>
                           </>
                        ) : (
                           <div className="w-8 h-8 rounded-full border border-dashed border-white/20 flex flex-col items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                             <span className="text-[10px] font-bold text-white/50">+</span>
                           </div>
                        )}
                     </div>
                  </div>
                )
             })}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-24 relative z-10 w-full max-w-6xl mx-auto">
        
        {/* --- 3D PROFILE CARD --- */}
        <div 
          className="w-full flex justify-center mb-16 mt-4 relative"
          style={{ perspective: 1200 }}
        >
          <motion.div
            style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => setIsInspecting(true)}
            className="w-full max-w-3xl glass-card rounded-[32px] p-8 border border-white/10 relative overflow-hidden bg-gradient-to-br from-[#2d1b4e] via-[#0c0a18] to-[#1b153a] shadow-[0_0_80px_rgba(139,92,246,0.15)] group cursor-pointer"
          >
            {/* HOVER OVERLAY */}
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center">
               <ScanFace className="w-16 h-16 text-purple-400 mb-4 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] transform scale-90 group-hover:scale-100 transition-transform duration-500" />
               <span className="text-white font-bold tracking-[0.2em] uppercase text-sm drop-shadow-md">Tamamen Size Ozel Hazirledigimiz Kartiniza Bakin</span>
            </div>

            {/* Background Details */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 mix-blend-screen pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.10] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />

            <div className="flex flex-col md:flex-row items-center gap-10 position-relative z-10 transition-transform duration-500 group-hover:scale-[0.98]">
              {/* LEVEL BADGE */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full scale-150 transition-transform group-hover:scale-[2]" />
                <div className="w-32 h-32 rounded-full border-[6px] border-zinc-800 bg-[#0f0f13] flex items-center justify-center relative z-10 shadow-xl overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profil" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                  ) : null}
                  <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                    <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                    <circle cx="80" cy="80" r="70" stroke="url(#card-gradient)" strokeWidth="10" fill="none" strokeDasharray={2 * Math.PI * 70} strokeDashoffset={(2 * Math.PI * 70) * (1 - (stats.levelPercentage / 100))} strokeLinecap="round" />
                    <defs>
                      <linearGradient id="card-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="flex flex-col items-center relative z-10 drop-shadow-md">
                    <span className="text-[11px] font-bold tracking-[0.3em] text-zinc-400 uppercase mb-1">LvL</span>
                    <span className="text-4xl font-black text-white leading-none">{stats.level}</span>
                  </div>
                </div>
              </div>

              {/* USER INFO & XP */}
              <div className="flex-1 w-full text-center md:text-left flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 mb-2 justify-center md:justify-start bg-white/5 px-3 py-1.5 rounded-full border border-white/10 w-fit shrink-0 mx-auto md:mx-0">
                  <Hexagon className={`w-4 h-4 ${stats.rankColor}`} />
                  <span className={`text-xs font-bold tracking-[0.2em] ${stats.rankColor} uppercase`}>{stats.rankName}</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-4 flex items-center gap-3 justify-center md:justify-start">
                  {user?.displayName ? user.displayName.split(" ")[0].toUpperCase() : "FOCUSFLOW"} PROFILI
                  <Sparkles className="w-6 h-6 text-yellow-500/80" />
                </h2>

                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 w-full shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">Toplam XP</span>
                      <span className="text-xl font-black text-white">{stats.totalXP.toLocaleString()} <span className="text-sm text-zinc-500 font-bold">XP</span></span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">Sonraki Sv.</span>
                      <span className="text-sm font-black text-emerald-400">{stats.requiredForNext - stats.progressInLevel} <span className="text-zinc-500 text-xs">kaldi</span></span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.levelPercentage}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.05] grid grid-cols-2 md:grid-cols-4 gap-4" style={{ transform: "translateZ(20px)" }}>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Aktif Gun</div>
                <div className="text-2xl font-black text-white">{stats.activeDays}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Tamamlanan</div>
                <div className="text-2xl font-black text-white">{stats.completedTotal}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Seri (Streak)</div>
                <div className="text-2xl font-black text-orange-400 flex items-center gap-1">
                  {stats.currentStreak}
                  {stats.currentStreak > 0 && <Flame className="w-4 h-4 text-orange-500 inline" />}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Odak (Dk)</div>
                <div className="text-2xl font-black text-blue-400">{stats.focusMinsTotal}</div>
              </div>
            </div>

          </motion.div>
        </div>


        {/* --- BADGES GALLERY (CATEGORY BASED) --- */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-zinc-400" />
            <h2 className="text-[14px] font-bold tracking-widest text-zinc-300 uppercase">Rozetler Sergi Alani</h2>
          </div>
          <div className="text-[11px] font-bold tracking-widest text-zinc-500 glass-badge px-3 py-1 rounded-full uppercase">
            {badges.filter(b => b.unlocked).length} / {badges.length} Kazanildi
          </div>
        </div>

        {/* Category Sections */}
        {([
          { key: "tasks", title: "Gorev Tamamlama", subtitle: "Gorevleri tamamlayarak yuksel", icon: Sword, gradient: "from-blue-500/20 to-indigo-500/10", accent: "text-blue-400", border: "border-blue-500/20" },
          { key: "streak", title: "Seri Kaydi", subtitle: "Kesintisiz calisma serini koru", icon: Flame, gradient: "from-orange-500/20 to-amber-500/10", accent: "text-orange-400", border: "border-orange-500/20" },
          { key: "focus", title: "Odaklanma", subtitle: "Odak modunda gecirilen sure", icon: Eye, gradient: "from-teal-500/20 to-emerald-500/10", accent: "text-teal-400", border: "border-teal-500/20" },
          { key: "subtasks", title: "Alt Gorevler", subtitle: "Gorevleri parcalayarak coz", icon: ListTodo, gradient: "from-lime-500/20 to-green-500/10", accent: "text-lime-400", border: "border-lime-500/20" },
          { key: "time", title: "Zaman Dilimi", subtitle: "Farkli saatlerde uretken ol", icon: Clock, gradient: "from-sky-500/20 to-blue-500/10", accent: "text-sky-400", border: "border-sky-500/20" },
          { key: "economy", title: "Para Biriktirme", subtitle: "Focus Para biriktir ve zenginles", icon: Star, gradient: "from-yellow-500/20 to-amber-500/10", accent: "text-yellow-400", border: "border-yellow-500/20" },
          { key: "projects", title: "Projeler", subtitle: "Projelerini yonet ve tamamla", icon: Layers, gradient: "from-purple-500/20 to-violet-500/10", accent: "text-purple-400", border: "border-purple-500/20" },
          { key: "social", title: "Sosyal", subtitle: "Toplulukta arkadas edin", icon: HeartHandshake, gradient: "from-pink-500/20 to-rose-500/10", accent: "text-pink-400", border: "border-pink-500/20" },
          { key: "shop", title: "Magaza", subtitle: "Magazadan alisveris yap", icon: ShoppingBag, gradient: "from-amber-500/20 to-orange-500/10", accent: "text-amber-400", border: "border-amber-500/20" },
        ] as const).map((cat, catIdx) => {
          const catBadges = badges.filter(b => b.category === cat.key);
          const catUnlocked = catBadges.filter(b => b.unlocked).length;
          if (catBadges.length === 0) return null;
          const CatIcon = cat.icon;

          return (
            <motion.div 
              key={cat.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + catIdx * 0.05 }}
              className="mb-12"
            >
              {/* Category Header */}
              <div className={`flex items-center gap-4 mb-6 p-4 rounded-2xl bg-gradient-to-r ${cat.gradient} border ${cat.border} backdrop-blur-sm`}>
                <div className={`w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center`}>
                  <CatIcon className={`w-6 h-6 ${cat.accent}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-black tracking-tight text-white`}>{cat.title}</h3>
                  <p className="text-xs text-zinc-400">{cat.subtitle}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${cat.accent}`}>{catUnlocked}<span className="text-zinc-500 text-sm font-bold">/{catBadges.length}</span></div>
                  <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Kazanildi</div>
                </div>
              </div>

              {/* Category Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                {[...catBadges].sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1)).map((badge, idx) => {
                  const T = getTheme(badge);

                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.05 + (idx * 0.03) }}
                      onClick={() => {
                        if (badge.unlocked) {
                          setInspectBadge({ ...badge, suffix: badge.label });
                        }
                      }}
                      className={cn(
                        "relative w-full aspect-[5/7] min-h-[280px] rounded-[2rem] p-[2px] transition-all duration-300 group",
                        badge.unlocked ? "cursor-pointer hover:-translate-y-2 hover:shadow-2xl z-10 hover:z-20" : "opacity-75 grayscale saturate-50"
                      )}
                      style={{ 
                        boxShadow: badge.unlocked ? `0 10px 40px -10px ${T.glowColor}, inset 0 0 0 1px ${T.cardBorder}` : 'none'
                      }}
                    >
                      {/* Simulated Border Gradient */}
                      {badge.unlocked && (
                         <div 
                           className="absolute inset-0 rounded-[2rem] opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                           style={{ background: `linear-gradient(135deg, ${T.cardBorder}, transparent, ${T.cardBorder})` }}
                         />
                      )}
                      
                      <div 
                        className={cn(
                          "relative w-full h-full rounded-[1.9rem] flex flex-col items-center justify-center p-4 text-center overflow-hidden transition-all duration-500",
                          !badge.unlocked && "bg-[#050508] border backdrop-blur-md"
                        )}
                        style={{ 
                          background: badge.unlocked ? T.cardBg : `linear-gradient(160deg, rgba(8,8,12,0.9) 0%, rgba(3,3,5,0.95) 100%)`,
                          borderColor: badge.unlocked ? 'transparent' : T.cardBorder.replace('0.35', '0.08'),
                          boxShadow: !badge.unlocked ? `inset 0 0 20px ${T.glowColor.replace('0.4', '0.02')}` : 'none'
                        }}
                      >
                        {badge.unlocked && (
                          <>
                            <div className={`absolute inset-1.5 border ${T.innerBorder} rounded-[1.6rem] z-0 opacity-50`} />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />
                          </>
                        )}

                        <div className="flex flex-col items-center justify-center z-20 w-full h-full relative p-2 md:p-3">
                          {/* Main Trophy Icon */}
                          <div className="relative mb-0 transform scale-75 origin-top mt-2">
                             {badge.unlocked && (
                               <div className={`absolute inset-0 ${T.pulseGlow} blur-[20px] rounded-full scale-150 opacity-70`} />
                             )}
                             
                             <div className={cn(
                                "relative w-24 h-24 rounded-full p-[2px] transition-all duration-500", 
                                badge.unlocked ? `bg-gradient-to-br ${T.trophyGrad}` : "bg-white/5 group-hover:bg-white/10"
                             )} style={{ boxShadow: badge.unlocked ? `0 0 40px ${T.trophyShadow}` : `0 0 20px ${T.trophyShadow.replace('0.6', '0.05')}` }}>
                                <div className={cn(
                                   "w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center relative overflow-hidden transition-colors duration-500",
                                )}>
                                   {badge.unlocked && (
                                     <>
                                       <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent skew-y-12" />
                                       <div className={`absolute inset-0 bg-gradient-to-t ${T.trophyInner} to-transparent`} />
                                     </>
                                   )}
                                   
                                   {badge.unlocked ? (
                                     <badge.icon className={`w-10 h-10 ${T.icoCol}`} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 15px ${T.icoDrop})` }} />
                                   ) : (
                                     <div className="relative flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                                        <badge.icon className={`w-10 h-10 ${T.icoCol}`} strokeWidth={1.2} style={{ filter: 'grayscale(0.6) brightness(0.8)' }} />
                                        <Lock className="absolute inset-0 m-auto w-4 h-4 text-white/50" strokeWidth={2.5} />
                                     </div>
                                   )}
                                </div>
                             </div>
                             
                             {/* Floating symbols */}
                             {badge.unlocked && (
                               <>
                                 <div className="absolute -top-3 -right-3">
                                   <Sparkles className={`w-8 h-8 ${T.spark}`} style={{ filter: `drop-shadow(0 0 10px ${T.sparkDrop})` }} />
                                 </div>
                                 <div className="absolute -bottom-1 -left-4">
                                   <Star className={`w-7 h-7 ${T.botStar}`} style={{ filter: `drop-shadow(0 0 10px ${T.botStarDrop})` }} />
                                 </div>
                               </>
                             )}
                          </div>

                          <h3 className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase mb-1">
                            {badge.unlocked ? "BASARIM!" : "KILITLI"}
                          </h3>

                          <h2 className={cn(
                            "text-base font-black text-center leading-relaxed mb-2 py-1 w-full px-1 break-words transition-colors duration-500",
                            badge.unlocked ? `text-transparent bg-clip-text bg-gradient-to-b ${T.titleText} drop-shadow-lg` : "text-white/20 group-hover:text-white/40"
                          )}>
                            "{badge.name}"
                          </h2>
                          
                          <div className={`w-10 h-[2px] ${badge.unlocked ? T.divider : "bg-zinc-700"} rounded-full mb-auto`} />

                          <div className="w-full mt-auto mb-1 px-4">
                            {badge.unlocked ? (
                              <p className={`text-[10px] font-medium ${T.descColor} text-center line-clamp-2 leading-relaxed`}>
                                {badge.desc}
                              </p>
                            ) : (
                              <>
                                <p className="text-[9px] text-zinc-600 group-hover:text-zinc-400 transition-colors duration-500 text-center line-clamp-1 mb-2 uppercase tracking-widest">
                                    HEDEF: {badge.target} {badge.label}
                                </p>
                                <div className="flex items-end justify-between font-bold mb-1 px-1">
                                  <span className="text-[9px] text-zinc-500 group-hover:text-zinc-400 transition-colors duration-500 tracking-widest uppercase">
                                    {badge.remaining} {badge.label} KALDI
                                  </span>
                                  <span className={`text-[10px] ${T.icoCol} opacity-40 group-hover:opacity-80 transition-opacity`}>
                                    %{Math.floor(badge.progress)}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                                  <motion.div 
                                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className={`absolute inset-0 w-full h-full ${T.blurRing}`}
                                  />
                                  <div
                                    className="h-full rounded-full relative z-10 transition-all duration-1000 ease-out"
                                    style={{ width: `${badge.progress}%`, background: `linear-gradient(90deg, transparent, ${T.cardBorder.replace('0.35', '0.6')})`, boxShadow: `0 0 10px ${T.glowColor}` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* --- FULLSCREEN INSPECT MODAL --- */}
      <AnimatePresence>
        {isInspecting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020205] touch-none select-none cursor-grab active:cursor-grabbing overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ perspective: 3000 }}
          >
            {/* Museum / Showcase Ambient Lighting Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Spotlights */}
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], x: [0, 50, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/30 blur-[120px]" 
                />
                <motion.div 
                    animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1], y: [0, -50, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-purple-600/30 blur-[120px]" 
                />
                <motion.div 
                    animate={{ opacity: [0.05, 0.15, 0.05], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-[20%] left-[40%] w-[30%] h-[30%] rounded-full bg-indigo-500/30 blur-[100px]" 
                />
                
                {/* Grid Floor/Wall pattern for depth */}
                <div className="absolute inset-0 opacity-20 transition-opacity" style={{ backgroundImage: "radial-gradient(circle at center, transparent 0%, #020205 80%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,1)'/%3E%3C/svg%3E\")" }} />
            </div>
            <button
              onClick={() => setIsInspecting(false)}
              className="absolute top-8 right-8 z-50 bg-white/10 hover:bg-white/20 text-white w-12 h-12 flex items-center justify-center rounded-full transition-all hover:scale-110 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="absolute top-10 w-full text-center pointer-events-none fade-in">
              <h2 className="text-white/50 tracking-[0.5em] uppercase text-sm font-black drop-shadow-xl animate-pulse">KARTI ÇEVİRMEK İÇİN BASILI TUTUP SÜRÜKLEYİN</h2>
            </div>

            <motion.div
              style={{ rotateX: inspectSpringX, rotateY: inspectSpringY, transformStyle: "preserve-3d" }}
              className="w-full max-w-[800px] aspect-[16/9] relative transform-gpu"
            >
              {/* === SOLID VOLUME LAYERS (REAL 3D THICKNESS) === */}
              {/* Reduced from 40 layers to 10 (25% thickness) for an acrylic slab feel */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={`volume-${i}`} 
                  className="absolute inset-0 rounded-[40px] bg-[#110e1f] pointer-events-none border border-white/[0.04]" 
                  style={{ 
                    transform: `translateZ(${-5 + i}px)`, 
                    boxShadow: i === 0 || i === 9 ? '0 0 20px rgba(0,0,0,0.5)' : 'none' 
                  }} 
                />
              ))}

              {/* === FRONT FACE === */}
              <div 
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden", transform: "translateZ(5px)", transformStyle: "preserve-3d" }}
              >
                {/* Physical Card Base (with overflow-hidden for overlays) */}
                <div className="absolute inset-0 glass-card rounded-[40px] border border-white/10 overflow-hidden bg-gradient-to-br from-[#2d1b4e] via-[#0c0a18] to-[#1b153a] shadow-[0_0_100px_rgba(139,92,246,0.5)]">
                  <motion.div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ background: frontGlare }} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 mix-blend-screen pointer-events-none" />
                  <div className="absolute inset-0 opacity-[0.10] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
                </div>

                {/* 3D Popping Content (No overflow hidden!) */}
                <div className="absolute inset-0 p-10 flex flex-col md:flex-row items-center gap-12 h-full" style={{ transformStyle: "preserve-3d", transform: "translateZ(8px)" }}>
                  
                  {/* Avatar & Ring (Pops out even more) */}
                  <div className="relative group shrink-0" style={{ transform: "translateZ(6px)" }}>
                    <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full scale-[1.8] animate-pulse" />
                    <div className="w-40 h-40 rounded-full border-[6px] border-zinc-800 bg-[#0f0f13] flex items-center justify-center relative shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profil" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                      ) : null}
                      
                      <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none drop-shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                        <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                        <circle cx="80" cy="80" r="70" stroke="url(#modal-gradient)" strokeWidth="10" fill="none" strokeDasharray={2 * Math.PI * 70} strokeDashoffset={(2 * Math.PI * 70) * (1 - (stats.levelPercentage / 100))} strokeLinecap="round" />
                        <defs>
                          <linearGradient id="modal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="flex flex-col items-center relative z-10 drop-shadow-md">
                        <span className="text-sm font-bold tracking-[0.3em] text-zinc-400 uppercase mb-1">LvL</span>
                        <span className="text-6xl font-black text-white leading-none">{stats.level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Texts (Pops out separately) */}
                  <div className="flex-1 w-full text-center md:text-left flex flex-col justify-center gap-4" style={{ transformStyle: "preserve-3d" }}>
                    <div style={{ transform: "translateZ(2px)" }} className="inline-flex items-center gap-3 justify-center md:justify-start bg-white/5 px-4 py-2 rounded-full border border-white/10 w-fit drop-shadow-sm">
                      <Hexagon className={`w-5 h-5 ${stats.rankColor}`} />
                      <span className={`text-sm font-black tracking-[0.25em] ${stats.rankColor} uppercase`}>{stats.rankName}</span>
                    </div>
                    
                    <h2 style={{ transform: "translateZ(4px)" }} className="text-4xl lg:text-5xl font-black text-white tracking-tight flex items-center gap-4 justify-center md:justify-start drop-shadow-lg">
                      {user?.displayName ? user.displayName.split(" ")[0].toUpperCase() : "FOCUSFLOW"} KİMLİĞİ
                      <Sparkles className="w-8 h-8 text-yellow-500" />
                    </h2>

                    <div style={{ transform: "translateZ(2px)" }} className="bg-black/50 border border-white/10 rounded-2xl p-6 w-full mt-2 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">Toplam XP</span>
                          <span className="text-3xl font-black text-white drop-shadow-md">{stats.totalXP.toLocaleString()} <span className="text-lg text-zinc-500 font-bold">XP</span></span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">Sonraki Sv.</span>
                          <span className="text-xl font-black text-emerald-400 drop-shadow-md">{(stats.requiredForNext - stats.progressInLevel).toLocaleString()} <span className="text-zinc-500 text-sm">kaldı</span></span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" style={{ width: `${stats.levelPercentage}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* === BACK FACE === */}
              <div 
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg) translateZ(5px)", transformStyle: "preserve-3d" }}
              >
                {/* Physical Card Base */}
                <div className="absolute inset-0 glass-card rounded-[40px] border border-white/10 overflow-hidden bg-gradient-to-tl from-[#2d1b4e] via-[#0c0a18] to-[#1b153a] shadow-[0_0_100px_rgba(139,92,246,0.5)]">
                  <motion.div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ background: backGlare }} />
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                </div>

                {/* 3D Popping Content */}
                <div className="absolute inset-0 p-10 flex flex-col justify-between h-full" style={{ transformStyle: "preserve-3d", transform: "translateZ(8px)" }}>
                  
                  {/* Top Row */}
                  <div className="flex justify-between items-start" style={{ transform: "translateZ(2px)" }}>
                    <div className="flex items-center gap-3 opacity-50 drop-shadow-md">
                      <img src="/logo.png" alt="Logo" className="w-12 h-12 grayscale brightness-200 contrast-125 object-contain" />
                      <span className="text-3xl font-black tracking-tighter">FOCUSFLOW</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mb-1">Kayıt Tarihi</div>
                      <div className="text-sm text-zinc-300 font-mono">
                        {user?.metadata?.creationTime ? format(new Date(user.metadata.creationTime), "MM/yyyy") : "2024"}
                      </div>
                    </div>
                  </div>

                  {/* Middle Stats Grid */}
                  <div className="grid grid-cols-4 gap-6 w-full max-w-2xl mx-auto my-auto" style={{ transform: "translateZ(6px)" }}>
                     <div className="flex flex-col items-center bg-[#151522] p-5 rounded-2xl border border-white/5 shadow-lg hover:scale-105 transition-transform">
                        <CalendarDays className="w-8 h-8 text-zinc-400 mb-2 opacity-80" />
                        <div className="text-4xl font-black text-white drop-shadow-sm">{stats.activeDays}</div>
                        <div className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mt-2">Aktif Gün</div>
                     </div>
                     <div className="flex flex-col items-center bg-[#151522] p-5 rounded-2xl border border-white/5 shadow-lg hover:scale-105 transition-transform">
                        <Target className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                        <div className="text-4xl font-black text-white drop-shadow-sm">{stats.completedTotal}</div>
                        <div className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mt-2">Tamamlanan</div>
                     </div>
                     <div className="flex flex-col items-center bg-[#151522] p-5 rounded-2xl border border-white/5 shadow-lg hover:scale-105 transition-transform">
                        <Flame className="w-8 h-8 text-orange-500 mb-2 opacity-80" />
                        <div className="text-4xl font-black text-white drop-shadow-sm">{stats.currentStreak}</div>
                        <div className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mt-2">Seri (Streak)</div>
                     </div>
                     <div className="flex flex-col items-center bg-[#151522] p-5 rounded-2xl border border-white/5 shadow-lg hover:scale-105 transition-transform">
                        <Eye className="w-8 h-8 text-blue-500 mb-2 opacity-80" />
                        <div className="text-4xl font-black text-white drop-shadow-sm">{stats.focusMinsTotal}</div>
                        <div className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mt-2">Odak (Dk)</div>
                     </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-end border-t border-white/10 pt-6 mt-auto" style={{ transform: "translateZ(2px)" }}>
                    <div className="flex flex-col drop-shadow-md">
                       <span className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mb-1">Eşsiz Tanımlayıcı</span>
                       <span className="text-lg text-zinc-300 font-mono tracking-widest">
                         FF-{stats.completedTotal.toString().padStart(4, '0')}-{(user?.uid ? user.uid.substring(0,8).toUpperCase() : (stats.totalXP * 7).toString().substring(0,6))}
                       </span>
                    </div>
                    {/* Simulated Barcode */}
                    <div className="flex h-10 gap-[2px] opacity-30 drop-shadow-sm">
                      {Array.from({length: 40}).map((_, i) => (
                         <div key={i} className="bg-white h-full" style={{ width: Math.random() > 0.5 ? '2px' : '4px', opacity: Math.random() }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShowcaseModalOpen && (
           <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-4 sm:p-0"
              onClick={() => setIsShowcaseModalOpen(false)}
           >
              <motion.div 
                 initial={{ y: "100%", scale: 0.95 }}
                 animate={{ y: 0, scale: 1 }}
                 exit={{ y: "100%", scale: 0.95 }}
                 transition={{ type: "spring", damping: 25, stiffness: 300 }}
                 onClick={(e) => e.stopPropagation()}
                 className="w-full max-w-2xl bg-[#0c0a18] border border-white/10 rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative"
              >
                 {/* Decorative background in modal */}
                 <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 mix-blend-screen" />
                 
                 <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0c0a18]/80 backdrop-blur-xl z-20">
                    <div>
                       <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          Rozet Seçiniz <Sparkles className="w-4 h-4 text-yellow-500" />
                       </h3>
                       <p className="text-xs text-zinc-400 mt-1">Gurur tablonuzda sergilemek istediğiniz rozeti seçin.</p>
                    </div>
                    <button onClick={() => setIsShowcaseModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors relative z-20">
                       <X className="w-5 h-5 text-white/70" />
                    </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10">
                    <div 
                      onClick={() => handleSelectBadgeForSlot(null)}
                      className="w-full mb-6 p-4 rounded-2xl border border-dashed border-red-500/30 hover:border-red-500/60 bg-red-400/5 hover:bg-red-400/10 cursor-pointer flex items-center justify-center gap-3 transition-colors text-red-400"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="font-semibold text-sm">Bu slotu boş bırak</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                       {badges.map((b) => {
                          const isSelected = showcaseBadges.includes(b.id);
                          return (
                             <div 
                                key={b.id}
                                onClick={() => { if(b.unlocked && !isSelected) handleSelectBadgeForSlot(b.id) }}
                                className={cn(
                                   "p-4 rounded-3xl border flex flex-col items-center justify-center text-center transition-all duration-300 relative",
                                   b.unlocked ? (isSelected ? "border-purple-500/50 bg-purple-500/10 cursor-not-allowed" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 cursor-pointer hover:shadow-xl hover:-translate-y-1") : "border-white/5 bg-black/20 opacity-40 cursor-not-allowed grayscale"
                                )}
                             >
                                {isSelected && (
                                   <div className="absolute top-2 right-2 p-1.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                   </div>
                                )}
                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", b.color.replace('bg-', 'bg-').replace('-500', '-500/20').replace('-600', '-600/20').replace('-400', '-400/20'))}>
                                   <b.icon className={cn("w-6 h-6", b.color.replace('bg-', 'text-'))} />
                                </div>
                                <h4 className="text-[13px] font-bold text-white mb-1 leading-tight line-clamp-1 break-words px-1">{b.name}</h4>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{b.unlocked ? "Kazanıldı" : "Kilitli"}</p>
                             </div>
                          )
                       })}
                    </div>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      <AchievementModal 
          badge={inspectBadge} 
          onClose={() => setInspectBadge(null)} 
          forceReveal={true}
      />
    </div>
  )
}
