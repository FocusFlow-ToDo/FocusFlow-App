"use client"

import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react"
import {
  onAuthStateChanged, signInWithPopup, signOut,
  signInAnonymously as firebaseSignInAnonymously,
  GoogleAuthProvider, signInWithCredential, updateProfile, type User,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  loginWithGoogle: () => Promise<any>
  loginAnonymously: () => Promise<any>
  logout: () => Promise<void>
  updateDisplayName: (newName: string) => Promise<void>
  updateProfilePicture: (url: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Electron desktop login listener
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electron) {
      const handleGoogleSuccess = async (token: string) => {
        try {
          setLoading(true)
          const credential = GoogleAuthProvider.credential(token)
          await signInWithCredential(auth, credential)
        } catch (error) {
          console.error("Desktop login error:", error)
        } finally {
          setLoading(false)
        }
      }
      ;(window as any).electron?.ipcRenderer?.on("google-login-success", handleGoogleSuccess)
      
      return () => {
        ;(window as any).electron?.ipcRenderer?.removeListener("google-login-success", handleGoogleSuccess)
      }
    }
  }, [])

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid)
          const userSnap = await getDoc(userRef)
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              displayName: firebaseUser.isAnonymous ? "Misafir" : firebaseUser.displayName || "Kullanıcı",
              email: firebaseUser.email || "",
              photoURL: firebaseUser.photoURL || "",
              isAnonymous: firebaseUser.isAnonymous,
              createdAt: serverTimestamp(),
            })
          }
        } catch (e) {
          console.error("User doc error:", e)
        }
        setUser(firebaseUser)
      } else {
        const localMock = localStorage.getItem("mockUser")
        if (localMock) {
          setUser(JSON.parse(localMock) as any)
        } else {
          setUser(null)
        }
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // ★ Login with Google — config'i Electron'a gönder
  const loginWithGoogle = async () => {
    const isElectron = typeof window !== "undefined" && (window as any).electron

    if (isElectron) {
      // ★ Firebase config'i dinamik olarak al ve Electron'a gönder
      try {
        const configModule = await import("@/firebase/config")
        // auth instance'ından config çıkar
        const fbApp = (configModule.auth as any).app
        const config = fbApp?.options || {}

        return (window as any).electron.ipcRenderer.invoke("start-google-login", {
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
        })
      } catch (err) {
        console.error("Config extraction failed, trying without config:", err)
        // Config göndermeden dene — main.js dosyadan okuyacak
        return (window as any).electron.ipcRenderer.invoke("start-google-login")
      }
    }

    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  // Anonymous Login
  const loginAnonymously = async () => {
    try {
      return await firebaseSignInAnonymously(auth)
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed") {
        console.warn("Anonymous auth disabled, creating mock user")
        const mockUser = {
          uid: `mock-${Date.now()}`,
          isAnonymous: true,
          displayName: "Misafir",
          email: "",
          photoURL: "",
        }
        localStorage.setItem("mockUser", JSON.stringify(mockUser))
        setUser(mockUser as any)
        return mockUser
      }
      throw err
    }
  }

  const logout = async () => {
    localStorage.removeItem("mockUser")
    await signOut(auth)
    setUser(null)
    router.replace("/login")
  }

  const updateDisplayName = async (newName: string) => {
    if (!user) throw new Error("Giriş yapmış kullanıcı bulunamadı")

    const trimmed = newName.trim()
    if (!trimmed) throw new Error("Kullanıcı adı boş olamaz")

    if (user.isAnonymous && user.uid.startsWith("mock-")) {
      const updatedMock = { ...user, displayName: trimmed } as any
      localStorage.setItem("mockUser", JSON.stringify(updatedMock))
      setUser(updatedMock)
      return
    }

    try {
      // 1. Firebase Auth Update
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed })
      }

      // 2. Users Collection Update
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { displayName: trimmed })

      // 3. Public Profiles Update (Topluluk vs. İçin)
      const publicRef = doc(db, "publicProfiles", user.uid)
      await updateDoc(publicRef, { displayName: trimmed })

      // Re-trigger auth state by refreshing user reference
      setUser({ ...user, displayName: trimmed } as User)
    } catch (e) {
      console.error("Ad güncellenirken hata oluştu:", e)
      throw e
    }
  }

  const updateProfilePicture = async (newPhotoURL: string) => {
    if (!user) throw new Error("Giriş yapmış kullanıcı bulunamadı")
    if (user.isAnonymous && user.uid.startsWith("mock-")) {
      const updatedMock = { ...user, photoURL: newPhotoURL } as any
      localStorage.setItem("mockUser", JSON.stringify(updatedMock))
      setUser(updatedMock)
      return
    }
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: newPhotoURL })
      }
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { photoURL: newPhotoURL })
      const publicRef = doc(db, "publicProfiles", user.uid)
      await updateDoc(publicRef, { photoURL: newPhotoURL })
      
      setUser({ ...user, photoURL: newPhotoURL } as User)
    } catch (e) {
      console.error("Profil resmi güncellenirken hata oluştu:", e)
      throw e
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginAnonymously, logout, updateDisplayName, updateProfilePicture }}>
      {children}
    </AuthContext.Provider>
  )
}