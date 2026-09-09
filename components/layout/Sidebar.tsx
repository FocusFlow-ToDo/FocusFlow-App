"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Target, CalendarDays, ListTodo, BarChart2, Settings, LogOut, PanelLeftClose, PanelLeft, Trash2, Archive, Award, Users, FolderKanban, ShoppingBag, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"
import { SidebarContextMenu } from "./SidebarContextMenu"

const NAV_ITEMS = [
  { id: "focus", name: "Focus", href: "/", icon: Target },
  { id: "planner", name: "Planlayıcı", href: "/planner", icon: CalendarDays },
  { id: "tasks", name: "Görevler", href: "/tasks", icon: ListTodo },
  { id: "projects", name: "Projelerim", href: "/projects", icon: FolderKanban },
  { id: "shop", name: "Mağaza", href: "/shop", icon: ShoppingBag },
  { id: "profile", name: "Profilim", href: "/profile", icon: User },
  { id: "achievements", name: "Başarımlar", href: "/achievements", icon: Award },
  { id: "community", name: "Topluluk", href: "/community", icon: Users },
  { id: "analytics", name: "Analizler", href: "/analytics", icon: BarChart2 },
  { id: "archive", name: "Arşiv", href: "/archive", icon: Archive },
  { id: "trash", name: "Çöp Kutusu", href: "/trash", icon: Trash2 },
]

export function Sidebar() {
  const { settings, updateSettings } = useSettings()
  const collapsed = settings.sidebarCollapsed
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const [menuOpen, setMenuOpen] = React.useState(false)
  const [menuCoords, setMenuCoords] = React.useState({ x: 0, y: 0 })

  const filteredNavItems = React.useMemo(() => {
    return NAV_ITEMS.filter(item => {
      // settings.tabs might not exist on older localstorage, default to true
      const tabs = settings.tabs || {
        focus: true,
        planner: true,
        tasks: true,
        projects: true,
        shop: true,
        profile: true,
        achievements: true,
        community: true,
        analytics: true,
        archive: true,
        trash: true
      }
      return (tabs as any)[item.id] !== false
    })
  }, [settings.tabs])

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      onContextMenu={(e) => {
        e.preventDefault()
        setMenuCoords({ x: e.clientX, y: e.clientY })
        setMenuOpen(true)
      }}
      className={cn(
        "h-screen flex flex-col pt-10 overflow-hidden flex-shrink-0 z-50", 
        "bg-[#09090b]/40 border-r border-white/[0.04] backdrop-blur-2xl"
      )}
    >
      <div className="flex items-center h-14 px-4 mb-6 flex-shrink-0">
        <button 
          onClick={() => updateSettings({ sidebarCollapsed: !collapsed })} 
          className="p-2.5 rounded-xl transition-all duration-200 text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-95"
        >
          {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, width: 0, paddingLeft: 0 }} 
              animate={{ opacity: 1, width: "auto", paddingLeft: 12 }} 
              exit={{ opacity: 0, width: 0, paddingLeft: 0 }}
              transition={{ duration: 0.2 }} 
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center relative group flex-shrink-0">
                <img src="/logo.png" alt="logo" className="w-6 h-6 object-contain relative z-10" />
                <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-white uppercase tracking-[0.1em] whitespace-nowrap block">FocusFlow</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto no-scrollbar">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname === `${item.href}/`)
          return (
            <Link key={item.href} href={item.href} className="relative block outline-none group/item">
              <div className={cn(
                "flex items-center h-11 rounded-xl transition-all duration-300 relative overflow-hidden px-[18px]",
                isActive 
                  ? "bg-white/[0.06] text-white border border-white/[0.08] shadow-xl shadow-black/20" 
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04]",
              )}>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-indicator" 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-6 accent-bg rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }} 
                  />
                )}
                <item.icon className={cn(
                  "w-[20px] h-[20px] flex-shrink-0 transition-all duration-300", 
                  isActive ? "accent-text stroke-[2.5]" : "group-hover/item:text-zinc-300"
                )} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div 
                      initial={{ opacity: 0, width: 0 }} 
                      animate={{ opacity: 1, width: "auto" }} 
                      exit={{ opacity: 0, width: 0 }} 
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      <span className="text-[14px] font-semibold tracking-wide ml-4 block">
                        {item.name}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-6 space-y-1.5 flex-shrink-0">
        <div className="h-px bg-white/[0.04] mx-2 mb-4" />
        <Link href="/settings" className="block outline-none group/item">
          <div className={cn(
            "flex items-center h-11 rounded-xl transition-all duration-300 border border-transparent px-[18px]",
            (pathname === "/settings" || pathname === "/settings/") 
              ? "bg-white/[0.06] text-white border-white/[0.08] shadow-lg" 
              : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] hover:border-white/[0.04]"
          )}>
            <Settings className="w-[20px] h-[20px] flex-shrink-0 transition-colors duration-300" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }} 
                  animate={{ opacity: 1, width: "auto" }} 
                  exit={{ opacity: 0, width: 0 }} 
                  className="overflow-hidden whitespace-nowrap"
                >
                  <span className="text-[14px] font-semibold tracking-wide ml-4 block">
                    Ayarlar
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>
        <button 
          onClick={async () => { await logout(); router.push("/login") }}
          className={cn(
            "w-full flex items-center h-11 rounded-xl transition-all duration-300 group/item border border-transparent px-[18px]",
            "text-zinc-600 hover:text-rose-400 hover:bg-rose-500/[0.08] hover:border-rose-500/10"
          )}
        >
          <LogOut className="w-[20px] h-[20px] flex-shrink-0 transition-colors duration-300" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: "auto" }} 
                exit={{ opacity: 0, width: 0 }} 
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-[14px] font-semibold tracking-wide ml-4 block">
                  Çıkış Yap
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <SidebarContextMenu 
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        coords={menuCoords}
      />
    </motion.aside>
  )
}