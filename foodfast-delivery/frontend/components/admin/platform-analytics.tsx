// ff/components/admin/platform-analytics.tsx

"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { ApiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/environment"
import { Skeleton } from "@/components/ui/skeleton" // Thêm Skeleton để làm đẹp khi tải

// ⭐️ ĐỊNH NGHĨA: Cấu trúc state cho dữ liệu
interface StatsData {
  totalUsers: number
  activeRestaurants: number
  totalOrders: number
  platformRevenue: number
}

// ⭐️ ĐỊNH NGHĨA: Kiểu dữ liệu Order (để tính toán)
type Order = {
  id: number
  // Thêm các trạng thái mới nhất từ EOrderStatus.java
  orderStatus: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLATION_REQUESTED" | "CANCELLED" | "COMPLETED" | "REFUNDED"
  orderAmt: number
}

export function PlatformAnalytics() {
  // ⭐️ THÊM STATE: Quản lý loading, error, và data
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ⭐️ THÊM: Hook để gọi API khi component được tải
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Gọi song song 3 API để tăng tốc độ
        const [userRes, restaurantRes, orderRes] = await Promise.all([
          // Lấy tổng user (dùng `limit=1` để lấy `totalItems` mà không cần tải cả nghìn user)
          ApiClient.get<any>(`${API_CONFIG.USER_SERVICE}/api/v1/users?limit=1`),
          // Lấy tổng nhà hàng (lọc theo role VÀ trạng thái active)
          ApiClient.get<any>(`${API_CONFIG.USER_SERVICE}/api/v1/users?role=RESTAURANT&isActive=true&limit=1`),
          // Lấy TẤT CẢ đơn hàng
          ApiClient.get<Order[]>(`${API_CONFIG.ORDER_SERVICE}/order/get/all`)
        ])

        // 2. Xử lý kết quả từ user-service
        const totalUsers = userRes.totalItems || 0
        const activeRestaurants = restaurantRes.totalItems || 0

        // 3. Xử lý kết quả từ order-service
        let totalOrders = 0
        let platformRevenue = 0

        if (orderRes.success && orderRes.data) {
          totalOrders = orderRes.data.length
          // Tính doanh thu: Lọc các đơn đã "COMPLETED" và cộng `orderAmt`
          platformRevenue = orderRes.data
            .filter(order => order.orderStatus === "COMPLETED")
            .reduce((sum, order) => sum + order.orderAmt, 0)
        }

        // 4. Cập nhật state
        setStats({
          totalUsers,
          activeRestaurants,
          totalOrders,
          platformRevenue
        })

      } catch (err: any) {
        setError(err.message || "Failed to fetch analytics data.")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, []) // Chạy 1 lần khi component mount

  // ⭐️ THÊM: Giao diện khi đang tải
  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold">Platform Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ⭐️ THÊM: Giao diện khi bị lỗi
  if (error) {
    return (
      <Card className="p-6 bg-destructive/10 border-destructive">
        <h3 className="text-lg font-bold text-destructive">Failed to load analytics</h3>
        <p className="text-destructive/80">{error}</p>
      </Card>
    )
  }

  // ⭐️ SỬA ĐỔI: Dùng dữ liệu động
  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers.toLocaleString() ?? "0", // Dùng dữ liệu từ state
      change: "+12% this month", // (Phần trăm thay đổi vẫn đang là "cứng")
      color: "text-blue-600",
    },
    {
      title: "Active Restaurants",
      value: stats?.activeRestaurants.toLocaleString() ?? "0", // Dùng dữ liệu từ state
      change: "+8% this month",
      color: "text-green-600",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders.toLocaleString() ?? "0", // Dùng dữ liệu từ state
      change: "+25% this month",
      color: "text-purple-600",
    },
    {
      title: "Platform Revenue",
      value: `$${(stats?.platformRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Dùng dữ liệu từ state
      change: "+18% this month",
      color: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Platform Analytics</h3>

      {/* Hiển thị 4 thẻ thống kê động */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <p className="text-foreground/70 text-sm mb-2">{stat.title}</p>
            <div className={`text-3xl font-bold ${stat.color} mb-2 truncate`}>{stat.value}</div>
            <p className="text-sm text-foreground/70">{stat.change}</p>
          </Card>
        ))}
      </div>

      {/* Phần Hoạt động Gần đây (Vẫn giữ "cứng") */}
      <Card className="p-6">
        <h4 className="font-bold mb-4">Recent Activity (Static)</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm pb-3 border-b border-border">
            <span>New user registered</span>
            <span className="text-foreground/70">5 mins ago</span>
          </div>
          <div className="flex justify-between text-sm pb-3 border-b border-border">
            <span>Order completed</span>
            <span className="text-foreground/70">12 mins ago</span>
          </div>
          <div className="flex justify-between text-sm pb-3 border-b border-border">
            <span>Restaurant approved</span>
            <span className="text-foreground/70">1 hour ago</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>New menu items added</span>
            <span className="text-foreground/70">2 hours ago</span>
          </div>
        </div>
      </Card>
    </div>
  )
}