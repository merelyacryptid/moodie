import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { BottomNavigation } from "@/components/BottomNavigation"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "moodie",
  description: "A gentle reflection companion",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fef9ef] text-stone-800">
        <main className="flex-1 pb-20 max-w-lg mx-auto w-full px-4 pt-6">
          {children}
        </main>
        <BottomNavigation />
      </body>
    </html>
  )
}
