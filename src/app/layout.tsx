import type { Metadata } from "next"
import { Nunito, Fredoka } from "next/font/google"
import "./globals.css"
import { BottomNavigation } from "@/components/BottomNavigation"
import { EyeBackground } from "@/components/EyeBackground"

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
})

const fredoka = Fredoka({
  variable: "--font-heading",
  weight: ["500", "600"],
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
    <html lang="en" className={`${nunito.variable} ${fredoka.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="relative min-h-full flex flex-col bg-[#fef9ef] text-stone-800">
        <EyeBackground />
        <main className="relative z-10 flex-1 pb-24 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-6 transition-all duration-300">
          {children}
        </main>
        <BottomNavigation />
      </body>
    </html>
  )
}
