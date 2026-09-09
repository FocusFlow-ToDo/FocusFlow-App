"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Download, RefreshCw, X, ArrowUpCircle, CheckCircle2,
  AlertTriangle, Rocket, Zap
} from "lucide-react"
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
  downloadUrl?: string
  downloadSize?: number
  error?: string
  isDev?: boolean
  installerPath?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function UpdateNotification() {
  const [updateState, setUpdateState] = React.useState<UpdaterEventData>({ status: "idle" })
  const [dismissed, setDismissed] = React.useState(false)
  const [installing, setInstalling] = React.useState(false)
  const [isDownloading, setIsDownloading] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || !(window as any).electron) return

    const handleUpdaterStatus = (data: UpdaterEventData) => {
      if (data.status === "available" || data.status === "downloaded" || data.status === "downloading") {
        setDismissed(false)
      }
      if (data.status === "downloaded") {
        setIsDownloading(false)
      }
      setUpdateState(data)
    }

    ;(window as any).electron.ipcRenderer.on("updater-status", handleUpdaterStatus)

    return () => {
      ;(window as any).electron.ipcRenderer.removeListener("updater-status", handleUpdaterStatus)
    }
  }, [])

  const handleDownload = async () => {
    if (typeof window === "undefined" || !(window as any).electron) return
    if (!updateState.downloadUrl) return
    setIsDownloading(true)
    try {
      await (window as any).electron.ipcRenderer.invoke("download-update", updateState.downloadUrl)
    } catch (err) {
      console.error("Download failed:", err)
      setIsDownloading(false)
    }
  }

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

  const shouldShow =
    !dismissed &&
    (updateState.status === "available" ||
      updateState.status === "downloading" ||
      updateState.status === "downloaded" ||
      updateState.status === "error")

  const percent = updateState.percent || 0
  const versionStr = updateState.version ? `v${updateState.version.replace(/^v/, "")}` : ""

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="fixed bottom-5 right-5 z-[9999] w-[360px]"
        >
          {/* Main Container — matches app's glass-card style */}
          <div className="relative rounded-2xl overflow-hidden glass-card" style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            boxShadow: "0 25px 60px -12px rgba(0,0,0,0.7), 0 0 1px rgba(255,255,255,0.05)"
          }}>

            {/* Accent glow — uses app's accent color system */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: updateState.status === "downloaded"
                ? "radial-gradient(ellipse at 30% 0%, rgba(16,185,129,0.12) 0%, transparent 70%)"
                : updateState.status === "downloading"
                ? "radial-gradient(ellipse at 30% 0%, rgba(59,130,246,0.12) 0%, transparent 70%)"
                : updateState.status === "error"
                ? "radial-gradient(ellipse at 30% 0%, rgba(249,115,22,0.10) 0%, transparent 70%)"
                : "radial-gradient(ellipse at 30% 0%, rgb(var(--accent-rgb) / 0.12) 0%, transparent 70%)"
            }} />

            <div className="relative p-5">
              {/* Header Row */}
              <div className="flex items-start gap-3.5">
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  "border transition-all duration-500",
                  updateState.status === "downloaded"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : updateState.status === "downloading"
                    ? "bg-blue-500/10 border-blue-500/20"
                    : updateState.status === "error"
                    ? "bg-orange-500/10 border-orange-500/20"
                    : "accent-bg-soft accent-border"
                )}>
                  {updateState.status === "downloaded" ? (
                    <CheckCircle2 className="w-[18px] h-[18px] text-emerald-400" />
                  ) : updateState.status === "downloading" ? (
                    <Download className="w-[18px] h-[18px] text-blue-400 animate-bounce" />
                  ) : updateState.status === "error" ? (
                    <AlertTriangle className="w-[18px] h-[18px] text-orange-400" />
                  ) : (
                    <Rocket className="w-[18px] h-[18px] accent-text" />
                  )}
                </div>

                {/* Title & Meta */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-100 leading-tight">
                      {updateState.status === "downloaded"
                        ? "Güncelleme Hazır!"
                        : updateState.status === "downloading"
                        ? "İndiriliyor"
                        : updateState.status === "error"
                        ? "Bağlantı Hatası"
                        : "Yeni Güncelleme"}
                    </h4>
                    {versionStr && updateState.status !== "error" && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border",
                        updateState.status === "downloaded"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : updateState.status === "downloading"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "accent-bg-soft accent-border accent-text"
                      )}>
                        {versionStr}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">
                    {updateState.status === "downloaded"
                      ? "Güncelleme indirildi, yüklemek için yeniden başlatın."
                      : updateState.status === "downloading"
                      ? updateState.transferred && updateState.total
                        ? `${formatBytes(updateState.transferred)} / ${formatBytes(updateState.total)}`
                        : "Dosya indiriliyor, lütfen bekleyin..."
                      : updateState.status === "error"
                      ? (updateState.error || "Güncelleme kontrol edilemedi.")
                      : updateState.downloadSize
                      ? `Yeni sürüm hazır · ${formatBytes(updateState.downloadSize)}`
                      : "Yeni bir FocusFlow sürümü mevcut."}
                  </p>
                </div>

                {/* Close */}
                <button
                  onClick={() => setDismissed(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-all duration-200 -mt-0.5 -mr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Bar — downloading state */}
              {updateState.status === "downloading" && (
                <div className="mt-4">
                  <div className="h-[6px] w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, rgb(var(--accent-rgb)), rgb(var(--accent-light-rgb)))",
                        boxShadow: "0 0 12px rgb(var(--accent-rgb) / 0.4)"
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-zinc-600 font-mono">İndirme devam ediyor...</span>
                    <span className="text-[11px] font-bold accent-text font-mono">%{percent}</span>
                  </div>
                </div>
              )}

              {/* Action Area */}
              <div className="mt-4">
                {/* Available + has download URL → Download button */}
                {updateState.status === "available" && updateState.downloadUrl && (
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={cn(
                      "w-full h-10 rounded-xl text-[13px] font-bold transition-all duration-300",
                      "flex items-center justify-center gap-2",
                      "accent-bg hover:opacity-90 active:scale-[0.98]",
                      "text-white accent-shadow",
                      "disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? "Başlatılıyor..." : "Güncellemeyi İndir"}
                  </button>
                )}

                {/* Available + no download URL → GitHub fallback */}
                {updateState.status === "available" && !updateState.downloadUrl && (
                  <button
                    onClick={handleInstall}
                    className={cn(
                      "w-full h-10 rounded-xl text-[13px] font-bold transition-all duration-300",
                      "flex items-center justify-center gap-2",
                      "glass-card-hover bg-white/[0.04] border border-white/[0.06]",
                      "text-zinc-300 hover:text-white"
                    )}
                  >
                    <Zap className="w-4 h-4" />
                    GitHub Sayfasına Git
                  </button>
                )}

                {/* Downloaded → Install & restart */}
                {updateState.status === "downloaded" && (
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className={cn(
                      "w-full h-10 rounded-xl text-[13px] font-bold transition-all duration-300",
                      "flex items-center justify-center gap-2",
                      "bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98]",
                      "text-white shadow-lg shadow-emerald-500/20",
                      "disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    {installing ? "Yeniden Başlatılıyor..." : "Kur ve Yeniden Başlat"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
