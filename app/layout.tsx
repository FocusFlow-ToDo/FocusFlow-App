import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/app/providers"
import { ClientLayout } from "@/components/layout/ClientLayout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FocusFlow",
  description: "Minimalist verimlilik ve görev yönetimi uygulaması",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="dark">
      <body
        className={`${inter.className} text-zinc-100 overflow-hidden`}
      >
        {/* Electron Title Bar Drag Area */}
        <div
          className="h-9 w-full fixed top-0 left-0 z-[100] pointer-events-none select-none"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />

        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  )
}