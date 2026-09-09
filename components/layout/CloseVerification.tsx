"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, LogOut, Minimize2 } from "lucide-react"
import { useSettings } from "@/hooks/useSettings"

export function CloseVerification() {
  const [isOpen, setIsOpen] = React.useState(false)
  const { settings } = useSettings()

  React.useEffect(() => {
    if (typeof window === "undefined" || !(window as any).electron) return

    const handler = () => setIsOpen(true)
    ;(window as any).electron.ipcRenderer.on("attempt-close", handler)

    return () => {
      ;(window as any).electron.ipcRenderer.removeListener("attempt-close", handler)
    }
  }, [])

  const handleQuit = () => {
    if ((window as any).electron) {
      (window as any).electron.ipcRenderer.send("app-quit")
    }
  }

  const handleTray = () => {
    setIsOpen(false)
    if ((window as any).electron) {
      (window as any).electron.ipcRenderer.send("app-hide")
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm glass-card p-8 rounded-[32px] border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] text-center overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
            <LogOut className="w-8 h-8 text-zinc-400" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Çıkış Yapılsın mı?</h3>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Uygulamayı tamamen kapatmak mı istiyorsunuz, yoksa arka planda çalışmaya devam mı etsin?
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleTray}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
            >
              <Minimize2 className="w-4 h-4 opacity-60" />
              Sistem Tepsisine Küçült
            </button>
            <button
              onClick={handleQuit}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-sm font-bold text-red-400 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4 opacity-60" />
              Tamamen Çıkış Yap
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-2 text-xs font-bold text-zinc-600 hover:text-zinc-400 p-2 transition-colors"
            >
              İptal
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
