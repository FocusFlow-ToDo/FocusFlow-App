"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react"

/* ═══════════════════════════════════════ */
/*  Types                                  */
/* ═══════════════════════════════════════ */
export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  action?: { label: string; onClick: () => void }
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, "id">) => void
  dismissToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast(): ToastContextType {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

/* ═══════════════════════════════════════ */
/*  Provider                               */
/* ═══════════════════════════════════════ */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const showToast = React.useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]) // max 5
  }, [])

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 w-full max-w-md pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

/* ═══════════════════════════════════════ */
/*  Toast Item                             */
/* ═══════════════════════════════════════ */
const TOAST_CONFIG = {
  success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  error:   { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  info:    { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage
  onDismiss: () => void
}) {
  const duration = toast.duration || 4000
  const { icon: Icon, color, bg, border } = TOAST_CONFIG[toast.type]

  React.useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: 20, scale: 0.9, filter: "blur(10px)", transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto relative group",
        "min-w-[320px] max-w-full",
        "bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-2xl",
        "shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
        "flex flex-col overflow-hidden"
      )}
    >
      <div className="px-4 py-3.5 flex items-center gap-3.5">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", bg)}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[13px] font-medium text-zinc-100 leading-snug">{toast.message}</p>
        </div>

        {toast.action ? (
          <button
            onClick={() => {
              toast.action!.onClick()
              onDismiss()
            }}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white uppercase tracking-wider transition-all active:scale-95"
          >
            {toast.action.label}
          </button>
        ) : (
          <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.02]">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className={cn("h-full", color.replace("text-", "bg-"))}
        />
      </div>
    </motion.div>
  )
}