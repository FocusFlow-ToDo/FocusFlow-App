"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { createPortal } from "react-dom"
import { AlertTriangle, X, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ConfirmModalProps {
  isOpen: boolean; title: string; message: string
  confirmText?: string; cancelText?: string
  isDestructive?: boolean; onConfirm: () => void; onCancel: () => void
}

export function ConfirmModal({ isOpen, title, message, confirmText = "Onayla", cancelText = "İptal", isDestructive = false, onConfirm, onCancel }: ConfirmModalProps) {
  if (typeof document === "undefined") return null
  
  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={onCancel} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 8 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="relative w-full max-w-sm glass-dropdown rounded-3xl p-8 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] border border-white/5" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-5",
                    isDestructive ? "bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "bg-blue-500/10 text-blue-400"
                  )}>
                    {isDestructive ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100 mb-2">{title}</h3>
                  <p className="text-[13px] text-zinc-400 mb-8 leading-relaxed max-w-[280px]">{message}</p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button 
                      onClick={onCancel} 
                      className="flex-1 h-12 rounded-2xl text-[13px] font-bold glass-card text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-all active:scale-95"
                    >
                      {cancelText}
                    </button>
                    <button 
                      onClick={onConfirm} 
                      className={cn(
                        "flex-1 h-12 rounded-2xl text-[13px] font-bold transition-all active:scale-95 shadow-lg",
                        isDestructive ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
                      )}
                    >
                      {confirmText}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export function useConfirm() {
  const [state, setState] = React.useState<{ options: any; resolve: (v: boolean) => void } | null>(null)
  const confirm = React.useCallback((options: any): Promise<boolean> => new Promise((resolve) => setState({ options, resolve })), [])
  const handleConfirm = React.useCallback(() => { state?.resolve(true); setState(null) }, [state])
  const handleCancel = React.useCallback(() => { state?.resolve(false); setState(null) }, [state])
  const ConfirmDialog = React.useMemo(() => (
    <ConfirmModal isOpen={!!state} title={state?.options.title || ""} message={state?.options.message || ""}
      confirmText={state?.options.confirmText} cancelText={state?.options.cancelText}
      isDestructive={state?.options.isDestructive} onConfirm={handleConfirm} onCancel={handleCancel} />
  ), [state, handleConfirm, handleCancel])
  return { confirm, ConfirmDialog }
}