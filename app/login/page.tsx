"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Target, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/hooks/useAuth"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#ea4335"
        d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
      />
      <path
        fill="#34a853"
        d="M16.04 18.013c-1.09.693-2.459 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823L1.22 17.374C3.163 21.325 7.246 24 12 24c2.904 0 5.462-.916 7.479-2.479l-3.44-3.508Z"
      />
      <path
        fill="#4285f4"
        d="M24 12c0-.851-.065-1.745-.267-2.509H12v4.745h6.812c-.31 1.637-1.245 3.012-2.773 3.777l3.441 3.508C22.25 19.163 24 15.893 24 12Z"
      />
      <path
        fill="#fbbc05"
        d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { user, loginWithGoogle, loginAnonymously } = useAuth()
  const router = useRouter()

  React.useEffect(() => { if (user) router.push("/") }, [user, router])

  const handleGoogleLogin = async () => { try { await loginWithGoogle() } catch (e) { console.error(e) } }
  const handleGuestLogin = async () => { try { await loginAnonymously() } catch (e) { console.error(e) } }

  if (user) return null

  return (
    <div className="h-screen w-full bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[20%] left-[15%] w-[35vw] h-[35vw] min-w-[300px] bg-blue-500/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[15%] w-[25vw] h-[25vw] min-w-[200px] bg-purple-500/[0.05] rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-sm z-10 flex flex-col items-center">

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl accent-glow">
          <img
            src="/logo.png"
            alt="logo"
            className="w-16 h-16 object-contain"
          />
        </div>

        <h1 className="text-[28px] font-semibold tracking-tight text-white mb-2">FocusFlow&apos;a Hoş Geldiniz</h1>
        <p className="text-zinc-400 text-[15px] mb-10 text-center font-medium">Bölünmelere meydan oku. Verimliliğe odaklan.</p>

        <div className="w-full space-y-3">
          <Button className="w-full h-12 bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg shadow-white/10" onClick={handleGoogleLogin}>
            <GoogleIcon className="w-5 h-5 mr-3" /> Google ile Devam Et
          </Button>
          <Button variant="secondary" className="w-full h-12 glass-card !text-zinc-300 hover:!bg-white/[0.06]" onClick={handleGuestLogin}>
            Hesapsız Kullan (Ziyaretçi) <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
          </Button>
        </div>

        <p className="mt-8 text-xs text-zinc-600 text-center uppercase tracking-wider font-semibold">Yüksek Performanslı İş Akışı</p>
      </motion.div>
    </div>
  )
}