// ff/components/customer/profile-manager.tsx

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/environment" // ⭐️ SỬA: Xoá API_CONFIG
import { useAuth, type User } from "@/hooks/use-auth" // Import User type

export function ProfileManager() {
  const { getStorageKeys } = useAuth()
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 1. Tải thông tin người dùng từ localStorage khi component được tải
  useEffect(() => {
    const keys = getStorageKeys("CUSTOMER")
    const userStr = localStorage.getItem(keys.userKey)
    if (userStr) {
      try {
        const user: User = JSON.parse(userStr)
        setFormData({
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
        })
        setUserId(user.id)
      } catch (e) {
        setError("Failed to load user data.")
      }
    }
  }, [getStorageKeys])

  // 2. Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // 3. Gửi yêu cầu cập nhật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      setError("User ID is missing. Cannot update profile.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // ⭐️ SỬA: Dùng hằng số và nối chuỗi
      const response = await ApiClient.put(
        `${API_ENDPOINTS.GET_USERS}/${userId}`,
        {
          full_name: formData.full_name,
          phone: formData.phone,
        }
      )

      if (response.success) {
        setSuccess("Profile updated successfully!")
        
        // CẬP NHẬT localStorage với thông tin mới
        const keys = getStorageKeys("CUSTOMER")
        localStorage.setItem(keys.userKey, JSON.stringify(response.data))
      } else {
        throw new Error(response.message || "Failed to update profile")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{success}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            className="w-full px-4 py-2 border border-input rounded-lg bg-muted/50 cursor-not-allowed"
            disabled // Không cho phép đổi email
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
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
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Card>
  )
}