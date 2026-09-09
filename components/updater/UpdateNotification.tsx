"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, Download, RefreshCw, X, ArrowUpCircle, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

interface UpdaterEventData {
  status: "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error"
  version?: string
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
  releaseNotes?: string
  releaseUrl?: string
  error?: string
  isDev?: boolean
}

export function UpdateNotification() {
  const [updateState, setUpdateState] = React.useState<UpdaterEventData>({ status: "idle" })
  const [dismissed, setDismissed] = React.useState(false)
  const [installing, setInstalling] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || !(window as any).electron) return

    const handleUpdaterStatus = (data: UpdaterEventData) => {
      // If we received an update status, reset dismissed state so the user sees it
      if (data.status === "available" || data.status === "downloaded" || data.status === "downloading") {
        setDismissed(false)
      }
      setUpdateState(data)
    }

    ;(window as any).electron.ipcRenderer.on("updater-status", handleUpdaterStatus)

    return () => {
      ;(window as any).electron.ipcRenderer.removeListener("updater-status", handleUpdaterStatus)
    }
  }, [])

  const handleInstall = async () => {
    if (typeof window === "undefined" || !(window as any).electron) return
    setInstalling(true)
    try {
      await (window as any).electron.ipcRenderer.invoke("install-update")
    } catch (err) {
      console.error("Install update failed:", err)
      setInstalling(false)
    }
  }

  // Only show notification for available, downloading, or downloaded states
  const shouldShow =
    !dismissed &&
    (updateState.status === "available" ||
      updateState.status === "downloading" ||
      updateState.status === "downloaded")

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full"
        >
          <div className="relative rounded-2xl p-4 bg-[#12121a]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400" />

            {/* Header & Close Button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
                  {updateState.status === "downloaded" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  ) : updateState.status === "downloading" ? (
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-blue-200" />
                  )}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-white leading-tight">
                    {updateState.status === "downloaded"
                      ? "Güncelleme Yüklenmeye Hazır!"
                      : updateState.status === "downloading"
                      ? "Yeni Sürüm İndiriliyor..."
                      : "Yeni Sürüm Mevcut!"}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                    {updateState.version ? `v${updateState.version.replace(/^v/, "")}` : "En son FocusFlow güncellemesi"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDismissed(true)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
                title="Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Downloading Progress Bar */}
            {updateState.status === "downloading" && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>İndiriliyor</span>
                  <span className="font-bold text-blue-400">{updateState.percent || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${updateState.percent || 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-3.5 flex items-center gap-2">
              {updateState.status === "downloaded" && (
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={installing}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-[12px] h-9 shadow-lg shadow-emerald-500/20"
                >
                  <ArrowUpCircle className="w-4 h-4 mr-1.5" />
                  {installing ? "Yeniden Başlatılıyor..." : "Yeniden Başlat ve Güncelle"}
                </Button>
              )}

              {updateState.status === "available" && updateState.isDev && (
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-[12px] h-9 shadow-lg shadow-blue-500/20"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  GitHub Release Sayfasına Git
                </Button>
              )}

              {updateState.status === "available" && !updateState.isDev && (
                <p className="text-[11px] text-zinc-400 italic">
                  Güncelleme arka planda otomatik olarak indiriliyor...
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
