"use client"

import * as React from "react"
import {
  Target, Flag, Zap, Star, Flame, Bookmark, Bell, Anchor, Crown,
  Briefcase, Laptop, LineChart, FileText, Layout, Code, Terminal, Database,
  User, Heart, Home, GraduationCap, Map, Camera, Music, Headphones,
  Activity, HeartPulse, Dumbbell, Apple, GlassWater,
  Palette, PenTool, Brush, Image as ImageIcon, Video, Mic,
  Clock, Calendar, Hourglass, Timer,
  ShoppingBag, CreditCard, Gift, Sun, Moon, Cloud, TreePine, Coffee,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

export const ICON_MAP: Record<string, LucideIcon> = {
  Target, Flag, Zap, Star, Flame, Bookmark, Bell, Anchor, Crown,
  Briefcase, Laptop, LineChart, FileText, Layout, Code, Terminal, Database,
  User, Heart, Home, GraduationCap, Map, Camera, Music, Headphones,
  Activity, HeartPulse, Dumbbell, Apple, GlassWater,
  Palette, PenTool, Brush, Image: ImageIcon, Video, Mic,
  Clock, Calendar, Hourglass, Timer,
  ShoppingBag, CreditCard, Gift, Sun, Moon, Cloud, TreePine, Coffee
}

export const SYMBOL_GROUPS = [
  { name: "Popüler", icons: ["Target", "Briefcase", "User", "Heart", "Star", "Zap", "Flame", "Coffee"] },
  { name: "İş & Üretkenlik", icons: ["Briefcase", "Laptop", "LineChart", "FileText", "Layout", "Code", "Database", "Terminal"] },
  { name: "Kişisel & Ev", icons: ["User", "Heart", "Home", "GraduationCap", "Map", "Camera", "ShoppingBag", "Gift"] },
  { name: "Sağlık & Yaşam", icons: ["Activity", "HeartPulse", "Dumbbell", "Apple", "GlassWater", "Sun", "Moon", "TreePine"] },
  { name: "Zaman & Plan", icons: ["Clock", "Calendar", "Hourglass", "Timer", "Bell", "Anchor", "Star", "Bookmark"] },
  { name: "Yaratıcılık", icons: ["Palette", "PenTool", "Brush", "Image", "Video", "Mic", "Music", "Headphones"] }
]

interface CategorySymbolProps {
  symbol: string | null | undefined
  className?: string
}

export function CategorySymbol({ symbol, className }: CategorySymbolProps) {
  if (!symbol) return <span className={cn("text-[1.2em]", className)}>📌</span>

  if (symbol.startsWith("http") || symbol.startsWith("https")) {
    return (
      <img 
        src={symbol} 
        className={cn("w-[1.25em] h-[1.25em] object-contain rounded-md shadow-sm", className)} 
        alt="" 
      />
    )
  }

  const Icon = ICON_MAP[symbol]
  if (Icon) {
    return <Icon className={cn("w-[1.25em] h-[1.25em]", className)} />
  }

  return <span className={cn("text-[1.2em] leading-none", className)}>{symbol}</span>
}
