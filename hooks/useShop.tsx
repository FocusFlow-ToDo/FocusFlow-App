"use client"

import * as React from "react"
import { useSettings } from "./useSettings"
import { useToast } from "@/contexts/ToastContext"
import confetti from "canvas-confetti"

export type ItemCategory = "utility" | "frame" | "effect" | "title" | "bundle"
export type ItemRarity = "common" | "rare" | "epic" | "legendary"
export type ShopCollection = "all" | "cosmic" | "cyberpunk" | "anime" | "dragon" | "synthwave" | "royalty" | "essentials" | "prestige" | "mythic" | "samurai"

export interface ShopItem {
  id: string
  name: string
  desc: string
  price: number
  originalPrice: number
  category: ItemCategory
  rarity: ItemRarity
  collection?: ShopCollection
  previewStyle?: string
  effectType?: string // for ProfileEffectOverlay
  glowColor?: string
  badgeText?: string
  featured?: boolean
  bundleItemIds?: string[]
}

export const RETURN_WINDOW_MS = 3 * 24 * 60 * 60 * 1000 // 3 Days

export const FRAME_STYLES: Record<string, string> = {
  frame_neon: "border-cyan-400 ring-2 ring-fuchsia-500/50 shadow-[0_0_20px_rgba(34,211,238,0.8)]",
  frame_gold: "border-amber-400 ring-2 ring-yellow-300/40 shadow-[0_0_25px_rgba(251,191,36,0.9)]",
  frame_flame: "border-orange-500 ring-2 ring-red-500/50 shadow-[0_0_22px_rgba(249,115,22,0.9)]",
  frame_amethyst: "border-purple-500 ring-2 ring-indigo-500/50 shadow-[0_0_22px_rgba(168,85,247,0.8)]",
  frame_emerald: "border-emerald-400 ring-2 ring-teal-400/40 shadow-[0_0_20px_rgba(52,211,153,0.8)]",
  frame_cosmic: "border-indigo-400 ring-2 ring-purple-500/60 shadow-[0_0_25px_rgba(99,102,241,0.85)]",
  frame_storm: "border-sky-400 ring-2 ring-blue-500/60 shadow-[0_0_25px_rgba(56,189,248,0.9)]",
  frame_sakura: "border-pink-400 ring-2 ring-rose-400/50 shadow-[0_0_22px_rgba(244,114,182,0.85)]",
  frame_obsidian: "border-zinc-400 ring-2 ring-zinc-700/80 shadow-[0_0_22px_rgba(161,161,170,0.6)]",
  frame_prismatic: "border-teal-300 ring-2 ring-fuchsia-400/60 shadow-[0_0_28px_rgba(45,212,191,0.9)]",
  frame_solar: "border-yellow-400 ring-2 ring-orange-500/60 shadow-[0_0_25px_rgba(250,204,21,0.9)]",
  frame_cyber: "border-lime-400 ring-2 ring-emerald-500/50 shadow-[0_0_22px_rgba(163,230,53,0.85)]",
  frame_glitch: "border-red-500 ring-2 ring-cyan-400 shadow-[0_0_24px_rgba(239,68,68,0.9),0_0_12px_rgba(34,211,238,0.9)]",
  frame_dragon: "border-rose-600 ring-2 ring-amber-500/70 shadow-[0_0_26px_rgba(225,29,72,0.95)]",
  frame_angelic: "border-amber-100 ring-2 ring-yellow-300/80 shadow-[0_0_30px_rgba(255,255,255,0.95),0_0_15px_rgba(253,224,71,0.8)]",
  frame_arcade: "border-violet-400 ring-2 ring-fuchsia-400/80 shadow-[0_0_22px_rgba(192,132,252,0.9)]",
  frame_blackhole: "border-purple-900 ring-2 ring-violet-600/90 shadow-[0_0_28px_rgba(124,58,237,0.9)]",
  frame_steampunk: "border-amber-700 ring-2 ring-yellow-600/60 shadow-[0_0_22px_rgba(180,83,9,0.85)]",
  frame_samurai: "border-rose-600 ring-2 ring-red-500/80 shadow-[0_0_28px_rgba(225,29,72,0.95),0_0_12px_rgba(245,158,11,0.7)]",
  // ─── PRESSTİJ & MİTİK ÇERÇEVELER ───
  frame_rainbow: "border-rose-400 ring-4 ring-amber-400/80 shadow-[0_0_35px_rgba(251,146,60,0.9),0_0_15px_rgba(168,85,247,0.7),0_0_8px_rgba(52,211,153,0.6)]",
  frame_void: "border-violet-900 ring-4 ring-purple-700/90 shadow-[0_0_40px_rgba(88,28,135,0.95),0_0_20px_rgba(0,0,0,0.8)]",
  frame_phoenix: "border-orange-500 ring-4 ring-red-600/80 shadow-[0_0_40px_rgba(239,68,68,0.9),0_0_20px_rgba(251,191,36,0.8),0_0_10px_rgba(255,255,255,0.4)]",
  frame_titan: "border-cyan-300 ring-4 ring-blue-500/90 shadow-[0_0_40px_rgba(34,211,238,0.95),0_0_20px_rgba(59,130,246,0.8),0_0_10px_rgba(255,255,255,0.5)]",
  frame_emperor: "border-yellow-300 ring-4 ring-amber-500/90 shadow-[0_0_45px_rgba(255,215,0,1),0_0_25px_rgba(251,191,36,0.9),0_0_12px_rgba(255,255,255,0.6)]",
  frame_infinity: "border-fuchsia-400 ring-4 ring-cyan-400/80 shadow-[0_0_45px_rgba(236,72,153,0.9),0_0_22px_rgba(34,211,238,0.8),0_0_12px_rgba(168,85,247,0.7)]"
}

export type CaseTierId = "case_rookie" | "case_operation" | "case_mythic"

export interface CaseTierConfig {
  id: CaseTierId
  name: string
  subtitle: string
  price: number
  badge: string
  color: string
  hexColor: string
  glowColor: string
  icon: string
  odds: { blue: number; purple: number; pink: number; red: number; gold: number }
  oddsText: { blue: string; purple: string; pink: string; red: string; gold: string }
}

export const CASE_TIERS: Record<CaseTierId, CaseTierConfig> = {
  case_rookie: {
    id: "case_rookie",
    name: "Çırak Kasası",
    subtitle: "Düşük Risk & Güvenli Başlangıç",
    price: 75,
    badge: "ÇIRAK",
    color: "from-blue-500/20 via-sky-500/10 to-indigo-500/20",
    hexColor: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.5)",
    icon: "🛡️",
    odds: { blue: 0.78, purple: 0.16, pink: 0.05, red: 0.009, gold: 0.001 },
    oddsText: { blue: "%78", purple: "%16", pink: "%5", red: "%0.9", gold: "%0.1" }
  },
  case_operation: {
    id: "case_operation",
    name: "Operasyon Kasası",
    subtitle: "Klasik CS2 Fiziği & Dengeli Ödüller",
    price: 150,
    badge: "SERİ #01",
    color: "from-amber-500/20 via-yellow-500/15 to-orange-500/20",
    hexColor: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.6)",
    icon: "🎰",
    odds: { blue: 0.70, purple: 0.18, pink: 0.08, red: 0.03, gold: 0.01 },
    oddsText: { blue: "%70", purple: "%18", pink: "%8", red: "%3", gold: "%1" }
  },
  case_mythic: {
    id: "case_mythic",
    name: "Kraliyet & Mitik Kasası",
    subtitle: "Yüksek Bahis • 3X Yüksek Altın Şansı!",
    price: 350,
    badge: "★ MİTİK ★",
    color: "from-fuchsia-500/25 via-purple-500/20 to-amber-500/25",
    hexColor: "#d946ef",
    glowColor: "rgba(217, 70, 239, 0.7)",
    icon: "👑",
    odds: { blue: 0.55, purple: 0.25, pink: 0.12, red: 0.05, gold: 0.03 },
    oddsText: { blue: "%55", purple: "%25", pink: "%12", red: "%5", gold: "%3" }
  }
}

export const SHOP_ITEMS: ShopItem[] = [
  // ═══════════════════════════════════════════════════════════════════
  // ██  YENİ ULTRA PRESTİJ KOLEKSİYONLARI (SAMURAY & MELEK & KARADELİK)  ██
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "bundle_samurai",
    name: "🥷 Katana Efendisi Paketi",
    desc: "Gölge samuraylarının kadim çeliği ve ruhu! Kan Kırmızı Katana Çerçevesi, Kılıç Kesiği Efekti ve 'Gölgelerin Samurayı' unvanı bir arada.",
    price: 8500,
    originalPrice: 14500,
    category: "bundle",
    rarity: "legendary",
    collection: "samurai",
    glowColor: "rgba(225, 29, 72, 0.95)",
    badgeText: "YENİ SET",
    featured: true,
    bundleItemIds: ["frame_samurai", "effect_katana", "title_katana_lord"]
  },
  {
    id: "bundle_angelic",
    name: "🪽 Işık Başmeleği Paketi",
    desc: "Cennetin kutsal kapılarını aralayan ilahi parıltı! Altın Melek Çerçevesi, Kutsal Melek Halesi Efekti ve 'Kutsal Koruyucu' unvanı ile profilini aydınlat.",
    price: 9200,
    originalPrice: 15500,
    category: "bundle",
    rarity: "legendary",
    collection: "royalty",
    glowColor: "rgba(253, 224, 71, 0.95)",
    badgeText: "PRESTİJ",
    featured: true,
    bundleItemIds: ["frame_angelic", "effect_angelic", "title_archangel"]
  },
  {
    id: "bundle_blackhole",
    name: "🕳️ Karadelik Tekilliği Paketi",
    desc: "Olay ufkunu aşan ve ışığı bile hapseden nihai yerçekimi! Karadelik Çerçevesi, Tekillik Efekti ve 'Tekillik Efendisi' unvanı.",
    price: 8800,
    originalPrice: 14200,
    category: "bundle",
    rarity: "legendary",
    collection: "cosmic",
    glowColor: "rgba(124, 58, 237, 0.95)",
    badgeText: "PRESTİJ",
    featured: true,
    bundleItemIds: ["frame_blackhole", "effect_blackhole", "title_singularity"]
  },

  // ═══════════════════════════════════════════════════════════════════
  // ██  PRESTİJ & MİTİK KOLEKSİYONLAR — ULTRA PREMIUM PAKETLERİ  ██
  // ═══════════════════════════════════════════════════════════════════

  // ─── 🏛️ MİTİK MEGA PAKETLER (MYTHIC TIER) — Ulaşılması en zor setler ───
  {
    id: "bundle_infinity",
    name: "♾️ Sonsuzluk Tanrısı Paketi",
    desc: "Evrenleri aşan nihai güç! Sonsuzluk Paradoksu Çerçevesi, Boyut Kapısı Efekti ve 'Sonsuzluğun Efendisi' unvanını içeren en nadir set. Sadece gerçek efsaneler buna ulaşabilir.",
    price: 25000,
    originalPrice: 42000,
    category: "bundle",
    rarity: "legendary",
    collection: "mythic",
    glowColor: "rgba(236, 72, 153, 0.95)",
    badgeText: "★ MİTİK ★",
    featured: true,
    bundleItemIds: ["frame_infinity", "effect_dimension", "title_infinity_lord"]
  },
  {
    id: "bundle_emperor",
    name: "👑 Altın İmparator Paketi",
    desc: "Tüm diyarların mutlak hükümdarı! Saf Altın İmparator Çerçevesi, İlahi Altın Taç Efekti ve 'Tanrıların Kralı' unvanı. Her görenin hayranlıkla izleyeceği kraliyet seti.",
    price: 20000,
    originalPrice: 35000,
    category: "bundle",
    rarity: "legendary",
    collection: "mythic",
    glowColor: "rgba(255, 215, 0, 1)",
    badgeText: "★ MİTİK ★",
    featured: true,
    bundleItemIds: ["frame_emperor", "effect_divine_crown", "title_god_king"]
  },
  {
    id: "bundle_phoenix",
    name: "🔥 Ölümsüz Anka Paketi",
    desc: "Küllerin arasından yeniden doğan ölümsüz Anka kuşunun gücü! Cennet Ateşi Çerçevesi, Anka Yeniden Doğuş Efekti ve 'Ölümsüz Anka' unvanı ile mutlak güç.",
    price: 15000,
    originalPrice: 26000,
    category: "bundle",
    rarity: "legendary",
    collection: "prestige",
    glowColor: "rgba(239, 68, 68, 0.95)",
    badgeText: "PRESTİJ",
    featured: true,
    bundleItemIds: ["frame_phoenix", "effect_phoenix_rebirth", "title_immortal_phoenix"]
  },

  // ─── 💎 PRESTİJ PAKETLER (PRESTIGE TIER) — Yüksek seviye hedef setler ───
  {
    id: "bundle_titan",
    name: "⚡ Yıldırım Titan Paketi",
    desc: "Olimpos'un en güçlü titanının zırhı ve gücü! Titan Zırhı Çerçevesi, Zeus Şimşek Fırtınası Efekti ve 'Yıldırım Tanrısı' unvanı. Görkemli bir profil seni bekliyor.",
    price: 12000,
    originalPrice: 20000,
    category: "bundle",
    rarity: "legendary",
    collection: "prestige",
    glowColor: "rgba(34, 211, 238, 0.95)",
    badgeText: "PRESTİJ",
    bundleItemIds: ["frame_titan", "effect_zeus_storm", "title_thunder_god"]
  },
  {
    id: "bundle_void",
    name: "🕳️ Boşluk Efendisi Paketi",
    desc: "Evrenin en karanlık köşesinden gelen gizemli güç! Boşluk Uçurumu Çerçevesi, Karanlık Madde Efekti ve 'Boşluk Efendisi' unvanı. Gerçekliği bük.",
    price: 10000,
    originalPrice: 17000,
    category: "bundle",
    rarity: "legendary",
    collection: "prestige",
    glowColor: "rgba(88, 28, 135, 0.95)",
    badgeText: "PRESTİJ",
    bundleItemIds: ["frame_void", "effect_dark_matter", "title_void_master"]
  },
  {
    id: "bundle_rainbow",
    name: "🌈 Gökkuşağı Prizması Paketi",
    desc: "Tüm elementlerin birleştiği muazzam güç! Prizma Spektrum Çerçevesi, Aurora Süpernova Efekti ve 'Element Ustası' unvanı. Renklerin dansını profiline getir.",
    price: 7500,
    originalPrice: 13000,
    category: "bundle",
    rarity: "legendary",
    collection: "prestige",
    glowColor: "rgba(251, 146, 60, 0.9)",
    badgeText: "%42 İNDİRİM",
    bundleItemIds: ["frame_rainbow", "effect_aurora_supernova", "title_element_master"]
  },

  // ─── PRESTİJ & MİTİK TEK ÇERÇEVELER ───
  {
    id: "frame_infinity",
    name: "♾️ Sonsuzluk Paradoksu",
    desc: "Zaman ve mekanın ötesinden gelen, boyutlar arası ışık kıvrımlarıyla donatılmış en nadir mitik çerçeve. Sadece efsaneler taşıyabilir.",
    price: 12000,
    originalPrice: 18000,
    category: "frame",
    rarity: "legendary",
    collection: "mythic",
    previewStyle: FRAME_STYLES.frame_infinity,
    glowColor: "rgba(236, 72, 153, 0.95)",
    badgeText: "★ MİTİK ★"
  },
  {
    id: "frame_emperor",
    name: "👑 Saf Altın İmparator",
    desc: "999 ayar saf altından dövülmüş, yakutlar ve zümrütlerle süslenmiş imparatorluk çerçevesi. Her bakan boyun eğer.",
    price: 9500,
    originalPrice: 15000,
    category: "frame",
    rarity: "legendary",
    collection: "mythic",
    previewStyle: FRAME_STYLES.frame_emperor,
    glowColor: "rgba(255, 215, 0, 1)",
    badgeText: "★ MİTİK ★"
  },
  {
    id: "frame_phoenix",
    name: "🔥 Cennet Ateşi",
    desc: "Anka kuşunun sonsuz alevlerinden doğan kutsal çerçeve. Ateşle dokunulamaz, ancak ışığıyla büyüler.",
    price: 7000,
    originalPrice: 11000,
    category: "frame",
    rarity: "legendary",
    collection: "prestige",
    previewStyle: FRAME_STYLES.frame_phoenix,
    glowColor: "rgba(239, 68, 68, 0.95)",
    badgeText: "PRESTİJ"
  },
  {
    id: "frame_titan",
    name: "⚡ Titan Zırhı",
    desc: "Olympos titanlarının giydiği kozmik zırh çerçevesi. Gök mavisi enerji kalkanları ve yıldırım arkları ile çevrili.",
    price: 5500,
    originalPrice: 9000,
    category: "frame",
    rarity: "legendary",
    collection: "prestige",
    previewStyle: FRAME_STYLES.frame_titan,
    glowColor: "rgba(34, 211, 238, 0.95)",
    badgeText: "PRESTİJ"
  },
  {
    id: "frame_void",
    name: "🕳️ Boşluk Uçurumu",
    desc: "Karanlık enerjinin yoğunlaştığı, gerçekliği büken derin mor tekillik çerçevesi. Etrafına bakan kaybolur.",
    price: 4800,
    originalPrice: 7500,
    category: "frame",
    rarity: "legendary",
    collection: "prestige",
    previewStyle: FRAME_STYLES.frame_void,
    glowColor: "rgba(88, 28, 135, 0.95)",
    badgeText: "PRESTİJ"
  },
  {
    id: "frame_rainbow",
    name: "🌈 Prizma Spektrum",
    desc: "Tüm renk spektrumunun harmonik rezonansıyla ışıldayan kristal prizma çerçevesi. Her açıdan farklı parıldar.",
    price: 3800,
    originalPrice: 6000,
    category: "frame",
    rarity: "legendary",
    collection: "prestige",
    previewStyle: FRAME_STYLES.frame_rainbow,
    glowColor: "rgba(251, 146, 60, 0.9)"
  },

  // ─── PRESTİJ & MİTİK PROFİL EFEKTLERİ ───
  {
    id: "effect_dimension",
    name: "♾️ Boyut Kapısı Portal",
    desc: "Profilinin etrafında açılan çok boyutlu portal kapısı. Gerçeklik kırılmaları ve kozmik enerji dalgaları ile çevrili inanılmaz efekt.",
    price: 11000,
    originalPrice: 17000,
    category: "effect",
    rarity: "legendary",
    collection: "mythic",
    effectType: "effect_dimension",
    glowColor: "rgba(236, 72, 153, 0.95)",
    badgeText: "★ MİTİK ★"
  },
  {
    id: "effect_divine_crown",
    name: "👑 İlahi Altın Taç",
    desc: "Profilinin tepesinde süzülen kutsal altın taç ve etrafında dönen yıldız tozu halesı. Gerçek hükümdarın sembolü.",
    price: 9000,
    originalPrice: 14000,
    category: "effect",
    rarity: "legendary",
    collection: "mythic",
    effectType: "effect_divine_crown",
    glowColor: "rgba(255, 215, 0, 1)",
    badgeText: "★ MİTİK ★"
  },
  {
    id: "effect_phoenix_rebirth",
    name: "🔥 Anka Yeniden Doğuş",
    desc: "Profilinden yükselen kutsal anka kuşu alevleri ve altın kıvılcımları. Küllerin arasından muhteşem bir yeniden doğuş.",
    price: 6500,
    originalPrice: 10000,
    category: "effect",
    rarity: "legendary",
    collection: "prestige",
    effectType: "effect_phoenix_rebirth",
    glowColor: "rgba(239, 68, 68, 0.95)",
    badgeText: "PRESTİJ"
  },
  {
    id: "effect_zeus_storm",
    name: "⚡ Zeus Şimşek Fırtınası",
    desc: "Profilini saran devasa gök gürültülü fırtına, Olympos'un yıldırım çubukları ve mavi enerji patlamaları.",
    price: 5500,
    originalPrice: 8500,
    category: "effect",
    rarity: "legendary",
    collection: "prestige",
    effectType: "effect_zeus_storm",
    glowColor: "rgba(34, 211, 238, 0.95)",
    badgeText: "PRESTİJ"
  },
  {
    id: "effect_dark_matter",
    name: "🕳️ Karanlık Madde",
    desc: "Profilinin etrafında dönen karanlık madde parçacıkları, mor enerji dalgaları ve yer çekimi bükülmeleri.",
    price: 4500,
    originalPrice: 7000,
    category: "effect",
    rarity: "legendary",
    collection: "prestige",
    effectType: "effect_dark_matter",
    glowColor: "rgba(88, 28, 135, 0.95)",
    badgeText: "PRESTİJ"
  },
  {
    id: "effect_aurora_supernova",
    name: "🌈 Aurora Süpernova",
    desc: "Tüm elementlerin birleştiği gökkuşağı aurora patlaması. Profilinin etrafında dans eden çok renkli kozmik enerji dalgaları.",
    price: 3500,
    originalPrice: 5500,
    category: "effect",
    rarity: "legendary",
    collection: "prestige",
    effectType: "effect_aurora_supernova",
    glowColor: "rgba(251, 146, 60, 0.9)"
  },

  // ─── PRESTİJ & MİTİK UNVANLAR ───
  {
    id: "title_infinity_lord",
    name: "Sonsuzluğun Efendisi",
    desc: "Zamanın ve mekanın ötesinde var olan, boyutlar arası güce sahip nihai varlık. En nadir mitik unvan.",
    price: 8000,
    originalPrice: 13000,
    category: "title",
    rarity: "legendary",
    collection: "mythic",
    glowColor: "rgba(236, 72, 153, 0.95)",
    badgeText: "★ MİTİK ★"
  },
  {
    id: "title_god_king",
    name: "Tanrıların Kralı",
    desc: "Tüm diyarların ve boyutların mutlak hükümdarı. Tahtına oturan herkes boyun eğmek zorundadır.",
    price: 7000,
    originalPrice: 11000,
    category: "title",
    rarity: "legendary",
    collection: "mythic",
    glowColor: "rgba(255, 215, 0, 1)",
    badgeText: "★ MİTİK ★"
  },
  {
    id: "title_immortal_phoenix",
    name: "Ölümsüz Anka",
    desc: "Asla yok edilemeyen, her yıkımdan daha güçlü dönen ölümsüz ateş kuşu. Efsanelerin efsanesi.",
    price: 5000,
    originalPrice: 8000,
    category: "title",
    rarity: "legendary",
    collection: "prestige",
    glowColor: "rgba(239, 68, 68, 0.95)",
    badgeText: "PRESTİJ"
  },
  {
    id: "title_thunder_god",
    name: "Yıldırım Tanrısı",
    desc: "Göklerin hakimi, fırtınaların efendisi. Tek bir bakışla yıldırımları yönlendiren Olympos'un en güçlü tanrısı.",
    price: 4200,
    originalPrice: 6500,
    category: "title",
    rarity: "legendary",
    collection: "prestige",
    glowColor: "rgba(34, 211, 238, 0.95)",
    badgeText: "PRESTİJ"
  },
  {
    id: "title_void_master",
    name: "Boşluk Efendisi",
    desc: "Karanlığın ve boşluğun mutlak hükümdarı. Gerçekliği büken, boyutları yıkan karanlık güç.",
    price: 3500,
    originalPrice: 5500,
    category: "title",
    rarity: "legendary",
    collection: "prestige",
    glowColor: "rgba(88, 28, 135, 0.95)"
  },
  {
    id: "title_element_master",
    name: "Element Ustası",
    desc: "Ateş, su, toprak ve havanın mutlak kontrolünü elinde tutan kadim element bükücü.",
    price: 2800,
    originalPrice: 4500,
    category: "title",
    rarity: "legendary",
    collection: "prestige",
    glowColor: "rgba(251, 146, 60, 0.9)"
  },

  // ─── KOLEKSİYON PAKETLERİ (THEMED BUNDLES) ───
  {
    id: "bundle_cyber",
    name: "⚡ Siberpunk 2099 Koleksiyon Paketi",
    desc: "Siber Matris Çerçevesi, Matrix Kod Yağmuru Profil Efekti ve 'Kod Canavarı' unvanını içeren eksiksiz siber set!",
    price: 850,
    originalPrice: 1450,
    category: "bundle",
    rarity: "legendary",
    collection: "cyberpunk",
    glowColor: "rgba(16, 185, 129, 0.8)",
    badgeText: "%41 İNDİRİM",
    featured: true,
    bundleItemIds: ["frame_cyber", "effect_matrix", "title_code_monster"]
  },
  {
    id: "bundle_cosmic",
    name: "🌌 Kozmik Galaksi Tam Koleksiyonu",
    desc: "Kozmik Sonsuzluk Çerçevesi, Nebula & Kayan Yıldızlar Profil Efekti ve 'Kozmik Gezgin' unvanını içeren devasa uzay seti.",
    price: 900,
    originalPrice: 1550,
    category: "bundle",
    rarity: "legendary",
    collection: "cosmic",
    glowColor: "rgba(99, 102, 241, 0.85)",
    badgeText: "%42 İNDİRİM",
    bundleItemIds: ["frame_cosmic", "effect_cosmic", "title_cosmic_explorer"]
  },
  {
    id: "bundle_dragon",
    name: "🐉 Kadim Ejderha Efendisi Paketi",
    desc: "Ateş Ejderi Çerçevesi, Kor Alevler Profil Efekti ve 'Efsanevi Ejder' unvanı bir arada.",
    price: 820,
    originalPrice: 1380,
    category: "bundle",
    rarity: "legendary",
    collection: "dragon",
    glowColor: "rgba(225, 29, 72, 0.85)",
    badgeText: "%40 İNDİRİM",
    bundleItemIds: ["frame_dragon", "effect_flame", "title_legend_dragon"]
  },
  {
    id: "bundle_sakura",
    name: "🌸 Sakura & Zen Ruhları Paketi",
    desc: "Sakura Rüzgarı Çerçevesi, Uçuşan Kiraz Çiçeği Profil Efekti ve 'Zen Ustası' unvanı ile dingin bir profil.",
    price: 750,
    originalPrice: 1200,
    category: "bundle",
    rarity: "epic",
    collection: "anime",
    glowColor: "rgba(244, 114, 182, 0.85)",
    badgeText: "%38 İNDİRİM",
    bundleItemIds: ["frame_sakura", "effect_sakura", "title_zen_master"]
  },
  {
    id: "bundle_royalty",
    name: "👑 Mutlak Hükümdar Altın Paketi",
    desc: "24K Kraliyet Altını Çerçeve, Yağan Altın Paralar Profil Efekti ve 'Zaman Milyarderi' unvanı ile zirve lüks.",
    price: 950,
    originalPrice: 1650,
    category: "bundle",
    rarity: "legendary",
    collection: "royalty",
    glowColor: "rgba(251, 191, 36, 0.9)",
    badgeText: "%42 İNDİRİM",
    bundleItemIds: ["frame_gold", "effect_gold", "title_billionaire"]
  },
  {
    id: "bundle_synthwave",
    name: "🕹️ 80'ler Retro Synthwave Paketi",
    desc: "Retro Piksel Arcade Çerçevesi, 80'ler Synthwave Izgara Profil Efekti ve 'Piksel Şampiyonu' unvanı ile nostaljik siberpunk havası.",
    price: 780,
    originalPrice: 1280,
    category: "bundle",
    rarity: "epic",
    collection: "synthwave",
    glowColor: "rgba(236, 72, 153, 0.85)",
    badgeText: "%39 İNDİRİM",
    bundleItemIds: ["frame_arcade", "effect_synthwave", "title_pixel_champ"]
  },
  {
    id: "bundle_storm",
    name: "⚡ Fırtına & Yüksek Voltaj Paketi",
    desc: "Fırtına & Şimşek Çerçevesi, Kıvılcımlı Şimşek Fırtınası Profil Efekti ve 'Hız Tutkunu' unvanı içeren yüksek enerjili güç seti.",
    price: 790,
    originalPrice: 1300,
    category: "bundle",
    rarity: "epic",
    collection: "essentials",
    glowColor: "rgba(56, 189, 248, 0.85)",
    badgeText: "%39 İNDİRİM",
    bundleItemIds: ["frame_storm", "effect_thunder", "title_speed"]
  },

  // ─── PROFİL EFEKTLERİ (DISCORD-STYLE PROFILE EFFECTS) ───
  {
    id: "effect_matrix",
    name: "Matrix Kod Akışı",
    desc: "Profilinin üzerinde aşağı doğru süzülen neon yeşil kod yağmuru ve siber tarama çizgisi.",
    price: 480,
    originalPrice: 750,
    category: "effect",
    rarity: "legendary",
    collection: "cyberpunk",
    effectType: "effect_matrix",
    glowColor: "rgba(16, 185, 129, 0.85)",
    badgeText: "DİKKAT ÇEKİCİ"
  },
  {
    id: "effect_cosmic",
    name: "Kozmik Süpernova & Nebula",
    desc: "Profil kartının etrafında dönen derin uzay nebulası ve kayan yıldız kuyruklu yıldızları.",
    price: 520,
    originalPrice: 800,
    category: "effect",
    rarity: "legendary",
    collection: "cosmic",
    effectType: "effect_cosmic",
    glowColor: "rgba(168, 85, 247, 0.85)",
    badgeText: "POPÜLER"
  },
  {
    id: "effect_sakura",
    name: "Uçuşan Kiraz Çiçekleri",
    desc: "Profilinin üzerinde zarifçe dans ederek süzülen pembe sakura yaprakları.",
    price: 390,
    originalPrice: 620,
    category: "effect",
    rarity: "epic",
    collection: "anime",
    effectType: "effect_sakura",
    glowColor: "rgba(244, 114, 182, 0.8)"
  },
  {
    id: "effect_thunder",
    name: "Kıvılcımlı Şimşek Fırtınası",
    desc: "Yüksek voltajlı elektrik patlamaları, gök gürültüsü ışıkları ve mavi arklar.",
    price: 430,
    originalPrice: 680,
    category: "effect",
    rarity: "epic",
    collection: "essentials",
    effectType: "effect_thunder",
    glowColor: "rgba(56, 189, 248, 0.85)"
  },
  {
    id: "effect_flame",
    name: "Cehennem Korları & Alev",
    desc: "Profilin altından durmaksızın yükselen parlak ateş kıvılcımları ve kızıl korlar.",
    price: 440,
    originalPrice: 700,
    category: "effect",
    rarity: "epic",
    collection: "dragon",
    effectType: "effect_flame",
    glowColor: "rgba(249, 115, 22, 0.85)"
  },
  {
    id: "effect_synthwave",
    name: "80'ler Synthwave Izgara",
    desc: "Retro neon günbatımı, ufuk ızgarası ve mor lazer parlamaları.",
    price: 410,
    originalPrice: 650,
    category: "effect",
    rarity: "epic",
    collection: "synthwave",
    effectType: "effect_synthwave",
    glowColor: "rgba(236, 72, 153, 0.8)"
  },
  {
    id: "effect_aurora",
    name: "Dans Eden Kuzey Işıkları",
    desc: "Profilin üstünde dalgalanan büyülü yeşil ve eflatun aurora borealis ışık perdesi.",
    price: 490,
    originalPrice: 780,
    category: "effect",
    rarity: "legendary",
    collection: "cosmic",
    effectType: "effect_aurora",
    glowColor: "rgba(45, 212, 191, 0.85)"
  },
  {
    id: "effect_gold",
    name: "Altın Yağmuru & Şampiyon Işıltısı",
    desc: "Gökten yağan parıltılı altın paralar ve şampiyon kıvılcımları.",
    price: 550,
    originalPrice: 850,
    category: "effect",
    rarity: "legendary",
    collection: "royalty",
    effectType: "effect_gold",
    glowColor: "rgba(250, 204, 21, 0.9)",
    badgeText: "PRESTİJ"
  },
  {
    id: "effect_katana",
    name: "Katana Kesiği & Çelik Parıltısı",
    desc: "Profilinde parıldayan keskin kılıç kesikleri, savrulan kiraz çiçekleri ve kızıl kıvılcımlar.",
    price: 3800,
    originalPrice: 5800,
    category: "effect",
    rarity: "epic",
    collection: "samurai",
    effectType: "effect_katana",
    glowColor: "rgba(244, 63, 94, 0.9)",
    badgeText: "YENİ"
  },
  {
    id: "effect_angelic",
    name: "Kutsal Melek Halesi & Altın Işık",
    desc: "Profilinden gökyüzüne süzülen altın tüy parçacıkları ve ilahi ışık halesi.",
    price: 4500,
    originalPrice: 7000,
    category: "effect",
    rarity: "legendary",
    collection: "royalty",
    effectType: "effect_angelic",
    glowColor: "rgba(253, 224, 71, 0.95)",
    badgeText: "PRESTİJ"
  },
  {
    id: "effect_blackhole",
    name: "Karadelik & Yerçekimi Tekilliği",
    desc: "Merkeze çekilen karanlık madde akışları ve dönen olay ufku akresyon diski.",
    price: 4200,
    originalPrice: 6500,
    category: "effect",
    rarity: "legendary",
    collection: "cosmic",
    effectType: "effect_blackhole",
    glowColor: "rgba(124, 58, 237, 0.95)",
    badgeText: "PRESTİJ"
  },

  // ─── AVATAR SÜSLEMELERİ & ÇERÇEVELER (FRAMES) ───
  {
    id: "frame_cosmic",
    name: "🌌 Kozmik Galaksi",
    desc: "Derin uzay nebulalarının ve yıldız tozlarının dans ettiği efsanevi çerçeve.",
    price: 550,
    originalPrice: 900,
    category: "frame",
    rarity: "legendary",
    collection: "cosmic",
    previewStyle: FRAME_STYLES.frame_cosmic,
    glowColor: "rgba(99, 102, 241, 0.8)"
  },
  {
    id: "frame_prismatic",
    name: "💎 Prizmatik Elmas",
    desc: "Işığı kırarak gökkuşağı parıltıları saçan en prestijli elmas çerçeve.",
    price: 600,
    originalPrice: 990,
    category: "frame",
    rarity: "legendary",
    collection: "royalty",
    previewStyle: FRAME_STYLES.frame_prismatic,
    glowColor: "rgba(45, 212, 191, 0.85)"
  },
  {
    id: "frame_gold",
    name: "👑 Kraliyet Altını",
    desc: "Zirvedekilere layık parıldayan saf 24 ayar altın çerçeve.",
    price: 500,
    originalPrice: 800,
    category: "frame",
    rarity: "legendary",
    collection: "royalty",
    previewStyle: FRAME_STYLES.frame_gold,
    glowColor: "rgba(251, 191, 36, 0.75)"
  },
  {
    id: "frame_glitch",
    name: "👾 Siber Glitch & Kromatik",
    desc: "RGB renk ayrışması ve dijital sinyal bozulması efektli siberpunk çerçeve.",
    price: 460,
    originalPrice: 720,
    category: "frame",
    rarity: "epic",
    collection: "cyberpunk",
    previewStyle: FRAME_STYLES.frame_glitch,
    glowColor: "rgba(239, 68, 68, 0.85)",
    badgeText: "YENİ"
  },
  {
    id: "frame_dragon",
    name: "🐉 Kadim Ejder Alevleri",
    desc: "Etrafında kızıl ejder kanatları ve kor alev auraları taşıyan efsanevi çerçeve.",
    price: 520,
    originalPrice: 820,
    category: "frame",
    rarity: "legendary",
    collection: "dragon",
    previewStyle: FRAME_STYLES.frame_dragon,
    glowColor: "rgba(225, 29, 72, 0.9)",
    badgeText: "YENİ"
  },
  {
    id: "frame_angelic",
    name: "✨ İlahi Melek Halesi",
    desc: "Göz alıcı beyaz ışık ve altın melek halesi içeren kutsal çerçeve.",
    price: 540,
    originalPrice: 850,
    category: "frame",
    rarity: "legendary",
    collection: "cosmic",
    previewStyle: FRAME_STYLES.frame_angelic,
    glowColor: "rgba(255, 255, 255, 0.9)",
    badgeText: "YENİ"
  },
  {
    id: "frame_arcade",
    name: "🕹️ 8-Bit Retro Arcade",
    desc: "Nostaljik piksel art neon ışıkları ve parıldayan köşeleriyle arcade klasiği.",
    price: 380,
    originalPrice: 580,
    category: "frame",
    rarity: "rare",
    collection: "synthwave",
    previewStyle: FRAME_STYLES.frame_arcade,
    glowColor: "rgba(192, 132, 252, 0.85)",
    badgeText: "YENİ"
  },
  {
    id: "frame_blackhole",
    name: "🕳️ Olay Ufku & Karadelik",
    desc: "Yerçekimi bükülmesi ve koyu mor tekillik ışıltısı saçan gizemli çerçeve.",
    price: 530,
    originalPrice: 840,
    category: "frame",
    rarity: "legendary",
    collection: "cosmic",
    previewStyle: FRAME_STYLES.frame_blackhole,
    glowColor: "rgba(124, 58, 237, 0.9)",
    badgeText: "YENİ"
  },
  {
    id: "frame_steampunk",
    name: "⚙️ Pirinç Dişli & Buhar",
    desc: "İnce işlenmiş bronz dişliler ve mekanik saat parçalarından oluşan buharlı çerçeve.",
    price: 360,
    originalPrice: 560,
    category: "frame",
    rarity: "rare",
    collection: "essentials",
    previewStyle: FRAME_STYLES.frame_steampunk,
    glowColor: "rgba(180, 83, 9, 0.8)",
    badgeText: "YENİ"
  },
  {
    id: "frame_storm",
    name: "⚡ Fırtına & Şimşek",
    desc: "Etrafında yüksek voltajlı elektrik kıvılcımları dolaşan enerji çerçevesi.",
    price: 420,
    originalPrice: 680,
    category: "frame",
    rarity: "epic",
    collection: "essentials",
    previewStyle: FRAME_STYLES.frame_storm,
    glowColor: "rgba(56, 189, 248, 0.75)"
  },
  {
    id: "frame_flame",
    name: "🔥 Ateş Lordu",
    desc: "Hiç sönmeyen canlı alev dalgalarıyla donatılmış profil çerçevesi.",
    price: 400,
    originalPrice: 650,
    category: "frame",
    rarity: "epic",
    collection: "dragon",
    previewStyle: FRAME_STYLES.frame_flame,
    glowColor: "rgba(249, 115, 22, 0.75)"
  },
  {
    id: "frame_amethyst",
    name: "🔮 Ametist Büyüsü",
    desc: "Mistik mor kristal aurası saçan büyüleyici ametist taşları.",
    price: 380,
    originalPrice: 600,
    category: "frame",
    rarity: "epic",
    collection: "anime",
    previewStyle: FRAME_STYLES.frame_amethyst,
    glowColor: "rgba(168, 85, 247, 0.7)"
  },
  {
    id: "frame_solar",
    name: "☀️ Güneş Patlaması",
    desc: "Süpernova enerjisiyle ışıldayan kızgın güneş aurası.",
    price: 480,
    originalPrice: 750,
    category: "frame",
    rarity: "legendary",
    collection: "cosmic",
    previewStyle: FRAME_STYLES.frame_solar,
    glowColor: "rgba(250, 204, 21, 0.85)"
  },
  {
    id: "frame_cyber",
    name: "🌐 Siber Matris",
    desc: "Fütüristik dijital devreler ve neon yeşili siber matrix hatları.",
    price: 360,
    originalPrice: 580,
    category: "frame",
    rarity: "rare",
    collection: "cyberpunk",
    previewStyle: FRAME_STYLES.frame_cyber,
    glowColor: "rgba(163, 230, 53, 0.75)"
  },
  {
    id: "frame_emerald",
    name: "💚 Zümrüt Parıltısı",
    desc: "Zarif ve asil yeşil ışık yayan zümrüt mücevher kenarlığı.",
    price: 320,
    originalPrice: 500,
    category: "frame",
    rarity: "rare",
    collection: "essentials",
    previewStyle: FRAME_STYLES.frame_emerald,
    glowColor: "rgba(52, 211, 153, 0.7)"
  },
  {
    id: "frame_sakura",
    name: "🌸 Sakura Rüzgarı",
    desc: "Baharın taze pembe kiraz çiçeklerini profiline getiren dingin çerçeve.",
    price: 340,
    originalPrice: 520,
    category: "frame",
    rarity: "rare",
    collection: "anime",
    previewStyle: FRAME_STYLES.frame_sakura,
    glowColor: "rgba(244, 114, 182, 0.75)"
  },
  {
    id: "frame_obsidian",
    name: "🛡️ Obsidyen Zırhı",
    desc: "Karanlık volkanik obsidyen taşından oyulmuş taktiksel dayanıklı çerçeve.",
    price: 280,
    originalPrice: 420,
    category: "frame",
    rarity: "rare",
    collection: "essentials",
    previewStyle: FRAME_STYLES.frame_obsidian,
    glowColor: "rgba(161, 161, 170, 0.6)"
  },
  {
    id: "frame_neon",
    name: "Neon Parıltı",
    desc: "Cam göbeği ve pembenin uyumuyla parıldayan ilk klasik çerçeve.",
    price: 180,
    originalPrice: 280,
    category: "frame",
    rarity: "common",
    collection: "essentials",
    previewStyle: FRAME_STYLES.frame_neon,
    glowColor: "rgba(34, 211, 238, 0.6)"
  },
  {
    id: "frame_samurai",
    name: "Kan Kırmızı Katana",
    desc: "Gölge samuraylarının dövdüğü, kırmızı fener ışıltıları ve altın varak süslemeli çerçeve.",
    price: 4200,
    originalPrice: 6500,
    category: "frame",
    rarity: "epic",
    collection: "samurai",
    previewStyle: FRAME_STYLES.frame_samurai,
    glowColor: "rgba(225, 29, 72, 0.9)",
    badgeText: "YENİ"
  },

  // ─── GÜÇLENDİRMELER & SANDIKLAR (UTILITIES & CHESTS) ───
  {
    id: "chest_mystery",
    name: "🎁 FocusFlow Şans Kasası",
    desc: "CS2 çark mekaniğiyle çalışan şans kasası! Mavi (%70 zarar/teselli), Mor (%18), Pembe (%8), Kırmızı (%3) veya Altın (%1) ödüller çıkar.",
    price: 150,
    originalPrice: 250,
    category: "utility",
    rarity: "epic",
    collection: "essentials",
    glowColor: "rgba(234, 179, 8, 0.8)",
    badgeText: "CS2 KASA AÇILIŞI",
    featured: true
  },
  {
    id: "freeze_single",
    name: "Seri Dondurucu",
    desc: "1 gün boyunca görev yapmasan bile serini sıfırlanmaktan korur.",
    price: 100,
    originalPrice: 160,
    category: "utility",
    rarity: "common",
    collection: "essentials",
    glowColor: "rgba(56, 189, 248, 0.5)"
  },
  {
    id: "freeze_bundle",
    name: "3'lü Dondurucu Paketi",
    desc: "3 günlük süper seri koruma avantaj paketi.",
    price: 250,
    originalPrice: 380,
    category: "utility",
    rarity: "rare",
    collection: "essentials",
    glowColor: "rgba(56, 189, 248, 0.7)"
  },
  {
    id: "freeze_epic_pack",
    name: "7'li Koruma Kalkanı",
    desc: "1 haftalık kesintisiz seri kalkanı. Yoğun sınav veya tatil dönemleri için ideal.",
    price: 490,
    originalPrice: 750,
    category: "utility",
    rarity: "epic",
    collection: "essentials",
    glowColor: "rgba(168, 85, 247, 0.7)",
    badgeText: "HAFTALIK"
  },
  {
    id: "booster_xp_2x",
    name: "⚡ 2x Çift XP İksiri",
    desc: "24 saat boyunca tamamladığın her görevden 2 kat Deneyim Puanı (XP) kazandırır.",
    price: 180,
    originalPrice: 300,
    category: "utility",
    rarity: "rare",
    collection: "essentials",
    glowColor: "rgba(234, 179, 8, 0.6)",
    badgeText: "24 SAAT"
  },
  {
    id: "booster_coin_2x",
    name: "🪙 2x Para Çarpanı",
    desc: "24 saat boyunca tamamlanan her görevden 2 kat Focus Para toplamanı sağlar.",
    price: 220,
    originalPrice: 350,
    category: "utility",
    rarity: "rare",
    collection: "essentials",
    glowColor: "rgba(245, 158, 11, 0.7)",
    badgeText: "24 SAAT"
  },
  {
    id: "streak_saver_pro",
    name: "⏳ Zaman Kurtarıcı",
    desc: "Kaçırdığın dünkü serini geriye dönük tamir ederek serini kaldığı yerden devam ettirir.",
    price: 350,
    originalPrice: 550,
    category: "utility",
    rarity: "epic",
    collection: "essentials",
    glowColor: "rgba(14, 165, 233, 0.8)",
    badgeText: "ACİL DURUM"
  },
  {
    id: "booster_lucky_insurance",
    name: "🎯 Kasa Şans Sigortası",
    desc: "Açtığın sonraki 3 kasada mavi (teselli) çıkması durumunda harcadığın paranın %50'si anında cüzdanına iade edilir.",
    price: 190,
    originalPrice: 320,
    category: "utility",
    rarity: "rare",
    collection: "essentials",
    glowColor: "rgba(6, 182, 212, 0.8)",
    badgeText: "GÜVENCE"
  },
  {
    id: "badge_focus_honor",
    name: "🌟 Odak Şeref Madalyası",
    desc: "Profilinde parıldayan ve 1 hafta boyunca tamamlanan her görevden +50 ekstra Focus Para kazandıran onur madalyası.",
    price: 290,
    originalPrice: 480,
    category: "utility",
    rarity: "epic",
    collection: "essentials",
    glowColor: "rgba(245, 158, 11, 0.85)",
    badgeText: "HAFTALIK"
  },

  // ─── EFSANEVİ TOPLULUK UNVANLARI (TITLES) ───
  {
    id: "title_katana_lord",
    name: "Gölgelerin Samurayı",
    desc: "Gölge samuraylarının kadim konsantrasyonu ve disipliniyle hedeflerine ulaşanların unvanı.",
    price: 950,
    originalPrice: 1500,
    category: "title",
    rarity: "epic",
    collection: "samurai",
    glowColor: "rgba(225, 29, 72, 0.85)",
    badgeText: "YENİ"
  },
  {
    id: "title_archangel",
    name: "Kutsal Koruyucu",
    desc: "Işığın ve erdemin yolundan ayrılmayan, hedeflerini sarsılmaz inançla tamamlayanların unvanı.",
    price: 1100,
    originalPrice: 1800,
    category: "title",
    rarity: "legendary",
    collection: "royalty",
    glowColor: "rgba(251, 191, 36, 0.85)"
  },
  {
    id: "title_singularity",
    name: "Tekillik Efendisi",
    desc: "Karadeliklerin merkezindeki tekillik gibi tüm dikkatini ve enerjisini tek bir noktaya odaklayan.",
    price: 980,
    originalPrice: 1600,
    category: "title",
    rarity: "legendary",
    collection: "cosmic",
    glowColor: "rgba(147, 51, 234, 0.85)"
  },
  {
    id: "title_cosmic_explorer",
    name: "Kozmik Gezgin",
    desc: "Evrenin derinliklerini ve zamanın sırlarını keşfedenlere layık unvan.",
    price: 350,
    originalPrice: 550,
    category: "title",
    rarity: "legendary",
    collection: "cosmic",
    glowColor: "rgba(99, 102, 241, 0.8)"
  },
  {
    id: "title_time_master",
    name: "Zamanın Efendisi",
    desc: "Saatleri ve dakikaları kendi iradesiyle büken mutlak odak ustası.",
    price: 450,
    originalPrice: 700,
    category: "title",
    rarity: "legendary",
    collection: "cosmic",
    glowColor: "rgba(168, 85, 247, 0.8)"
  },
  {
    id: "title_legend_dragon",
    name: "Efsanevi Ejder",
    desc: "Ateşten korkmayan, hedeflerini yakıp kül eden kararlı liderler için.",
    price: 400,
    originalPrice: 650,
    category: "title",
    rarity: "legendary",
    collection: "dragon",
    glowColor: "rgba(239, 68, 68, 0.8)"
  },
  {
    id: "title_phoenix",
    name: "Küllerinden Doğan",
    desc: "Asla pes etmeyen, her başarısızlıktan daha güçlü yükselen savaşçı.",
    price: 380,
    originalPrice: 600,
    category: "title",
    rarity: "epic",
    collection: "dragon",
    glowColor: "rgba(249, 115, 22, 0.75)"
  },
  {
    id: "title_billionaire",
    name: "Zaman Milyarderi",
    desc: "En değerli varlık olan zamanı en bilgece yöneten elit odakçı.",
    price: 420,
    originalPrice: 680,
    category: "title",
    rarity: "legendary",
    collection: "royalty",
    glowColor: "rgba(251, 191, 36, 0.8)"
  },
  {
    id: "title_code_monster",
    name: "Kod Canavarı",
    desc: "Geceleri satır satır kod yazıp hata affetmeyen siber dahi.",
    price: 350,
    originalPrice: 550,
    category: "title",
    rarity: "epic",
    collection: "cyberpunk",
    glowColor: "rgba(34, 211, 238, 0.75)"
  },
  {
    id: "title_cyber_ghost",
    name: "Siber Hayalet",
    desc: "Ağlarda iz bırakmadan görevleri sessizce ve kusursuzca bitiren hacker.",
    price: 320,
    originalPrice: 500,
    category: "title",
    rarity: "epic",
    collection: "cyberpunk",
    glowColor: "rgba(16, 185, 129, 0.8)",
    badgeText: "YENİ"
  },
  {
    id: "title_visionary",
    name: "Vizyoner Lider",
    desc: "Bugünü değil 10 yıl sonrasını planlayan stratejik zihin.",
    price: 340,
    originalPrice: 520,
    category: "title",
    rarity: "epic",
    collection: "royalty",
    glowColor: "rgba(129, 140, 248, 0.75)"
  },
  {
    id: "title_discipline",
    name: "Disiplin Abidesi",
    desc: "Motivasyona ihtiyaç duymayan, hedefe her gün adım adım yürüyen çelik irade.",
    price: 300,
    originalPrice: 480,
    category: "title",
    rarity: "rare",
    collection: "essentials",
    glowColor: "rgba(52, 211, 153, 0.7)"
  },
  {
    id: "title_architect",
    name: "Sistem Mimarı",
    desc: "Kaostan kusursuz bir düzen ve üretkenlik fabrikası inşa eden usta.",
    price: 290,
    originalPrice: 450,
    category: "title",
    rarity: "rare",
    collection: "cyberpunk",
    glowColor: "rgba(56, 189, 248, 0.7)"
  },
  {
    id: "title_speed",
    name: "Hız Tutkunu",
    desc: "Görevleri ışık hızında tamamlayıp listeyi anında temizleyen yıldırım.",
    price: 280,
    originalPrice: 420,
    category: "title",
    rarity: "rare",
    collection: "synthwave",
    glowColor: "rgba(250, 204, 21, 0.7)"
  },
  {
    id: "title_pixel_champ",
    name: "Piksel Şampiyonu",
    desc: "8-bit atari salonu rekorlarını altüst eden nostaljik odak ustası.",
    price: 260,
    originalPrice: 400,
    category: "title",
    rarity: "rare",
    collection: "synthwave",
    glowColor: "rgba(192, 132, 252, 0.75)",
    badgeText: "YENİ"
  },
  {
    id: "title_zen_master",
    name: "Zen Ustası",
    desc: "Zihnini tüm gürültüden arındırıp mutlak iç huzur ve odak bulan bilge.",
    price: 260,
    originalPrice: 400,
    category: "title",
    rarity: "rare",
    collection: "anime",
    glowColor: "rgba(244, 114, 182, 0.7)"
  },
  {
    id: "title_alchemist",
    name: "Kafein Simyacısı",
    desc: "Kahveyi saf üretkenliğe ve bitmeyen odak enerjisine dönüştüren büyücü.",
    price: 250,
    originalPrice: 380,
    category: "title",
    rarity: "rare",
    collection: "essentials",
    glowColor: "rgba(245, 158, 11, 0.65)"
  },
  {
    id: "title_night_guardian",
    name: "Gece Muhafızı",
    desc: "Şehir uyurken çalışan, sessiz gecelerin en sadık üretken baykuşu.",
    price: 240,
    originalPrice: 360,
    category: "title",
    rarity: "rare",
    collection: "essentials",
    glowColor: "rgba(147, 51, 234, 0.65)"
  },
  {
    id: "title_focus_master",
    name: "Kesintisiz Odak",
    desc: "Hiçbir bildirimin ve dış etkinin dikkatini dağıtamadığı saf konsantrasyon.",
    price: 190,
    originalPrice: 300,
    category: "title",
    rarity: "common",
    collection: "essentials",
    glowColor: "rgba(255, 255, 255, 0.4)"
  }
]

export type Cs2Rarity = "blue" | "purple" | "pink" | "red" | "gold"

export interface Cs2CaseItem {
  id: string
  name: string
  subtitle: string
  desc: string
  rarity: Cs2Rarity
  rarityLabel: string
  type: "coin" | "freeze" | "booster" | "title" | "frame" | "effect"
  amount?: number
  frameId?: string
  effectId?: string
  titleName?: string
  icon: string
  hexColor: string
  bgGlow: string
  borderGlow: string
  isLoss: boolean
  isDuplicate?: boolean
  duplicateRefundAmount?: number
}

export const CS2_CASE_ITEMS: Cs2CaseItem[] = [
  // ─── 🟦 MAVİ (ASKERİ SINIF / YAYGIN) (~70%) ───
  {
    id: "cs2_coin_75",
    name: "75 Focus Para",
    subtitle: "Teselli İkramiyesi (+75 🪙)",
    desc: "Kasanın yarısı cüzdanına geri döndü. Şansını tekrar dene!",
    rarity: "blue",
    rarityLabel: "Askeri Sınıf (Mavi)",
    type: "coin",
    amount: 75,
    icon: "🪙",
    hexColor: "#4b69ff",
    bgGlow: "rgba(75, 105, 255, 0.2)",
    borderGlow: "rgba(75, 105, 255, 0.8)",
    isLoss: true
  },
  {
    id: "cs2_coin_90",
    name: "90 Focus Para",
    subtitle: "Küçük Telafi (+90 🪙)",
    desc: "Fena değil, kasa maliyetinin büyük bölümünü geri kurtardın!",
    rarity: "blue",
    rarityLabel: "Askeri Sınıf (Mavi)",
    type: "coin",
    amount: 90,
    icon: "🪙",
    hexColor: "#4b69ff",
    bgGlow: "rgba(75, 105, 255, 0.2)",
    borderGlow: "rgba(75, 105, 255, 0.8)",
    isLoss: true
  },
  {
    id: "cs2_freeze_mini",
    name: "1x Seri Dondurucu",
    subtitle: "Acil Durum Kalkanı (100 🪙 Değerinde)",
    desc: "Günün kurtarıcısı! Yoğun bir günde serini sıfırlanmaktan koruyacak kalkan.",
    rarity: "blue",
    rarityLabel: "Askeri Sınıf (Mavi)",
    type: "freeze",
    amount: 1,
    icon: "❄️",
    hexColor: "#4b69ff",
    bgGlow: "rgba(75, 105, 255, 0.2)",
    borderGlow: "rgba(75, 105, 255, 0.8)",
    isLoss: false
  },
  {
    id: "cs2_frame_neon",
    name: "Siber Neon Çerçevesi",
    subtitle: "Mağaza Çerçevesi (180 🪙 Değerinde)",
    desc: "Cam göbeği ve pembe neon ışıklarıyla parıldayan ilk klasik çerçeve.",
    rarity: "blue",
    rarityLabel: "Askeri Sınıf (Mavi)",
    type: "frame",
    frameId: "frame_neon",
    icon: "🖼️",
    hexColor: "#4b69ff",
    bgGlow: "rgba(75, 105, 255, 0.2)",
    borderGlow: "rgba(75, 105, 255, 0.8)",
    isLoss: false
  },
  {
    id: "cs2_frame_obsidian",
    name: "Obsidyen Zırhı Çerçevesi",
    subtitle: "Mağaza Çerçevesi (280 🪙 Değerinde)",
    desc: "Volkanik obsidyen taşından oyulmuş dayanıklı taktik çerçeve.",
    rarity: "blue",
    rarityLabel: "Askeri Sınıf (Mavi)",
    type: "frame",
    frameId: "frame_obsidian",
    icon: "🛡️",
    hexColor: "#4b69ff",
    bgGlow: "rgba(75, 105, 255, 0.2)",
    borderGlow: "rgba(75, 105, 255, 0.8)",
    isLoss: false
  },
  {
    id: "cs2_title_seeker",
    name: "Unvan: 'Şans Arayıcısı'",
    subtitle: "Mavi Unvan (+30 Para)",
    desc: "Kasaların gizemli kapılarını aralayan cesur odakçının unvanı.",
    rarity: "blue",
    rarityLabel: "Askeri Sınıf (Mavi)",
    type: "title",
    titleName: "Şans Arayıcısı",
    amount: 30,
    icon: "🎯",
    hexColor: "#4b69ff",
    bgGlow: "rgba(75, 105, 255, 0.2)",
    borderGlow: "rgba(75, 105, 255, 0.8)",
    isLoss: true
  },
  {
    id: "cs2_title_night",
    name: "Unvan: 'Gece Muhafızı'",
    subtitle: "Mavi Unvan (+30 Para)",
    desc: "Şehir uyurken sessizce hedeflerini tamamlayanların prestij unvanı.",
    rarity: "blue",
    rarityLabel: "Askeri Sınıf (Mavi)",
    type: "title",
    titleName: "Gece Muhafızı",
    amount: 30,
    icon: "🌙",
    hexColor: "#4b69ff",
    bgGlow: "rgba(75, 105, 255, 0.2)",
    borderGlow: "rgba(75, 105, 255, 0.8)",
    isLoss: true
  },

  // ─── 🟪 MOR (KISITLI / NADİR) (~18%) ───
  {
    id: "cs2_coin_130",
    name: "130 Focus Para",
    subtitle: "Kafa Kafaya (+130 🪙)",
    desc: "Neredeyse kasanın tüm harcamasını tek seferde amorti ettin!",
    rarity: "purple",
    rarityLabel: "Kısıtlı (Mor)",
    type: "coin",
    amount: 130,
    icon: "🪙",
    hexColor: "#8847ff",
    bgGlow: "rgba(136, 71, 255, 0.25)",
    borderGlow: "rgba(136, 71, 255, 0.85)",
    isLoss: false
  },
  {
    id: "cs2_coin_160",
    name: "160 Focus Para",
    subtitle: "Küçük Kâr! (+10 🪙 Net)",
    desc: "Kasa parasını çıkardı ve üzerine net 10 Focus Para kâr bıraktı!",
    rarity: "purple",
    rarityLabel: "Kısıtlı (Mor)",
    type: "coin",
    amount: 160,
    icon: "🪙",
    hexColor: "#8847ff",
    bgGlow: "rgba(136, 71, 255, 0.25)",
    borderGlow: "rgba(136, 71, 255, 0.85)",
    isLoss: false
  },
  {
    id: "cs2_frame_emerald",
    name: "Zümrüt Parıltısı Çerçevesi",
    subtitle: "Nadir Çerçeve (320 🪙 Değerinde)",
    desc: "Zarif ve asil yeşil ışık yayan zümrüt mücevher kenarlığı.",
    rarity: "purple",
    rarityLabel: "Kısıtlı (Mor)",
    type: "frame",
    frameId: "frame_emerald",
    icon: "💎",
    hexColor: "#8847ff",
    bgGlow: "rgba(136, 71, 255, 0.25)",
    borderGlow: "rgba(136, 71, 255, 0.85)",
    isLoss: false
  },
  {
    id: "cs2_frame_cyber",
    name: "Siber Matris Çerçevesi",
    subtitle: "Nadir Çerçeve (360 🪙 Değerinde)",
    desc: "Fütüristik dijital devreler ve neon yeşili siber matris hatları.",
    rarity: "purple",
    rarityLabel: "Kısıtlı (Mor)",
    type: "frame",
    frameId: "frame_cyber",
    icon: "🌐",
    hexColor: "#8847ff",
    bgGlow: "rgba(136, 71, 255, 0.25)",
    borderGlow: "rgba(136, 71, 255, 0.85)",
    isLoss: false
  },
  {
    id: "cs2_booster_12h",
    name: "12 Saatlik 2X Para İksiri",
    subtitle: "Nadir Görev Katlayıcı",
    desc: "12 saat boyunca tamamladığın her görevden 2 kat Focus Para kazanırsın!",
    rarity: "purple",
    rarityLabel: "Kısıtlı (Mor)",
    type: "booster",
    icon: "🧪",
    hexColor: "#8847ff",
    bgGlow: "rgba(136, 71, 255, 0.25)",
    borderGlow: "rgba(136, 71, 255, 0.85)",
    isLoss: false
  },
  {
    id: "cs2_title_spinner",
    name: "Unvan: 'Çark Döndürücü'",
    subtitle: "Nadir Prestij Unvanı",
    desc: "Kasaları korkusuzca açıp çarkı döndürenlerin unvanı.",
    rarity: "purple",
    rarityLabel: "Kısıtlı (Mor)",
    type: "title",
    titleName: "Çark Döndürücü",
    icon: "🎯",
    hexColor: "#8847ff",
    bgGlow: "rgba(136, 71, 255, 0.25)",
    borderGlow: "rgba(136, 71, 255, 0.85)",
    isLoss: false
  },

  // ─── 🌸 PEMBE (SINIFLANDIRILMIŞ / EPİK) (~8%) ───
  {
    id: "cs2_coin_280",
    name: "280 Focus Para",
    subtitle: "BÜYÜK KÂR! (+130 Net Kazanç)",
    desc: "Harika kazanç! Kasanın parasını fazlasıyla katladın!",
    rarity: "pink",
    rarityLabel: "Sınıflandırılmış (Pembe)",
    type: "coin",
    amount: 280,
    icon: "💰",
    hexColor: "#d32ce6",
    bgGlow: "rgba(211, 44, 230, 0.3)",
    borderGlow: "rgba(211, 44, 230, 0.9)",
    isLoss: false
  },
  {
    id: "cs2_freeze_3",
    name: "3'lü Seri Dondurucu Paketi",
    subtitle: "Epik Kalkan (250 🪙 Değerinde)",
    desc: "3 günlük seri dondurucu çantana eklendi, serin güvende!",
    rarity: "pink",
    rarityLabel: "Sınıflandırılmış (Pembe)",
    type: "freeze",
    amount: 3,
    icon: "🧊",
    hexColor: "#d32ce6",
    bgGlow: "rgba(211, 44, 230, 0.3)",
    borderGlow: "rgba(211, 44, 230, 0.9)",
    isLoss: false
  },
  {
    id: "cs2_frame_arcade",
    name: "8-Bit Retro Arcade Çerçevesi",
    subtitle: "Epik Çerçeve (380 🪙 Değerinde)",
    desc: "Piksel neon ışıklarıyla profiline nostaljik arcade havası kat!",
    rarity: "pink",
    rarityLabel: "Sınıflandırılmış (Pembe)",
    type: "frame",
    frameId: "frame_arcade",
    icon: "🕹️",
    hexColor: "#d32ce6",
    bgGlow: "rgba(211, 44, 230, 0.3)",
    borderGlow: "rgba(211, 44, 230, 0.9)",
    isLoss: false
  },
  {
    id: "cs2_frame_flame",
    name: "Ateş Lordu Çerçevesi",
    subtitle: "Epik Çerçeve (400 🪙 Değerinde)",
    desc: "Hiç sönmeyen canlı alev dalgalarıyla donatılmış profil çerçevesi.",
    rarity: "pink",
    rarityLabel: "Sınıflandırılmış (Pembe)",
    type: "frame",
    frameId: "frame_flame",
    icon: "🔥",
    hexColor: "#d32ce6",
    bgGlow: "rgba(211, 44, 230, 0.3)",
    borderGlow: "rgba(211, 44, 230, 0.9)",
    isLoss: false
  },
  {
    id: "cs2_title_fate",
    name: "Unvan: 'Kaderini Bükücü'",
    subtitle: "Epik Prestij Unvanı",
    desc: "Olasılıkları kendi iradesiyle lehine çeviren şans ustası!",
    rarity: "pink",
    rarityLabel: "Sınıflandırılmış (Pembe)",
    type: "title",
    titleName: "Kaderini Bükücü",
    icon: "🔮",
    hexColor: "#d32ce6",
    bgGlow: "rgba(211, 44, 230, 0.3)",
    borderGlow: "rgba(211, 44, 230, 0.9)",
    isLoss: false
  },

  // ─── 🟥 KIRMIZI (GİZLİ / EFSANEVİ) (~3%) ───
  {
    id: "cs2_coin_550",
    name: "550 Focus Para",
    subtitle: "DEV VURGUN! (+400 Net Kâr)",
    desc: "Kırmızı düştü! Sandıktan devasa bir para serveti fırladı!",
    rarity: "red",
    rarityLabel: "Gizli (Kırmızı)",
    type: "coin",
    amount: 550,
    icon: "💎",
    hexColor: "#eb4b4b",
    bgGlow: "rgba(235, 75, 75, 0.35)",
    borderGlow: "rgba(235, 75, 75, 0.95)",
    isLoss: false
  },
  {
    id: "cs2_freeze_7",
    name: "7'li Koruma Kalkanı",
    subtitle: "Efsanevi Kalkan (490 🪙 Değerinde)",
    desc: "Tam 1 haftalık kesintisiz seri kalkanı doğrudan çantana eklendi!",
    rarity: "red",
    rarityLabel: "Gizli (Kırmızı)",
    type: "freeze",
    amount: 7,
    icon: "🛡️",
    hexColor: "#eb4b4b",
    bgGlow: "rgba(235, 75, 75, 0.35)",
    borderGlow: "rgba(235, 75, 75, 0.95)",
    isLoss: false
  },
  {
    id: "cs2_frame_glitch",
    name: "Siber Glitch & Kromatik Çerçeve",
    subtitle: "Efsanevi Çerçeve (460 🪙 Değerinde)",
    desc: "RGB renk ayrışması ve siberpunk dijital glitch hatları.",
    rarity: "red",
    rarityLabel: "Gizli (Kırmızı)",
    type: "frame",
    frameId: "frame_glitch",
    icon: "👾",
    hexColor: "#eb4b4b",
    bgGlow: "rgba(235, 75, 75, 0.35)",
    borderGlow: "rgba(235, 75, 75, 0.95)",
    isLoss: false
  },
  {
    id: "cs2_frame_cosmic",
    name: "Kozmik Galaksi Çerçevesi",
    subtitle: "Efsanevi Çerçeve (550 🪙 Değerinde)",
    desc: "Derin uzay nebulalarının ve yıldız tozlarının dans ettiği efsanevi çerçeve.",
    rarity: "red",
    rarityLabel: "Gizli (Kırmızı)",
    type: "frame",
    frameId: "frame_cosmic",
    icon: "🌌",
    hexColor: "#eb4b4b",
    bgGlow: "rgba(235, 75, 75, 0.35)",
    borderGlow: "rgba(235, 75, 75, 0.95)",
    isLoss: false
  },
  {
    id: "cs2_title_jackpot",
    name: "Unvan: 'Jackpot Lordu'",
    subtitle: "Efsanevi Prestij Unvanı",
    desc: "Kırmızı rengi yakalayan mutlak şans ve odak efendisi.",
    rarity: "red",
    rarityLabel: "Gizli (Kırmızı)",
    type: "title",
    titleName: "Jackpot Lordu",
    icon: "👑",
    hexColor: "#eb4b4b",
    bgGlow: "rgba(235, 75, 75, 0.35)",
    borderGlow: "rgba(235, 75, 75, 0.95)",
    isLoss: false
  },

  // ─── 🟨 ALTIN (★ ÖZEL NADİR ÖĞE - BIÇAK / ELDİVEN KALİBRESİ) (~1%) ───
  {
    id: "cs2_gold_1000",
    name: "★ 1,000 FOCUS PARA MEGA ÖDÜL ★",
    subtitle: "ÖZEL ALTIN SERVET! (+850 Net Kâr)",
    desc: "İNANILMAZ BİR DÜŞÜŞ! Kasadan maksimum altın servet çıktı!",
    rarity: "gold",
    rarityLabel: "★ Özel Nadir Öğe ★",
    type: "coin",
    amount: 1000,
    icon: "🌟",
    hexColor: "#ffd700",
    bgGlow: "rgba(255, 215, 0, 0.4)",
    borderGlow: "rgba(255, 215, 0, 1)",
    isLoss: false
  },
  {
    id: "cs2_gold_effect",
    name: "★ Altın Yağmuru Profil Efekti ★",
    subtitle: "Efsanevi Hareketli Efekt (550 🪙 Değerinde)",
    desc: "Gökten yağan parıltılı altın paralar profilinde canlanır!",
    rarity: "gold",
    rarityLabel: "★ Özel Nadir Öğe ★",
    type: "effect",
    effectId: "effect_gold",
    icon: "✨",
    hexColor: "#ffd700",
    bgGlow: "rgba(255, 215, 0, 0.4)",
    borderGlow: "rgba(255, 215, 0, 1)",
    isLoss: false
  },
  {
    id: "cs2_gold_dragon",
    name: "★ Kadim Ejder Alevleri Çerçevesi ★",
    subtitle: "En Nadir Altın Çerçeve (520 🪙 Değerinde)",
    desc: "Etrafında kızıl ejder kanatları ve kor alev auraları taşır!",
    rarity: "gold",
    rarityLabel: "★ Özel Nadir Öğe ★",
    type: "frame",
    frameId: "frame_dragon",
    icon: "🐉",
    hexColor: "#ffd700",
    bgGlow: "rgba(255, 215, 0, 0.4)",
    borderGlow: "rgba(255, 215, 0, 1)",
    isLoss: false
  },
  {
    id: "cs2_title_god",
    name: "★ Unvan: 'Şans Tanrısı' ★",
    subtitle: "Gizli Altın Prestij Unvanı",
    desc: "Milyonda bir gelen altın düşüşü başaran mutlak şans tanrısı!",
    rarity: "gold",
    rarityLabel: "★ Özel Nadir Öğe ★",
    type: "title",
    titleName: "Şans Tanrısı",
    icon: "⚡",
    hexColor: "#ffd700",
    bgGlow: "rgba(255, 215, 0, 0.4)",
    borderGlow: "rgba(255, 215, 0, 1)",
    isLoss: false
  }
]

export interface MysteryBoxResult {
  type: "coin" | "freeze" | "booster" | "title"
  amount?: number
  name: string
  desc: string
  icon: string
  color: string
}

export function useShop() {
  const { settings, updateSettings } = useSettings()
  const { showToast } = useToast()

  const focusCoins = settings.focusCoins ?? 100
  const streakFreezes = settings.streakFreezes ?? 3
  const inventory = React.useMemo(() => settings.inventory || [], [settings.inventory])
  const equippedFrame = settings.equippedFrame || null
  const equippedTitle = settings.equippedTitle || null
  const equippedProfileEffect = settings.equippedProfileEffect || null
  const purchases = React.useMemo(() => settings.purchases || [], [settings.purchases])

  const getReturnStatus = React.useCallback(
    (itemId: string) => {
      const p = purchases.find((x) => x.itemId === itemId)
      if (!p) return { canReturn: false, remainingMs: 0, purchase: null }
      const diff = Date.now() - p.timestamp
      const remainingMs = Math.max(0, RETURN_WINDOW_MS - diff)
      return {
        canReturn: remainingMs > 0,
        remainingMs,
        purchase: p
      }
    },
    [purchases]
  )

  // ─── DAILY FREE GIFT SYSTEM (24H COOLDOWN) ───
  const [canClaimDailyGift, setCanClaimDailyGift] = React.useState(false)
  const [dailyGiftTimeRemaining, setDailyGiftTimeRemaining] = React.useState(0)

  React.useEffect(() => {
    const checkDailyGift = () => {
      try {
        const lastClaimStr = localStorage.getItem("focusflow_last_daily_gift")
        const lastClaim = lastClaimStr ? parseInt(lastClaimStr, 10) : 0
        const now = Date.now()
        const DAY_MS = 24 * 60 * 60 * 1000
        const elapsed = now - lastClaim
        if (elapsed >= DAY_MS) {
          setCanClaimDailyGift(true)
          setDailyGiftTimeRemaining(0)
        } else {
          setCanClaimDailyGift(false)
          setDailyGiftTimeRemaining(DAY_MS - elapsed)
        }
      } catch {
        setCanClaimDailyGift(true)
      }
    }
    checkDailyGift()
    const interval = setInterval(checkDailyGift, 1000)
    return () => clearInterval(interval)
  }, [])

  const claimDailyGift = React.useCallback(() => {
    if (!canClaimDailyGift) return null
    const isCoin = Math.random() > 0.25
    const coinAmount = Math.floor(Math.random() * 31) + 20 // 20 - 50 coins
    const now = Date.now()

    try {
      localStorage.setItem("focusflow_last_daily_gift", now.toString())
    } catch {}

    setCanClaimDailyGift(false)
    setDailyGiftTimeRemaining(24 * 60 * 60 * 1000)

    if (isCoin) {
      updateSettings({ focusCoins: focusCoins + coinAmount })
      showToast({
        type: "success",
        message: `🎁 Günlük Ücretsiz Kasa Açıldı! +${coinAmount} Focus Para kazandın!`
      })
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
      return { amount: coinAmount, message: `+${coinAmount} Focus Para`, type: "coin" }
    } else {
      updateSettings({ streakFreezes: streakFreezes + 1 })
      showToast({
        type: "success",
        message: `🎁 Günlük Ücretsiz Kasa Açıldı! 1x Seri Dondurucu Kalkanı kazandın!`
      })
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
      return { amount: 1, message: "1x Seri Dondurucu", type: "freeze" }
    }
  }, [canClaimDailyGift, focusCoins, streakFreezes, updateSettings, showToast])

  // ─── MULTI-TIER CS2 CASE OPENING ───
  const openCs2Case = React.useCallback((tierId: CaseTierId = "case_operation"): Cs2CaseItem | null => {
    const tier = CASE_TIERS[tierId] || CASE_TIERS.case_operation

    if (focusCoins < tier.price) {
      showToast({
        type: "error",
        message: `Yetersiz Focus Para! "${tier.name}" için en az ${tier.price} Para gerekir.`
      })
      return null
    }

    const rand = Math.random()
    let targetRarity: Cs2Rarity
    const odds = tier.odds

    if (rand < odds.blue) {
      targetRarity = "blue"
    } else if (rand < odds.blue + odds.purple) {
      targetRarity = "purple"
    } else if (rand < odds.blue + odds.purple + odds.pink) {
      targetRarity = "pink"
    } else if (rand < odds.blue + odds.purple + odds.pink + odds.red) {
      targetRarity = "red"
    } else {
      targetRarity = "gold"
    }

    const pool = CS2_CASE_ITEMS.filter((i) => i.rarity === targetRarity)
    
    // Check if user already owns cosmetic
    const isItemOwned = (item: Cs2CaseItem) => {
      if (item.type === "frame" && item.frameId) return inventory.includes(item.frameId)
      if (item.type === "effect" && item.effectId) return inventory.includes(item.effectId)
      if (item.type === "title") return inventory.includes(`title_${item.id}`)
      return false
    }

    // Smart Duplicate Prevention: Prioritize unowned items in the target rarity tier
    const unownedPool = pool.filter((i) => !isItemOwned(i))
    let selected: Cs2CaseItem
    let isDuplicate = false

    if (unownedPool.length > 0) {
      selected = unownedPool[Math.floor(Math.random() * unownedPool.length)]
    } else {
      // User owns all items in this rarity tier: pick random and trigger duplicate refund!
      selected = pool[Math.floor(Math.random() * pool.length)] || CS2_CASE_ITEMS[0]
      if (isItemOwned(selected)) {
        isDuplicate = true
      }
    }

    // Base cost deduction
    let nextCoins = focusCoins - tier.price

    // ── DUPLICATE REFUND PROTECTION ──
    // If an item is duplicate, refund 60% of case cost immediately so user's luck isn't wasted!
    let duplicateRefund = 0
    if (isDuplicate) {
      duplicateRefund = Math.round(tier.price * 0.6)
      nextCoins += duplicateRefund
      selected = {
        ...selected,
        isDuplicate: true,
        duplicateRefundAmount: duplicateRefund
      }
      showToast({
        type: "info",
        message: `🔁 Yinelenen Eşya Telafisi: "${selected.name}" sende zaten var! +${duplicateRefund} Focus Para telafi ödendi.`
      })
    }

    // Check if user has lucky insurance active
    try {
      const hasLuckyInsurance = localStorage.getItem("focusflow_booster_lucky_insurance_active") === "true"
      if (hasLuckyInsurance && selected.isLoss) {
        const refund = Math.round(tier.price * 0.5)
        nextCoins += refund
        showToast({ type: "info", message: `🛡️ Şans Sigortası devreye girdi! +${refund} 🪙 geri ödendi.` })
      }
    } catch {}

    let nextFreezes = streakFreezes
    let nextInventory = [...inventory]
    let nextTitle = equippedTitle
    let nextFrame = equippedFrame
    let nextEffect = equippedProfileEffect

    if (selected.type === "coin") {
      nextCoins += selected.amount || 0
    } else if (selected.type === "freeze") {
      nextFreezes += selected.amount || 1
    } else if (selected.type === "booster") {
      const nextExpiry = Date.now() + 12 * 60 * 60 * 1000
      try {
        localStorage.setItem("focusflow_booster_coin_2x", nextExpiry.toString())
      } catch {}
    } else if (selected.type === "title" && selected.titleName) {
      if (selected.amount) nextCoins += selected.amount
      const titleId = `title_${selected.id}`
      if (!nextInventory.includes(titleId)) nextInventory.push(titleId)
    } else if (selected.type === "frame" && selected.frameId) {
      if (!nextInventory.includes(selected.frameId)) nextInventory.push(selected.frameId)
    } else if (selected.type === "effect" && selected.effectId) {
      if (!nextInventory.includes(selected.effectId)) nextInventory.push(selected.effectId)
    }

    updateSettings({
      focusCoins: nextCoins,
      streakFreezes: nextFreezes,
      inventory: nextInventory,
      equippedTitle: nextTitle,
      equippedFrame: nextFrame,
      equippedProfileEffect: nextEffect
    })

    if (selected.rarity === "gold" || selected.rarity === "red") {
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } })
    }

    return selected
  }, [focusCoins, streakFreezes, inventory, equippedTitle, equippedFrame, equippedProfileEffect, updateSettings, showToast])

  // ─── QUICKSELL (EŞYAYI FOCUS PARASINA BOZDURMA) ───
  const quicksellItem = React.useCallback((item: Cs2CaseItem, tierPrice = 150) => {
    const coinValue = Math.round(tierPrice * 0.75)
    let nextInventory = [...inventory]

    if (item.frameId) nextInventory = nextInventory.filter((id) => id !== item.frameId)
    if (item.effectId) nextInventory = nextInventory.filter((id) => id !== item.effectId)
    if (item.titleName) nextInventory = nextInventory.filter((id) => id !== `title_${item.id}`)

    updateSettings({
      focusCoins: focusCoins + coinValue,
      inventory: nextInventory
    })

    showToast({
      type: "success",
      message: `💰 "${item.name}" bozduruldu! +${coinValue} Focus Para hesabına eklendi.`
    })
    return coinValue
  }, [focusCoins, inventory, updateSettings, showToast])

  // Backward-compatible openMysteryBox
  const openMysteryBox = React.useCallback((): MysteryBoxResult | null => {
    const item = openCs2Case("case_operation")
    if (!item) return null
    return {
      type: item.type === "coin" ? "coin" : item.type === "freeze" ? "freeze" : item.type === "booster" ? "booster" : "title",
      amount: item.amount,
      name: item.name,
      desc: item.desc,
      icon: item.icon,
      color: item.rarity === "gold" ? "text-yellow-400" : item.rarity === "red" ? "text-red-400" : item.rarity === "pink" ? "text-pink-400" : item.rarity === "purple" ? "text-purple-400" : "text-blue-400"
    }
  }, [openCs2Case])

  const buyItem = React.useCallback(
    (item: ShopItem) => {
      if (focusCoins < item.price) {
        showToast({
          type: "error",
          message: `Yetersiz Focus Para! "${item.name}" için ${item.price - focusCoins} Para daha gerekli.`
        })
        return false
      }

      // Check if item or bundle items are already owned
      if (item.category === "frame" || item.category === "effect" || item.category === "title") {
        if (inventory.includes(item.id)) {
          showToast({ type: "warning", message: "Bu kozmetik eşyaya zaten sahipsin!" })
          return false
        }
      }

      const newPurchase = {
        id: `pur_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemId: item.id,
        price: item.price,
        timestamp: Date.now(),
        count: item.id === "freeze_epic_pack" ? 7 : item.id === "freeze_bundle" ? 3 : item.id === "freeze_single" ? 1 : 1
      }

      if (item.category === "bundle") {
        const bundleIds = item.bundleItemIds || []
        const nextInventory = Array.from(new Set([...inventory, item.id, ...bundleIds]))
        
        updateSettings({
          focusCoins: focusCoins - item.price,
          inventory: nextInventory,
          purchases: [newPurchase, ...purchases]
        })
        showToast({
          type: "success",
          message: `🎉 "${item.name}" paketi açıldı! Tüm eşyalar envanterine eklendi.`
        })
      } else if (item.category === "utility") {
        let freezeIncrement = 0
        if (item.id === "freeze_single") freezeIncrement = 1
        else if (item.id === "freeze_bundle") freezeIncrement = 3
        else if (item.id === "freeze_epic_pack") freezeIncrement = 7

        if (item.id.startsWith("booster_")) {
          const durationMs = 24 * 60 * 60 * 1000
          const currentExpiry = parseInt(localStorage.getItem(`focusflow_${item.id}`) || "0", 10)
          const nextExpiry = Math.max(Date.now(), currentExpiry) + durationMs
          localStorage.setItem(`focusflow_${item.id}`, nextExpiry.toString())
        }

        if (item.id === "streak_saver_pro") {
          const currentStreak = settings.streakCount || 0
          updateSettings({ streakCount: Math.max(1, currentStreak + 1) })
        }

        updateSettings({
          focusCoins: focusCoins - item.price,
          streakFreezes: streakFreezes + freezeIncrement,
          purchases: [newPurchase, ...purchases]
        })

        showToast({
          type: "success",
          message: `🎉 "${item.name}" başarıyla satın alındı!`
        })
      } else {
        // Frame, Effect, Title
        const nextInventory = [...inventory, item.id]
        const updates: any = {
          focusCoins: focusCoins - item.price,
          inventory: nextInventory,
          purchases: [newPurchase, ...purchases]
        }

        if (item.category === "frame" && !equippedFrame) updates.equippedFrame = item.id
        if (item.category === "effect" && !equippedProfileEffect) updates.equippedProfileEffect = item.id
        if (item.category === "title" && !equippedTitle) updates.equippedTitle = item.name

        updateSettings(updates)
        showToast({ type: "success", message: `🎉 "${item.name}" satın alındı!` })
      }

      confetti({ particleCount: 50, spread: 75, origin: { y: 0.7 } })
      return true
    },
    [focusCoins, streakFreezes, inventory, equippedFrame, equippedTitle, equippedProfileEffect, purchases, updateSettings, showToast, settings.streakCount]
  )

  const returnItem = React.useCallback(
    (item: ShopItem) => {
      const { canReturn, purchase } = getReturnStatus(item.id)

      if (!canReturn || !purchase) {
        showToast({
          type: "error",
          message: "Bu ürünün 3 günlük iade süresi dolmuştur veya iade edilemez."
        })
        return false
      }

      if (item.category === "bundle") {
        const bundleIds = item.bundleItemIds || []
        const nextInventory = inventory.filter((id) => id !== item.id && !bundleIds.includes(id))
        const remainingPurchases = purchases.filter((p) => p.id !== purchase.id)
        const updates: any = {
          focusCoins: focusCoins + purchase.price,
          inventory: nextInventory,
          purchases: remainingPurchases
        }
        if (bundleIds.includes(equippedFrame || "")) updates.equippedFrame = null
        if (bundleIds.includes(equippedProfileEffect || "")) updates.equippedProfileEffect = null
        if (bundleIds.some((id) => SHOP_ITEMS.find((it) => it.id === id)?.name === equippedTitle)) updates.equippedTitle = null

        updateSettings(updates)
        showToast({
          type: "success",
          message: `↩️ "${item.name}" iade edildi! +${purchase.price} Focus Para iade edildi.`
        })
        return true
      }

      if (item.category === "utility") {
        const freezeCount = purchase.count || (item.id === "freeze_epic_pack" ? 7 : item.id === "freeze_bundle" ? 3 : item.id === "freeze_single" ? 1 : 0)
        if (freezeCount > 0 && streakFreezes < freezeCount) {
          showToast({
            type: "error",
            message: "Kullanılmış dondurucular iade edilemez! Hesabında yeterli dondurucu bulunmuyor."
          })
          return false
        }

        const remainingPurchases = purchases.filter((p) => p.id !== purchase.id)
        updateSettings({
          focusCoins: focusCoins + purchase.price,
          streakFreezes: streakFreezes - freezeCount,
          purchases: remainingPurchases
        })

        showToast({
          type: "success",
          message: `↩️ "${item.name}" iade edildi! +${purchase.price} Focus Para hesabına aktarıldı.`
        })
        return true
      }

      // Single cosmetic / effect / title
      const remainingPurchases = purchases.filter((p) => p.id !== purchase.id)
      const nextInventory = inventory.filter((id) => id !== item.id)
      const updates: any = {
        focusCoins: focusCoins + purchase.price,
        inventory: nextInventory,
        purchases: remainingPurchases
      }

      if (equippedFrame === item.id) updates.equippedFrame = null
      if (equippedProfileEffect === item.id) updates.equippedProfileEffect = null
      if (equippedTitle === item.name) updates.equippedTitle = null

      updateSettings(updates)
      showToast({
        type: "success",
        message: `↩️ "${item.name}" iade edildi! +${purchase.price} Focus Para hesabına aktarıldı.`
      })
      return true
    },
    [getReturnStatus, streakFreezes, purchases, focusCoins, inventory, equippedFrame, equippedProfileEffect, equippedTitle, updateSettings, showToast]
  )

  const equipItem = React.useCallback(
    (item: ShopItem) => {
      if (item.category === "frame") {
        const isEquipped = equippedFrame === item.id
        updateSettings({ equippedFrame: isEquipped ? null : item.id })
        showToast({ type: "success", message: isEquipped ? "Çerçeve çıkarıldı" : `"${item.name}" kuşanıldı!` })
      } else if (item.category === "effect") {
        const isEquipped = equippedProfileEffect === item.id
        updateSettings({ equippedProfileEffect: isEquipped ? null : item.id })
        showToast({ type: "success", message: isEquipped ? "Profil efekti kaldırıldı" : `"${item.name}" profil efekti kuşanıldı!` })
      } else if (item.category === "title") {
        const isEquipped = equippedTitle === item.name
        updateSettings({ equippedTitle: isEquipped ? null : item.name })
        showToast({ type: "success", message: isEquipped ? "Unvan kaldırıldı" : `"${item.name}" unvanı kuşanıldı!` })
      }
    },
    [equippedFrame, equippedProfileEffect, equippedTitle, updateSettings, showToast]
  )

  const equipBundle = React.useCallback(
    (bundle: ShopItem) => {
      if (!bundle.bundleItemIds) return
      const frameItem = SHOP_ITEMS.find((it) => it.category === "frame" && bundle.bundleItemIds?.includes(it.id))
      const effectItem = SHOP_ITEMS.find((it) => it.category === "effect" && bundle.bundleItemIds?.includes(it.id))
      const titleItem = SHOP_ITEMS.find((it) => it.category === "title" && bundle.bundleItemIds?.includes(it.id))

      const updates: any = {}
      if (frameItem) updates.equippedFrame = frameItem.id
      if (effectItem) updates.equippedProfileEffect = effectItem.id
      if (titleItem) updates.equippedTitle = titleItem.name

      updateSettings(updates)
      showToast({
        type: "success",
        message: `✨ "${bundle.name}" seti tamamen kuşanıldı!`
      })
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
    },
    [updateSettings, showToast]
  )

  return {
    focusCoins,
    inventory,
    equippedFrame,
    equippedTitle,
    equippedProfileEffect,
    streakFreezes,
    purchases,
    shopItems: SHOP_ITEMS,
    buyItem,
    returnItem,
    getReturnStatus,
    equipItem,
    equipBundle,
    openMysteryBox,
    openCs2Case,
    quicksellItem,
    canClaimDailyGift,
    claimDailyGift,
    dailyGiftTimeRemaining,
    caseTiers: CASE_TIERS,
    cs2CaseItems: CS2_CASE_ITEMS
  }
}
