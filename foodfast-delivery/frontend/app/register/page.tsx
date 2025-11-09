"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, registerRestaurant, loading, error } = useAuth()
  const role = searchParams.get("role") || "customer"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    restaurant_address: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    if (role === "restaurant") {
      const response = await registerRestaurant(
        formData.email,
        formData.password,
        formData.full_name,
        formData.phone,
        formData.restaurant_address,
      )
      if (response?.success) {
        alert("Restaurant registration submitted! Waiting for admin approval.")
        router.push("/login")
      }
    } else {
      const response = await register(formData.email, formData.password, formData.full_name, formData.phone)
      if (response?.success) {
        router.push("/customer/dashboard")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-2xl font-bold text-primary mb-8 block text-center">
          FoodFast
        </Link>

        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-2">
            {role === "restaurant" ? "Join as Restaurant Partner" : "Sign Up"}
          </h1>
          <p className="text-sm text-foreground/70 mb-6">
            {role === "restaurant"
              ? "Register your restaurant to start accepting orders"
              : "Create an account to order delicious food"}
          </p>

          {error && <div className="bg-destructive/10 text-destructive p-3 rounded mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder={role === "restaurant" ? "Restaurant Name" : "Your Name"}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>

            {role === "restaurant" && (
              <div>
                <label className="block text-sm font-medium mb-2">Restaurant Address</label>
                <input
                  type="text"
                  name="restaurant_address"
                  value={formData.restaurant_address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  placeholder="123 Main St, City"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 flex gap-2 justify-center text-sm">
            {role === "restaurant" ? (
              <>
                <span className="text-foreground/70">Order as customer?</span>
                <Link href="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <span className="text-foreground/70">Own a restaurant?</span>
                <Link href="/register?role=restaurant" className="text-primary hover:underline">
                  Register here
                </Link>
              </>
            )}
          </div>

          <p className="text-center text-sm text-foreground/70 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
