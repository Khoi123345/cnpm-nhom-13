// ff/components/restaurant/menu-manager.tsx

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link" // ⭐️ THÊM IMPORT
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { API_ENDPOINTS } from "@/lib/environment" // ⭐️ SỬA: Xoá API_CONFIG
import { ApiClient } from "@/lib/api-client"

interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  imageurl: string
  quantity: number // Thêm quantity
  restaurant: string
}

export function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageurl: "",
    quantity: "0", // Thêm quantity
  })

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)
      // ⭐️ SỬA: Dùng hằng số
      const response = await ApiClient.get<MenuItem[]>(
        API_ENDPOINTS.GET_MY_PRODUCTS,
      )
      if (response.success) {
        setItems(response.data || [])
      } else {
        setError(response.message)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      // ⭐️ SỬA: Dùng hằng số
      const response = await ApiClient.post(
        API_ENDPOINTS.CREATE_PRODUCT,
        {
          ...formData, // Gửi tất cả data
          price: Number.parseFloat(formData.price), // Ghi đè price thành số
          quantity: Number.parseInt(formData.quantity, 10), // Ghi đè quantity thành số
        },
      )

      if (response.success) {
        setFormData({ name: "", description: "", price: "", imageurl: "", quantity: "0" })
        setShowForm(false)
        fetchMenuItems()
      } else {
        setError(response.message)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteItem = async (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation() // Ngăn chặn link card bị kích hoạt
    e.preventDefault()  // Ngăn chặn link card bị kích hoạt

    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      // ⭐️ SỬA: Dùng hằng số
      await ApiClient.delete(
        API_ENDPOINTS.DELETE_PRODUCT.replace(
          ":id",
          id,
        ),
      )
      fetchMenuItems()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <div>Loading menu...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Menu Items</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Item"}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded">{error}</div>
      )}

      {/* Form "Add Item" */}
      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="Burger Deluxe"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="Delicious burger description"
                rows={3}
                required
              />
            </div>

            {/* ⭐️ SỬA LỖI LAYOUT TẠI ĐÂY: Thêm div grid wrapper */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2"> {/* Price chiếm 2 cột */}
                <label className="block text-sm font-medium mb-2">Price (VND)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  placeholder="50000"
                  required
                />
              </div>

              <div> {/* Quantity chiếm 1 cột */}
                <label className="block text-sm font-medium mb-2">Initial Quantity</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            {/* ⭐️ KẾT THÚC SỬA LỖI LAYOUT */}
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageurl}
                onChange={(e) =>
                  setFormData({ ...formData, imageurl: e.target.value })
                }
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="https://..."
              />
            </div>

            <Button type="submit" className="w-full">
              Add Menu Item
            </Button>
          </form>
        </Card>
      )}

      {/* Danh sách sản phẩm */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            href={`/restaurant/products/${item._id}`}
            key={item._id}
            className="group"
          >
            <Card className="p-4 flex flex-col h-full group-hover:shadow-lg transition-shadow">
              {item.imageurl && (
                <div className="mb-3 h-32 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={item.imageurl || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = "/placeholder.jP_g")}
                  />
                </div>
              )}
              <h4 className="font-semibold">{item.name}</h4>
              <p className="text-sm text-foreground/70 line-clamp-2 mb-3 flex-1">
                {item.description}
              </p>
              
              {/* Hiển thị số lượng tồn kho */}
              <div className="mb-2">
                <span className={`font-medium text-sm px-2 py-1 rounded ${
                  item.quantity > 10 ? 'bg-green-100 text-green-800' :
                  item.quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.quantity} in stock
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">
                  {item.price.toLocaleString('vi-VN')}₫
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => handleDeleteItem(e, item._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}