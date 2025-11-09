import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CartProvider } from "@/hooks/cart-provider" // ⭐️ THÊM IMPORT

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FoodFast - Fast Food Delivery",
  description: "Order delicious food from local restaurants",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <CartProvider> {/* ⭐️ BỌC Ở ĐÂY */}
          {children}
        </CartProvider> {/* ⭐️ BỌC Ở ĐÂY */}
        <Analytics />
      </body>
    </html>
  )
}