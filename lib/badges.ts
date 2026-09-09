import {
  Sword, Activity, Target, Award, Medal, Crown, Hexagon, Trophy,
  Flame, Zap, CalendarDays, Shield, Navigation, Sparkles, Clock, Star,
  ScanFace, Eye, ListTodo, ShoppingBag, HeartHandshake,
  Sunrise, Layers, Rocket, Coffee, Moon,
  Gem, Compass, BookOpen, Boxes, Sun,
  Coins, Banknote, PiggyBank, Wallet, CircleDollarSign, BadgeDollarSign,
  Swords, Skull, Ghost, Brain, Dumbbell, Timer, PartyPopper,
  Users, UserPlus, Heart, MessageCircle,
  Package, Gift, Dice1, Cherry, Diamond,
  FolderCheck, FolderOpen, Briefcase
} from "lucide-react"

export interface BadgeDefinition {
  id: string
  name: string
  desc: string
  label: string
  icon: any
  color: string
  target: number
  category: "tasks" | "streak" | "focus" | "subtasks" | "time" | "social" | "shop" | "projects" | "economy"
  rewardCoins: number
}

export const BADGES: BadgeDefinition[] = [
  // ── Gorev Tamamlama (Task Master) ──
  { id: "first_blood", name: "Ilk Kan", desc: "Tebrikler, ilk gorevini tamamladin.", label: "gorev", icon: Sword, color: "bg-blue-500", target: 1, category: "tasks", rewardCoins: 50 },
  { id: "task_10", name: "Isinan Motorlar", desc: "Toplam 10 gorev tamamla.", label: "gorev", icon: Activity, color: "bg-blue-400", target: 10, category: "tasks", rewardCoins: 100 },
  { id: "novice", name: "Acemi Savasci", desc: "Toplam 25 gorev tamamla.", label: "gorev", icon: Target, color: "bg-emerald-500", target: 25, category: "tasks", rewardCoins: 150 },
  { id: "task_50", name: "Deneyimli Cirak", desc: "Toplam 50 gorev tamamla.", label: "gorev", icon: Award, color: "bg-teal-500", target: 50, category: "tasks", rewardCoins: 250 },
  { id: "century", name: "Yuzbasi", desc: "Toplam 100 gorev tamamla.", label: "gorev", icon: Medal, color: "bg-purple-500", target: 100, category: "tasks", rewardCoins: 400 },
  { id: "task_250", name: "Usta Savasci", desc: "Toplam 250 gorev tamamla.", label: "gorev", icon: Crown, color: "bg-indigo-500", target: 250, category: "tasks", rewardCoins: 600 },
  { id: "boss", name: "Zamanin Efendisi", desc: "Toplam 500 gorev tamamla.", label: "gorev", icon: Hexagon, color: "bg-rose-500", target: 500, category: "tasks", rewardCoins: 1000 },
  { id: "task_1000", name: "Efsanevi Titan", desc: "Toplam 1000 gorev tamamla.", label: "gorev", icon: Trophy, color: "bg-amber-500", target: 1000, category: "tasks", rewardCoins: 2000 },
  { id: "task_2000", name: "Olumsuz Ustat", desc: "Toplam 2000 gorev tamamla.", label: "gorev", icon: Rocket, color: "bg-fuchsia-600", target: 2000, category: "tasks", rewardCoins: 3500 },
  { id: "task_3000", name: "Kozmik Savasci", desc: "Toplam 3000 gorev tamamla. Galaksiler senin onunde egilir.", label: "gorev", icon: Swords, color: "bg-violet-600", target: 3000, category: "tasks", rewardCoins: 5000 },
  { id: "task_5000", name: "Galaktik Fatih", desc: "Toplam 5000 gorev tamamla. Evrende esine rastlanmaz bir azim.", label: "gorev", icon: Skull, color: "bg-red-600", target: 5000, category: "tasks", rewardCoins: 8000 },
  { id: "task_10000", name: "Evrenin Hakimi", desc: "Toplam 10000 gorev! Sen artik bir efsanesin.", label: "gorev", icon: Ghost, color: "bg-amber-600", target: 10000, category: "tasks", rewardCoins: 15000 },

  // ── Seri (Streak) Serisi ──
  { id: "streak_3", name: "Isinma Turu", desc: "3 gun ust uste gorev tamamla.", label: "gun", icon: Flame, color: "bg-orange-500", target: 3, category: "streak", rewardCoins: 60 },
  { id: "streak_7", name: "Durdurulamaz", desc: "7 gun seriyi bozma.", label: "gun", icon: Zap, color: "bg-yellow-500", target: 7, category: "streak", rewardCoins: 150 },
  { id: "streak_14", name: "Istikrarli Duzen", desc: "14 gun seriyi koru.", label: "gun", icon: CalendarDays, color: "bg-amber-600", target: 14, category: "streak", rewardCoins: 300 },
  { id: "streak_30", name: "Yari Tanri", desc: "30 gun seriyi koru.", label: "gun", icon: Shield, color: "bg-red-500", target: 30, category: "streak", rewardCoins: 600 },
  { id: "streak_60", name: "Sarsilmaz Irade", desc: "60 gun seriyi bozma.", label: "gun", icon: Navigation, color: "bg-rose-600", target: 60, category: "streak", rewardCoins: 1200 },
  { id: "streak_100", name: "Aliskanlik Canavari", desc: "100 gun seriyi bozma.", label: "gun", icon: Sparkles, color: "bg-fuchsia-500", target: 100, category: "streak", rewardCoins: 2500 },
  { id: "streak_180", name: "Yarim Yil Efsanesi", desc: "180 gun kesintisiz seriyi tamamla.", label: "gun", icon: Crown, color: "bg-cyan-500", target: 180, category: "streak", rewardCoins: 4000 },
  { id: "streak_365", name: "Altin Yil", desc: "365 gun tam bir yil seriyi koru!", label: "gun", icon: Trophy, color: "bg-amber-400", target: 365, category: "streak", rewardCoins: 10000 },
  { id: "streak_500", name: "Yarim Bin Efsane", desc: "500 gun boyunca seriyi koru. Inanilmaz!", label: "gun", icon: Dumbbell, color: "bg-emerald-600", target: 500, category: "streak", rewardCoins: 15000 },
  { id: "streak_730", name: "Cift Yil Efsanesi", desc: "730 gun, tam 2 yil kesintisiz seri! Tanrisal irade.", label: "gun", icon: Star, color: "bg-yellow-400", target: 730, category: "streak", rewardCoins: 25000 },

  // ── Odaklanma & Zaman (Focus & Time) ──
  { id: "focus_30", name: "Ufak Konsantrasyon", desc: "Sistemde 30 dk odaklan.", label: "dk", icon: ScanFace, color: "bg-teal-400", target: 30, category: "focus", rewardCoins: 50 },
  { id: "focus_120", name: "Akisin Icinde", desc: "Toplam 2 saat odaklan.", label: "dk", icon: Coffee, color: "bg-blue-400", target: 120, category: "focus", rewardCoins: 100 },
  { id: "focus_300", name: "Zihin Dalisi", desc: "Toplam 300 dk (5 saat) odaklan.", label: "dk", icon: Eye, color: "bg-teal-500", target: 300, category: "focus", rewardCoins: 200 },
  { id: "focus_1000", name: "Derin Odak", desc: "Toplam 1000 dk odaklan.", label: "dk", icon: ScanFace, color: "bg-emerald-600", target: 1000, category: "focus", rewardCoins: 500 },
  { id: "focus_3000", name: "Zen Ustasi", desc: "Toplam 3000 dk (50 saat) odaklan.", label: "dk", icon: Sparkles, color: "bg-green-500", target: 3000, category: "focus", rewardCoins: 1200 },
  { id: "focus_6000", name: "Trans Hali", desc: "Toplam 100 saat odak suresine ulas.", label: "dk", icon: Compass, color: "bg-indigo-600", target: 6000, category: "focus", rewardCoins: 2500 },
  { id: "focus_12000", name: "Meditasyon Ustasi", desc: "Toplam 200 saat odaklanma. Zihnin berrak bir golet gibi.", label: "dk", icon: Brain, color: "bg-purple-600", target: 12000, category: "focus", rewardCoins: 4000 },
  { id: "focus_30000", name: "Zaman Bukucu", desc: "Toplam 500 saat odak! Zaman senin icin farkli akar.", label: "dk", icon: Timer, color: "bg-fuchsia-600", target: 30000, category: "focus", rewardCoins: 8000 },
  { id: "focus_60000", name: "Kozmik Bilinc", desc: "Toplam 1000 saat odak. Evrenle bir oldun.", label: "dk", icon: Eye, color: "bg-amber-500", target: 60000, category: "focus", rewardCoins: 15000 },

  // ── Alt Gorevler (Subtasks) ──
  { id: "subtask_10", name: "Parcalama Sanati", desc: "10 alt gorev tamamla.", label: "alt gorev", icon: ListTodo, color: "bg-lime-400", target: 10, category: "subtasks", rewardCoins: 50 },
  { id: "subtask_50", name: "Bolen ve Yoneten", desc: "50 alt gorev tamamla.", label: "alt gorev", icon: ListTodo, color: "bg-lime-500", target: 50, category: "subtasks", rewardCoins: 150 },
  { id: "subtask_100", name: "Detayci", desc: "100 alt gorev tamamla.", label: "alt gorev", icon: ListTodo, color: "bg-lime-600", target: 100, category: "subtasks", rewardCoins: 300 },
  { id: "subtask_250", name: "Mimari Zihin", desc: "250 alt gorev tamamla.", label: "alt gorev", icon: Boxes, color: "bg-emerald-600", target: 250, category: "subtasks", rewardCoins: 600 },
  { id: "subtask_500", name: "Mikro Yonetici", desc: "500 alt gorev tamamla.", label: "alt gorev", icon: ListTodo, color: "bg-green-500", target: 500, category: "subtasks", rewardCoins: 1200 },
  { id: "subtask_1000", name: "Atom Parcalayici", desc: "1000 alt gorev tamamla. Her detay senin kontrolunde.", label: "alt gorev", icon: Boxes, color: "bg-teal-600", target: 1000, category: "subtasks", rewardCoins: 2500 },
  { id: "subtask_2500", name: "Kuantum Muhendisi", desc: "2500 alt gorev! Detaylarin efendisi.", label: "alt gorev", icon: Brain, color: "bg-indigo-600", target: 2500, category: "subtasks", rewardCoins: 5000 },

  // ── Zaman Dilimi & Ritueller (Time of Day) ──
  { id: "early_bird", name: "Erkenci Kus", desc: "Sabah (05:00-09:00) arasi 10 gorev bitir.", label: "gorev", icon: Sunrise, color: "bg-sky-500", target: 10, category: "time", rewardCoins: 150 },
  { id: "night_owl", name: "Gece Kusu", desc: "Gece (22:00-03:00) arasi 10 gorev bitir.", label: "gorev", icon: Moon, color: "bg-indigo-500", target: 10, category: "time", rewardCoins: 150 },
  { id: "noon_hunter", name: "Ogle Avcisi", desc: "Oglen (12:00-14:00) arasi 15 gorev bitir.", label: "gorev", icon: Sun, color: "bg-amber-500", target: 15, category: "time", rewardCoins: 150 },
  { id: "night_hunter", name: "Gece Avcisi", desc: "Gece vakti toplam 50 gorev tamamla.", label: "gorev", icon: Moon, color: "bg-violet-600", target: 50, category: "time", rewardCoins: 400 },
  { id: "early_master", name: "Safak Ustasi", desc: "Sabah vakti toplam 50 gorev tamamla.", label: "gorev", icon: Sunrise, color: "bg-orange-500", target: 50, category: "time", rewardCoins: 400 },
  { id: "marathon_runner", name: "Maraton Kosucu", desc: "Tek bir gunde 10 veya daha fazla gorev tamamla.", label: "gorev", icon: Dumbbell, color: "bg-red-500", target: 1, category: "time", rewardCoins: 300 },

  // ── Projeler & Gruplama (Projects & Organization) ──
  { id: "project_1", name: "Girisimci Ruh", desc: "Ilk projeni olustur ve baslat.", label: "proje", icon: BookOpen, color: "bg-violet-500", target: 1, category: "projects", rewardCoins: 100 },
  { id: "project_5", name: "Vizyoner", desc: "En az 3 farkli proje yonet.", label: "proje", icon: Layers, color: "bg-purple-600", target: 3, category: "projects", rewardCoins: 250 },
  { id: "group_master", name: "Organizasyon Dahisi", desc: "Ozel gorev gruplari olustur ve kullan.", label: "grup", icon: Boxes, color: "bg-cyan-500", target: 2, category: "projects", rewardCoins: 150 },
  { id: "project_10", name: "Portfoy Yoneticisi", desc: "10 farkli proje yonet. Cok yonlu bir lider.", label: "proje", icon: Briefcase, color: "bg-indigo-600", target: 10, category: "projects", rewardCoins: 500 },
  { id: "project_complete", name: "Proje Bitirici", desc: "Bir projedeki tum gorevleri tamamla.", label: "proje", icon: FolderCheck, color: "bg-emerald-500", target: 1, category: "projects", rewardCoins: 350 },

  // ── Sosyal & Topluluk (Social & Community) ──
  { id: "social_first_friend", name: "Yoldas", desc: "Toplulukta ilk arkadasini ekle.", label: "arkadas", icon: HeartHandshake, color: "bg-pink-500", target: 1, category: "social", rewardCoins: 100 },
  { id: "social_circle", name: "Genis Cevre", desc: "5 arkadas edin ve lider tablosunda yaris.", label: "arkadas", icon: HeartHandshake, color: "bg-rose-500", target: 5, category: "social", rewardCoins: 300 },
  { id: "social_10", name: "Sosyal Kelebek", desc: "10 arkadas edin. Herkes seni taniyor!", label: "arkadas", icon: Users, color: "bg-pink-600", target: 10, category: "social", rewardCoins: 500 },
  { id: "social_25", name: "Topluluk Lideri", desc: "25 arkadas. Sen bir topluluk lidersin.", label: "arkadas", icon: UserPlus, color: "bg-fuchsia-500", target: 25, category: "social", rewardCoins: 1000 },
  { id: "social_50", name: "Efsanevi Mentor", desc: "50 arkadas! Herkesin ilham kaynagi.", label: "arkadas", icon: Heart, color: "bg-red-500", target: 50, category: "social", rewardCoins: 2500 },

  // ── Magaza & Kozmetik (Shop & Economy) ──
  { id: "shop_first_buy", name: "Ilk Alisveris", desc: "Focus Para Magazasindan ilk esyani al.", label: "alisveris", icon: ShoppingBag, color: "bg-amber-500", target: 1, category: "shop", rewardCoins: 100 },
  { id: "shop_freeze_hoarder", name: "Kutup Koruyucusu", desc: "Envanterinde 5 veya daha fazla Seri Dondurma bulundur.", label: "dondurma", icon: Shield, color: "bg-sky-400", target: 5, category: "shop", rewardCoins: 200 },
  { id: "shop_collector", name: "Koleksiyoner", desc: "Magazadan 3 farkli profil cercevesi veya unvan satin al.", label: "kozmetik", icon: Gem, color: "bg-fuchsia-500", target: 3, category: "shop", rewardCoins: 400 },
  { id: "shop_5_purchase", name: "Alisveris Gurusu", desc: "5 farkli urun satin al. Altin musteri!", label: "urun", icon: Package, color: "bg-orange-500", target: 5, category: "shop", rewardCoins: 300 },
  { id: "shop_case_opener", name: "Kasa Avcisi", desc: "Toplam 10 sans kasasi ac.", label: "kasa", icon: Gift, color: "bg-yellow-500", target: 10, category: "shop", rewardCoins: 500 },
  { id: "shop_big_spender", name: "Buyuk Harcayici", desc: "Toplam 5000 Focus Para harca.", label: "coin", icon: Banknote, color: "bg-red-500", target: 5000, category: "shop", rewardCoins: 800 },
  { id: "shop_mythic_hunter", name: "Efsane Avcisi", desc: "Kasadan kirmizi veya altin rarity item dusur.", label: "item", icon: Diamond, color: "bg-rose-600", target: 1, category: "shop", rewardCoins: 1000 },

  // ── Para Biriktirme (Economy) ──
  { id: "coins_1000", name: "Bin Altin", desc: "1,000 Focus Para biriktir.", label: "coin", icon: Coins, color: "bg-yellow-500", target: 1000, category: "economy", rewardCoins: 100 },
  { id: "coins_5000", name: "Hazine Avcisi", desc: "5,000 Focus Para biriktir.", label: "coin", icon: PiggyBank, color: "bg-amber-500", target: 5000, category: "economy", rewardCoins: 250 },
  { id: "coins_10000", name: "Altin Madencisi", desc: "10,000 Focus Para biriktir.", label: "coin", icon: Wallet, color: "bg-orange-500", target: 10000, category: "economy", rewardCoins: 500 },
  { id: "coins_50000", name: "Servet Sahibi", desc: "50,000 Focus Para biriktir. Zenginlik icinde yuzuyorsun!", label: "coin", icon: CircleDollarSign, color: "bg-emerald-500", target: 50000, category: "economy", rewardCoins: 1000 },
  { id: "coins_100000", name: "Milyoner", desc: "100,000 Focus Para. Altin tahtinin sahibi!", label: "coin", icon: BadgeDollarSign, color: "bg-amber-600", target: 100000, category: "economy", rewardCoins: 2500 },
  { id: "coins_500000", name: "Efsanevi Hazinedar", desc: "500,000 Focus Para. Hazine odasinin tek anahtari sende.", label: "coin", icon: Gem, color: "bg-fuchsia-600", target: 500000, category: "economy", rewardCoins: 5000 },
  { id: "coins_1000000", name: "Milyon Kulubu", desc: "1,000,000 Focus Para! Efsaneler arasina katildin.", label: "coin", icon: Crown, color: "bg-yellow-400", target: 1000000, category: "economy", rewardCoins: 10000 },
]

export const BADGE_MAP: Record<string, BadgeDefinition> = BADGES.reduce((acc, b) => {
  acc[b.id] = b
  return acc
}, {} as Record<string, BadgeDefinition>)
