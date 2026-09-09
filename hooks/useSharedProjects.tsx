"use client"

import * as React from "react"
import { db } from "@/firebase/config"
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion
} from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/contexts/ToastContext"
import type {
  SharedProject,
  SharedProjectInvite,
  SharedProjectTask,
  SharedCategory,
  SharedProjectActivity
} from "@/types"

export function useSharedProjects() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [sharedProjects, setSharedProjects] = React.useState<SharedProject[]>([])
  const [pendingInvites, setPendingInvites] = React.useState<SharedProjectInvite[]>([])
  const [loading, setLoading] = React.useState(true)

  // Real-time listener for shared projects
  React.useEffect(() => {
    if (!user) {
      setSharedProjects([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "sharedProjects"),
      where("members", "array-contains", user.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            ...data,
            tasks: data.tasks || [],
            categories: data.categories || [],
            activityLog: data.activityLog || []
          } as SharedProject
        })

        // Sort by updatedAt or createdAt descending
        items.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0)
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0)
          return timeB - timeA
        })

        setSharedProjects(items)
        setLoading(false)
      },
      (err) => {
        console.error("Shared projects listener error:", err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user])

  // Real-time listener for pending invites
  React.useEffect(() => {
    if (!user) {
      setPendingInvites([])
      return
    }

    const q = query(
      collection(db, "sharedProjectInvites"),
      where("toUid", "==", user.uid),
      where("status", "==", "pending")
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const invites = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        } as SharedProjectInvite))
        setPendingInvites(invites)
      },
      (err) => {
        console.error("Shared invites listener error:", err)
      }
    )

    return unsubscribe
  }, [user])

  // Create a new shared project and send invite
  const createSharedProject = async ({
    title,
    description,
    color,
    emoji,
    targetDate,
    friendUid,
    friendName,
    friendPhotoURL
  }: {
    title: string
    description: string
    color: string
    emoji: string
    targetDate?: string | null
    friendUid: string
    friendName: string
    friendPhotoURL?: string | null
  }) => {
    if (!user) throw new Error("Giriş yapılmamış")

    const projectId = `sprj_${Date.now()}`
    const inviteId = `sinv_${Date.now()}`

    const myName = user.displayName || "Lider"
    const myPhoto = user.photoURL || null

    const initialCategories: SharedCategory[] = [
      { id: "cat_genel", name: "Genel Görevler", color: "#3B82F6", createdBy: user.uid },
      { id: "cat_gelistirme", name: "Geliştirme & Fikirler", color: "#8B5CF6", createdBy: user.uid },
      { id: "cat_tasarim", name: "Tasarım & UI", color: "#EC4899", createdBy: user.uid }
    ]

    const initialActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "status_changed",
      userId: user.uid,
      userName: myName,
      detail: `Ortak projeyi başlattı ve ${friendName}'ı davet etti 🎉`,
      timestamp: new Date().toISOString()
    }

    const newProject: SharedProject = {
      id: projectId,
      title: title.trim(),
      description: description.trim(),
      color,
      emoji,
      status: "planning",
      targetDate: targetDate || null,
      leaderId: user.uid,
      leaderName: myName,
      leaderPhotoURL: myPhoto,
      memberId: friendUid,
      memberName: friendName,
      memberPhotoURL: friendPhotoURL || null,
      members: [user.uid, friendUid],
      inviteStatus: "pending",
      tasks: [],
      categories: initialCategories,
      activityLog: [initialActivity],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const newInvite: SharedProjectInvite = {
      id: inviteId,
      projectId,
      projectTitle: title.trim(),
      projectEmoji: emoji,
      projectColor: color,
      fromUid: user.uid,
      fromName: myName,
      fromPhotoURL: myPhoto,
      toUid: friendUid,
      toName: friendName,
      status: "pending",
      createdAt: serverTimestamp()
    }

    await setDoc(doc(db, "sharedProjects", projectId), newProject)
    await setDoc(doc(db, "sharedProjectInvites", inviteId), newInvite)

    showToast({
      type: "success",
      message: `"${title}" ortak projesi oluşturuldu ve ${friendName}'a davet gönderildi! 🚀`
    })

    return projectId
  }

  // Accept an invite
  const acceptInvite = async (invite: SharedProjectInvite) => {
    if (!user) return

    try {
      // Update invite status
      await updateDoc(doc(db, "sharedProjectInvites", invite.id), {
        status: "accepted",
        updatedAt: serverTimestamp()
      })

      // Update project
      const myName = user.displayName || "Ortak"
      const joinActivity: SharedProjectActivity = {
        id: `act_${Date.now()}`,
        type: "member_joined",
        userId: user.uid,
        userName: myName,
        detail: `Daveti kabul etti ve projeye katıldı! 🤝`,
        timestamp: new Date().toISOString()
      }

      await updateDoc(doc(db, "sharedProjects", invite.projectId), {
        inviteStatus: "accepted",
        memberName: myName,
        memberPhotoURL: user.photoURL || null,
        activityLog: arrayUnion(joinActivity),
        updatedAt: serverTimestamp()
      })

      showToast({
        type: "success",
        message: `"${invite.projectTitle}" projesine katıldın! Ortak çalışmaya başlayabilirsiniz.`
      })
    } catch (err) {
      console.error("Accept invite error:", err)
      showToast({
        type: "error",
        message: "Davet kabul edilirken bir hata oluştu."
      })
    }
  }

  // Reject an invite
  const rejectInvite = async (invite: SharedProjectInvite) => {
    if (!user) return

    try {
      await updateDoc(doc(db, "sharedProjectInvites", invite.id), {
        status: "rejected",
        updatedAt: serverTimestamp()
      })

      await updateDoc(doc(db, "sharedProjects", invite.projectId), {
        inviteStatus: "rejected",
        updatedAt: serverTimestamp()
      })

      showToast({
        type: "info",
        message: "Proje daveti reddedildi."
      })
    } catch (err) {
      console.error("Reject invite error:", err)
      showToast({
        type: "error",
        message: "İşlem gerçekleştirilemedi."
      })
    }
  }

  // Delete project (leader only)
  const deleteProject = async (projectId: string) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    if (proj.leaderId !== user.uid) {
      showToast({
        type: "error",
        message: "Sadece proje lideri projeyi silebilir!"
      })
      return
    }

    try {
      await deleteDoc(doc(db, "sharedProjects", projectId))
      showToast({
        type: "success",
        message: "Ortak proje silindi."
      })
    } catch (err) {
      console.error("Delete project error:", err)
      showToast({
        type: "error",
        message: "Proje silinemedi."
      })
    }
  }

  // Add task to shared project
  const addTask = async (
    projectId: string,
    title: string,
    categoryId?: string | null,
    priority: "low" | "medium" | "high" | "urgent" = "medium"
  ) => {
    if (!user || !title.trim()) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const myName = user.displayName || "Kullanıcı"
    const taskId = `spt_${Date.now()}`

    const newTask: SharedProjectTask = {
      id: taskId,
      title: title.trim(),
      completed: false,
      addedBy: user.uid,
      addedByName: myName,
      categoryId: categoryId || null,
      priority,
      order: proj.tasks.length,
      createdAt: new Date().toISOString()
    }

    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "task_added",
      userId: user.uid,
      userName: myName,
      detail: `"${title.trim()}" görevini ekledi 📝`,
      timestamp: new Date().toISOString()
    }

    const nextTasks = [...proj.tasks, newTask]
    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50) // keep last 50 activities

    await updateDoc(doc(db, "sharedProjects", projectId), {
      tasks: nextTasks,
      activityLog: nextActivity,
      updatedAt: serverTimestamp()
    })
  }

  // Reorder tasks in shared project
  const reorderTasks = async (projectId: string, newTasks: SharedProjectTask[]) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    await updateDoc(doc(db, "sharedProjects", projectId), {
      tasks: newTasks,
      updatedAt: serverTimestamp()
    })
  }

  // Move task to a different category or position
  const moveTask = async (
    projectId: string,
    taskId: string,
    destCategoryId: string | null,
    newIndex: number
  ) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const target = proj.tasks.find((t) => t.id === taskId)
    if (!target) return

    const otherTasks = proj.tasks.filter((t) => t.id !== taskId)
    const updatedTarget: SharedProjectTask = {
      ...target,
      categoryId: destCategoryId
    }

    otherTasks.splice(newIndex, 0, updatedTarget)
    const nextTasks = otherTasks.map((t, idx) => ({ ...t, order: idx }))

    const myName = user.displayName || "Kullanıcı"
    const destCatName = proj.categories.find(c => c.id === destCategoryId)?.name || "Genel"
    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "status_changed",
      userId: user.uid,
      userName: myName,
      detail: `"${target.title}" görevini "${destCatName}" alanına taşıdı 🔄`,
      timestamp: new Date().toISOString()
    }

    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50)

    await updateDoc(doc(db, "sharedProjects", projectId), {
      tasks: nextTasks,
      activityLog: nextActivity,
      updatedAt: serverTimestamp()
    })
  }

  // Toggle task completion
  const toggleTask = async (projectId: string, taskId: string) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const targetTask = proj.tasks.find((t) => t.id === taskId)
    if (!targetTask) return

    const isNowCompleted = !targetTask.completed
    const myName = user.displayName || "Kullanıcı"

    const nextTasks = proj.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: isNowCompleted,
          completedBy: isNowCompleted ? user.uid : null,
          completedByName: isNowCompleted ? myName : null,
          completedAt: isNowCompleted ? new Date().toISOString() : null
        }
      }
      return t
    })

    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: isNowCompleted ? "task_completed" : "task_uncompleted",
      userId: user.uid,
      userName: myName,
      detail: isNowCompleted
        ? `"${targetTask.title}" görevini tamamladı! ✅`
        : `"${targetTask.title}" görevini geri aldı ↩️`,
      timestamp: new Date().toISOString()
    }

    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50)

    await updateDoc(doc(db, "sharedProjects", projectId), {
      tasks: nextTasks,
      activityLog: nextActivity,
      updatedAt: serverTimestamp()
    })
  }

  // Delete task
  const deleteTask = async (projectId: string, taskId: string) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const targetTask = proj.tasks.find((t) => t.id === taskId)
    if (!targetTask) return

    const myName = user.displayName || "Kullanıcı"
    const nextTasks = proj.tasks.filter((t) => t.id !== taskId)

    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "task_deleted",
      userId: user.uid,
      userName: myName,
      detail: `"${targetTask.title}" görevini sildi 🗑️`,
      timestamp: new Date().toISOString()
    }

    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50)

    await updateDoc(doc(db, "sharedProjects", projectId), {
      tasks: nextTasks,
      activityLog: nextActivity,
      updatedAt: serverTimestamp()
    })
  }

  // Add category / development suggestion category
  const addCategory = async (projectId: string, name: string, color: string) => {
    if (!user || !name.trim()) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const myName = user.displayName || "Kullanıcı"
    const catId = `scat_${Date.now()}`

    const newCategory: SharedCategory = {
      id: catId,
      name: name.trim(),
      color: color || "#3B82F6",
      createdBy: user.uid
    }

    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "category_added",
      userId: user.uid,
      userName: myName,
      detail: `"${name.trim()}" kategorisini ekledi 🏷️`,
      timestamp: new Date().toISOString()
    }

    const nextCategories = [...(proj.categories || []), newCategory]
    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50)

    await updateDoc(doc(db, "sharedProjects", projectId), {
      categories: nextCategories,
      activityLog: nextActivity,
      updatedAt: serverTimestamp()
    })
  }

  // Update project status
  const updateProjectStatus = async (
    projectId: string,
    newStatus: "planning" | "in_progress" | "completed"
  ) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const myName = user.displayName || "Kullanıcı"
    const statusLabels: Record<string, string> = {
      planning: "Planlama",
      in_progress: "Devam Ediyor",
      completed: "Tamamlandı"
    }

    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "status_changed",
      userId: user.uid,
      userName: myName,
      detail: `Proje durumunu "${statusLabels[newStatus] || newStatus}" olarak değiştirdi 📌`,
      timestamp: new Date().toISOString()
    }

    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50)

    await updateDoc(doc(db, "sharedProjects", projectId), {
      status: newStatus,
      activityLog: nextActivity,
      updatedAt: serverTimestamp()
    })
  }

  // Update project details (title, description, color, emoji, targetDate, status)
  const updateProject = async (
    projectId: string,
    updates: {
      title?: string
      description?: string
      color?: string
      emoji?: string
      targetDate?: string | null
      status?: "planning" | "in_progress" | "completed"
    }
  ) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const myName = user.displayName || "Kullanıcı"
    const cleanUpdates: any = {}
    if (updates.title !== undefined) cleanUpdates.title = updates.title.trim()
    if (updates.description !== undefined) cleanUpdates.description = updates.description.trim()
    if (updates.color !== undefined) cleanUpdates.color = updates.color
    if (updates.emoji !== undefined) cleanUpdates.emoji = updates.emoji
    if (updates.targetDate !== undefined) cleanUpdates.targetDate = updates.targetDate
    if (updates.status !== undefined) cleanUpdates.status = updates.status

    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "status_changed",
      userId: user.uid,
      userName: myName,
      detail: `Proje ayarlarını güncelledi ⚙️`,
      timestamp: new Date().toISOString()
    }

    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50)

    try {
      await updateDoc(doc(db, "sharedProjects", projectId), {
        ...cleanUpdates,
        activityLog: nextActivity,
        updatedAt: serverTimestamp()
      })
      showToast({
        type: "success",
        message: "Proje ayarları güncellendi."
      })
    } catch (err) {
      console.error("Update project error:", err)
      showToast({
        type: "error",
        message: "Proje güncellenemedi."
      })
    }
  }

  // Edit existing task in shared project
  const updateTask = async (
    projectId: string,
    taskId: string,
    updates: {
      title?: string
      description?: string
      priority?: "low" | "medium" | "high" | "urgent"
      categoryId?: string | null
    }
  ) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const target = proj.tasks.find((t) => t.id === taskId)
    if (!target) return

    const myName = user.displayName || "Kullanıcı"
    const nextTasks = proj.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          title: updates.title !== undefined ? updates.title.trim() : t.title,
          description: updates.description !== undefined ? updates.description.trim() : t.description,
          priority: updates.priority !== undefined ? updates.priority : t.priority,
          categoryId: updates.categoryId !== undefined ? updates.categoryId : t.categoryId
        }
      }
      return t
    })

    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "status_changed",
      userId: user.uid,
      userName: myName,
      detail: `"${updates.title?.trim() || target.title}" görevini güncelledi ✏️`,
      timestamp: new Date().toISOString()
    }

    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50)

    await updateDoc(doc(db, "sharedProjects", projectId), {
      tasks: nextTasks,
      activityLog: nextActivity,
      updatedAt: serverTimestamp()
    })
  }

  // Restore deleted task (Undo support)
  const restoreTask = async (projectId: string, restoredTask: SharedProjectTask) => {
    if (!user) return
    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const nextTasks = [...proj.tasks, restoredTask].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    await updateDoc(doc(db, "sharedProjects", projectId), {
      tasks: nextTasks,
      updatedAt: serverTimestamp()
    })
  }

  // Update existing category (rename or color)
  const updateCategory = async (
    projectId: string,
    categoryId: string,
    updates: { name?: string; color?: string }
  ) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const myName = user.displayName || "Kullanıcı"
    const nextCategories = (proj.categories || []).map((c) => {
      if (c.id === categoryId) {
        return {
          ...c,
          name: updates.name !== undefined ? updates.name.trim() : c.name,
          color: updates.color !== undefined ? updates.color : c.color
        }
      }
      return c
    })

    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "category_added",
      userId: user.uid,
      userName: myName,
      detail: `"${updates.name?.trim() || "Kategori"}" alanını güncelledi 🏷️`,
      timestamp: new Date().toISOString()
    }

    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50)

    await updateDoc(doc(db, "sharedProjects", projectId), {
      categories: nextCategories,
      activityLog: nextActivity,
      updatedAt: serverTimestamp()
    })
  }

  // Delete category from shared project
  const deleteCategory = async (projectId: string, categoryId: string) => {
    if (!user) return

    const proj = sharedProjects.find((p) => p.id === projectId)
    if (!proj) return

    const catToDelete = proj.categories?.find((c) => c.id === categoryId)
    const myName = user.displayName || "Kullanıcı"

    const nextCategories = (proj.categories || []).filter((c) => c.id !== categoryId)
    const nextTasks = proj.tasks.map((t) => {
      if (t.categoryId === categoryId) {
        return { ...t, categoryId: null }
      }
      return t
    })

    const newActivity: SharedProjectActivity = {
      id: `act_${Date.now()}`,
      type: "category_added",
      userId: user.uid,
      userName: myName,
      detail: `"${catToDelete?.name || "Kategori"}" alanını sildi 🗑️`,
      timestamp: new Date().toISOString()
    }

    const nextActivity = [newActivity, ...proj.activityLog].slice(0, 50)

    await updateDoc(doc(db, "sharedProjects", projectId), {
      categories: nextCategories,
      tasks: nextTasks,
      activityLog: nextActivity,
      updatedAt: serverTimestamp()
    })
  }

  return {
    sharedProjects,
    pendingInvites,
    loading,
    createSharedProject,
    acceptInvite,
    rejectInvite,
    deleteProject,
    updateProject,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    restoreTask,
    reorderTasks,
    moveTask,
    addCategory,
    updateCategory,
    deleteCategory,
    updateProjectStatus
  }
}
