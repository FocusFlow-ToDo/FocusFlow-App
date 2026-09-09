"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { createPortal } from "react-dom"
import { Trash2, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onHardDelete?: () => void
  title: string
  taskTitle: string
  defaultHard?: boolean
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  onHardDelete,
  title,
  taskTitle,
  defaultHard = false,
}: ConfirmDeleteModalProps) {
  const [isConfirmingHard, setIsConfirmingHard] = React.useState(defaultHard)

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsConfirmingHard(defaultHard)
    } else {
      const timer = setTimeout(() => setIsConfirmingHard(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, defaultHard])

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm glass-dropdown border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              {/* Icon */}
              <motion.div 
                key={isConfirmingHard ? "hard" : "soft"}
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto transition-colors duration-500",
                  isConfirmingHard ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                )}
              >
                {isConfirmingHard ? <AlertTriangle className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
              </motion.div>

              {/* Text */}
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {isConfirmingHard ? "Kalıcı Olarak Silinsin mi?" : title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                  "<span className="text-zinc-300">{taskTitle}</span>" <br />
                  {isConfirmingHard 
                    ? "Bu işlem geri alınamaz ve görev tamamen silinecektir. Emin misiniz?" 
                    : "bu görev çöp kutusuna taşınacak. 15 gün içinde geri alabilirsiniz."}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { 
                    if (isConfirmingHard) {
                      onHardDelete?.();
                    } else {
                      onConfirm();
                    }
                    onClose(); 
                  }}
                  className={cn(
                    "w-full h-12 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg",
                    isConfirmingHard ? "bg-rose-600 text-white" : "bg-white text-black hover:bg-zinc-200"
                  )}
                >
                  {isConfirmingHard ? "Eminim, Kalıcı Sil" : "Çöpe At"}
                </button>

                {!isConfirmingHard && onHardDelete && (
                   <button
                     onClick={() => setIsConfirmingHard(true)}
                     className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 font-bold text-sm hover:bg-white/10 hover:text-white transition-all active:scale-95"
                   >
                     Hemen Kalıcı Sil
                   </button>
                )}

                <button
                  onClick={() => isConfirmingHard ? setIsConfirmingHard(false) : onClose()}
                  className="w-full h-12 rounded-2xl text-zinc-600 font-bold text-sm hover:text-zinc-400 transition-colors"
                >
                  {isConfirmingHard ? "Geri Dön" : "Vazgeç"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
