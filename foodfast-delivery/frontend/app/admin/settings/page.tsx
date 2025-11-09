"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth" // ⭐️ SỬA 1: Import useAuth

export default function AdminSettings() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { logout, getStorageKeys } = useAuth() // ⭐️ SỬA 2: Lấy hook

  useEffect(() => {
    // ⭐️ SỬA 3: Dùng logic auth mới
    const keys = getStorageKeys("ADMIN") 
    const token = localStorage.getItem(keys.tokenKey)
    if (!token) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }
  }, [router, getStorageKeys]) // Thêm getStorageKeys vào dependencies

  if (!isAuthenticated) {
    return null
  }

  // ⭐️ SỬA 4: Tạo hàm logout
  const handleLogout = () => {
    logout("ADMIN")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FoodFast Admin</h1>
          <div className="flex gap-4">
            <Link href="/admin/dashboard" className="text-foreground/70 hover:text-foreground">
              Back to Dashboard
            </Link>
            {/* ⭐️ SỬA 5: Dùng hàm handleLogout */}
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">Admin Settings</h2>

        <div className="grid gap-6 max-w-2xl">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Platform Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  defaultValue="15"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Minimum Order Value ($)</label>
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Delivery Fee ($)</label>
                <input
                  type="number"
                  defaultValue="2.99"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
              </div>

              <Button className="w-full" disabled>
                Save Settings
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">API Keys</h3>
            <p className="text-foreground/70 text-sm mb-4">Manage third-party API integrations</p>
            <Button variant="outline" className="w-full bg-transparent" disabled>
              Manage API Keys
            </Button>
          </Card>
        </div>
      </main>
    </div>
  )
}
