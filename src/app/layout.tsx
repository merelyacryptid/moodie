import type { Metadata } from "next"
import { Nunito, Fredoka } from "next/font/google"
import "./globals.css"
import { BottomNavigation } from "@/components/BottomNavigation"

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
    <html lang="en" className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fef9ef] text-stone-800">
        <main className="flex-1 pb-20 max-w-lg mx-auto w-full px-4 pt-6">
          {children}
        </main>
        <BottomNavigation />
      </body>
    </html>
  )
}
