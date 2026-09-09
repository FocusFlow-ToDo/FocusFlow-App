"use client"

import * as React from "react"
import { Bell, AlertTriangle, Info, CheckCircle2, X, Trash2 } from "lucide-react"

export type NotificationType = "info" | "warning" | "error" | "success" | "trash"

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  link?: string
}

interface NotificationContextType {
  notifications: NotificationItem[]
  unreadCount: number
  addNotification: (notif: Omit<NotificationItem, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const ctx = React.useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider")
  return ctx
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])

  // Persistence (optional but recommended)
  React.useEffect(() => {
    const saved = localStorage.getItem("ff_notifications")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setNotifications(parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })))
      } catch (e) {
        console.error("Failed to parse notifications", e)
      }
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem("ff_notifications", JSON.stringify(notifications))
  }, [notifications])

  const unreadCount = React.useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const addNotification = React.useCallback((notif: Omit<NotificationItem, "id" | "timestamp" | "read">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications(prev => [
      { ...notif, id, timestamp: new Date(), read: false },
      ...prev.slice(0, 49) // Keep last 50
    ])
  }, [])

  const markAsRead = React.useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = React.useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = React.useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ 
      notifications, unreadCount, addNotification, 
      markAsRead, markAllAsRead, clearNotification, clearAll 
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
