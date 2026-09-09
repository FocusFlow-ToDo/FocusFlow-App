"use client"

import * as React from "react"
import { useTasks } from "@/hooks/useTasks"
import { useSettings } from "@/hooks/useSettings"
import { useNotifications } from "@/contexts/NotificationContext"
import { useToast } from "@/contexts/ToastContext"
import { differenceInDays, isBefore, startOfDay } from "date-fns"

function sendNativeNotification(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body })
  }
}

export function TrashGuardian() {
  const { rawTasks, hardDeleteTask, loading } = useTasks()
  const { settings } = useSettings()
  const { showToast } = useToast()
  const { addNotification, notifications } = useNotifications()
  const lastCheck = React.useRef<number>(0)
  const lastRetention = React.useRef<number>(settings.trashRetentionDays)

  React.useEffect(() => {
    if (loading || rawTasks.length === 0) return
    
    const now = Date.now()
    const retentionChanged = lastRetention.current !== settings.trashRetentionDays
    
    // Throttle checks to once every hour, UNLESS settings changed
    if (!retentionChanged && (now - lastCheck.current < 3600000)) return
    
    lastCheck.current = now
    lastRetention.current = settings.trashRetentionDays

    const toPermanentlyDelete: string[] = []
    const toArchiveLocal: any[] = []
    const toNotifyTrash: string[] = []
    const toNotifyOverdue: string[] = []

    const today = startOfDay(new Date())

    rawTasks.forEach(task => {
      // 1. TRASH LOGIC
      if (task.status === "trash" && task.deletedAt) {
        const daysInTrash = differenceInDays(new Date(), task.deletedAt)
        const daysLeft = settings.trashRetentionDays - daysInTrash
        
        if (daysLeft <= 0) {
          toPermanentlyDelete.push(task.id)
        } else if (daysLeft <= 1) {
          toNotifyTrash.push(task.title)
        }
      } 
      
      // 2. OVERDUE LOGIC
      else if (task.status !== "done" && task.dueDate) {
        const dDate = startOfDay(new Date(task.dueDate))
        if (isBefore(dDate, today)) {
          toNotifyOverdue.push(task.title)
        }
      }

      // 3. DONE ARCHIVE LOGIC (Auto-archive 30 days after completion)
      if (task.status === "done" && task.completedAt) {
        const daysCompleted = differenceInDays(today, startOfDay(new Date(task.completedAt)))
        if (daysCompleted >= 30) {
          toArchiveLocal.push(task)
        }
      }
    })

    // Action: Archive locally then delete
    if (toArchiveLocal.length > 0) {
      if (typeof window !== "undefined" && (window as any).electron) {
        (window as any).electron.ipcRenderer.invoke('archive-tasks', toArchiveLocal).then((res: any) => {
          if (res?.success) {
            toArchiveLocal.forEach(t => hardDeleteTask(t.id))
            showToast({
              type: "info",
              message: `📚 ${toArchiveLocal.length} eski görev sistemden bilgisayarınıza arşivlendi.`
            })
          }
        }).catch((err: any) => console.error('Archive call failed', err))
      } else {
        // Web fallback
        toArchiveLocal.forEach(t => hardDeleteTask(t.id))
      }
    }

    // Action: Hard Delete Trash
    toPermanentlyDelete.forEach(id => {
      hardDeleteTask(id)
    })

    if (toPermanentlyDelete.length > 0) {
      showToast({
        type: "info",
        message: `🗑 ${toPermanentlyDelete.length} adet çöp kutusundaki görev kalıcı olarak silindi.`
      })
    }

    // Action: Notify Trash
    if (toNotifyTrash.length > 0) {
      const msg = `${toNotifyTrash.length} görev yarın kalıcı olarak silinecek.`
      showToast({ type: "warning", message: `⚠️ ${msg}` })

      if (settings.notificationsEnabled) {
        sendNativeNotification("Çöp Kutusu Uyarısı", msg)
      }

      const hasDuplicate = notifications.some(n => !n.read && n.title === "Çöp Kutusu Uyarısı")
      if (!hasDuplicate) {
        addNotification({
          type: "trash",
          title: "Çöp Kutusu Uyarısı",
          message: `${msg} Lütfen kurtarmak istediklerinizi kontrol edin.`
        })
      }
    }

    // Action: Notify Overdue
    if (toNotifyOverdue.length > 0) {
      const msg = `${toNotifyOverdue.length} görevin süresi geçmiş.`
      showToast({ type: "error", message: `🚨 ${msg}` })

      if (settings.notificationsEnabled) {
        sendNativeNotification("Gecikmiş Görevler!", msg + " Planlayıcıyı kontrol etmeyi unutmayın.")
      }

      const hasDuplicate = notifications.some(n => !n.read && n.title === "Gecikmiş Görevler")
      if (!hasDuplicate) {
        addNotification({
          type: "warning",
          title: "Gecikmiş Görevler",
          message: `${msg} Bugün mutlaka tamamlamaya ne dersiniz?`
        })
      }
    }
  }, [rawTasks, loading, settings.trashRetentionDays, hardDeleteTask, showToast, addNotification, notifications, settings.notificationsEnabled])

  return null
}
