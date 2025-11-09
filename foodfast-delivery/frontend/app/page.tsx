"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = 
      localStorage.getItem("customer_token") ||
      localStorage.getItem("restaurant_token") ||
      localStorage.getItem("admin_token")
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FoodFast</h1>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => router.push("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => router.push("/register")}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <h2 className="text-5xl font-bold text-balance">Fast Food Delivery Made Simple</h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Order from your favorite restaurants and get your food delivered in minutes. Join thousands of happy
            customers today.
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <Button size="lg" onClick={() => router.push("/register")}>
              Order Now
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/register?role=restaurant")}>
              Become a Partner Restaurant
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-card p-8 rounded-lg border border-border">
            <div className="text-4xl font-bold text-primary mb-4">1000+</div>
            <h3 className="text-xl font-semibold mb-2">Restaurants</h3>
            <p className="text-foreground/70">Choose from thousands of restaurants</p>
          </div>
          <div className="bg-card p-8 rounded-lg border border-border">
            <div className="text-4xl font-bold text-primary mb-4">30 Min</div>
            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
            <p className="text-foreground/70">Average delivery time</p>
          </div>
          <div className="bg-card p-8 rounded-lg border border-border">
            <div className="text-4xl font-bold text-primary mb-4">4.8★</div>
            <h3 className="text-xl font-semibold mb-2">Highly Rated</h3>
            <p className="text-foreground/70">From satisfied customers</p>
          </div>
        </div>
      </div>
    </main>
  )
}
