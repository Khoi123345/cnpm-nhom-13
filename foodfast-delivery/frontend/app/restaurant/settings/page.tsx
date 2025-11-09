"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function RestaurantSettings() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FoodFast Restaurant</h1>
          <div className="flex gap-4">
            <Link href="/restaurant/dashboard" className="text-foreground/70 hover:text-foreground">
              Back to Dashboard
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                router.push("/")
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">Restaurant Settings</h2>

        <div className="grid gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Restaurant Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Restaurant Name</label>
                <input
                  type="text"
                  disabled
                  className="w-full px-4 py-2 border border-input rounded-lg bg-muted"
                  placeholder="Your Restaurant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  disabled
                  className="w-full px-4 py-2 border border-input rounded-lg bg-muted"
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  disabled
                  className="w-full px-4 py-2 border border-input rounded-lg bg-muted"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <Button className="w-full" disabled>
                Update Settings
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
