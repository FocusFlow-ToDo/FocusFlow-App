"use client"

import React from "react"
import { AuthProvider } from "@/hooks/useAuth"
import { TaskProvider } from "@/hooks/useTasks"
import { SettingsProvider } from "@/hooks/useSettings"
import { CategoriesProvider } from "@/hooks/useCategories"
import { ToastProvider } from "@/contexts/ToastContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { TaskGroupsProvider } from "@/hooks/useTaskGroups"
import { TrashGuardian } from "@/components/layout/TrashGuardian"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <NotificationProvider>
        <AuthProvider>
          <SettingsProvider>
            <CategoriesProvider>
              <TaskProvider>
                <TaskGroupsProvider>
                  <TrashGuardian />
                  {children}
                </TaskGroupsProvider>
              </TaskProvider>
            </CategoriesProvider>
          </SettingsProvider>
        </AuthProvider>
      </NotificationProvider>
    </ToastProvider>
  )
}