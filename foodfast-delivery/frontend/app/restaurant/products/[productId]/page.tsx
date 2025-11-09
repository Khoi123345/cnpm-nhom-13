// ff/app/restaurant/products/[productId]/page.tsx

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { ApiClient } from "@/lib/api-client"
import { API_CONFIG, API_ENDPOINTS } from "@/lib/environment"

interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  imageurl: string
  quantity: number
  restaurant: string
}

export default function ProductEditPage() {
  const router = useRouter()
  const params = useParams()
  const { logout, getStorageKeys } = useAuth()

  const productId = params.productId as string

  const [formData, setFormData] = useState<Omit<MenuItem, '_id' | 'restaurant'> | null>(null)
  const [originalData, setOriginalData] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 1. Xác thực nhà hàng (giống như trang dashboard)
  useEffect(() => {
    const keys = getStorageKeys("RESTAURANT")
    const token = localStorage.getItem(keys.tokenKey)
    const userStr = localStorage.getItem(keys.userKey)

    if (!token || !userStr) {
      router.push("/login")
      return
    }

    try {
      const user = JSON.parse(userStr)
      if (user.role !== "RESTAURANT") {
        logout("RESTAURANT")
        router.push("/login")
        return
      }
      setIsAuthenticated(true)
    } catch (e) {
      logout("RESTAURANT")
      router.push("/login")
    }
  }, [router, logout, getStorageKeys])

  // 2. Tải dữ liệu chi tiết của sản phẩm
  useEffect(() => {
    if (!isAuthenticated || !productId) return

    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        // API endpoint này lấy chi tiết 1 sản phẩm
        const response = await ApiClient.get<MenuItem>(
          `${API_CONFIG.PRODUCT_SERVICE}/api/v1/products/${productId}`,
        )

        if (response.success && response.data) {
          setOriginalData(response.data) // Lưu bản gốc
          setFormData({ // Tách dữ liệu cho form
            name: response.data.name,
            description: response.data.description,
            price: response.data.price,
            imageurl: response.data.imageurl,
            quantity: response.data.quantity, 
          })
        } else {
          setError(response.message || "Failed to fetch product details.")
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [isAuthenticated, productId]) // Chạy khi đã xác thực và có productId

  // 3. Hàm xử lý thay đổi form
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!formData) return
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // 4. Hàm Cập nhật (Update)
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setLoading(true)
    setError(null)
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(String(formData.price)),
        imageurl: formData.imageurl,
        quantity: Number.parseInt(String(formData.quantity), 10),
      }

      const response = await ApiClient.put(
        `${API_CONFIG.PRODUCT_SERVICE}${API_ENDPOINTS.UPDATE_PRODUCT.replace(
          ":id",
          originalData._id,
        )}`,
        updateData,
      )

      if (response.success) {
        alert("Product updated successfully!")
        router.push("/restaurant/dashboard") // Quay lại trang menu
      } else {
        setError(response.message)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null // Chờ xác thực
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header đơn giản */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Edit Product</h1>
          <Button
            variant="outline"
            onClick={() => {
              logout("RESTAURANT")
              router.push("/")
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/restaurant/dashboard"
            className="text-primary hover:underline"
          >
            &larr; Back to Menu
          </Link>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && !formData && <p>Loading product details...</p>}

        {formData && (
          <Card className="p-6">
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium mb-2">
                  Item Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="description"
                  className="block text-sm font-medium mb-2"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full"
                  rows={4}
                  required
                />
              </div>
              {/* ⭐️ SỬA 5: Thêm trường Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="block text-sm font-medium mb-2">
                    Price
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quantity" className="block text-sm font-medium mb-2">
                    Quantity in Stock
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="price" className="block text-sm font-medium mb-2">
                  Price
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleFormChange}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="imageurl"
                  className="block text-sm font-medium mb-2"
                >
                  Image URL
                </Label>
                <Input
                  id="imageurl"
                  name="imageurl"
                  value={formData.imageurl}
                  onChange={handleFormChange}
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Card>
        )}
      </main>
    </div>
  )
}