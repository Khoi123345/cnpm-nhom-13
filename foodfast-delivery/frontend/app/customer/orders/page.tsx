"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth" 
import { ApiClient } from "@/lib/api-client" 
import { API_CONFIG } from "@/lib/environment" 

// ⭐️ Cập nhật kiểu
type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLATION_REQUESTED" | "CANCELLED" | "COMPLETED"
interface Order {
  id: number
  orderStatus: OrderStatus
  addressShip: string
  orderAmt: number
  placedOn: string 
}

export default function MyOrders() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getStorageKeys, logout } = useAuth() 

  const getUserId = () => {
    const keys = getStorageKeys("CUSTOMER")
    const userStr = localStorage.getItem(keys.userKey)
    if (userStr) {
      const user = JSON.parse(userStr)
      return user.id
    }
    return null
  }
  
  const fetchOrders = async () => {
    const userId = getUserId()
    if (!userId) {
      router.push("/login")
      return
    }
    setIsAuthenticated(true);

    try {
      setLoading(true)
      setError(null)
      const response = await ApiClient.get<Order[]>(
        `${API_CONFIG.ORDER_SERVICE}/order/get/byUser?mockUserId=${userId}` 
      )
      
      if (response.success) {
        // Sắp xếp đơn hàng mới nhất lên đầu
        const sorted = (response.data || []).sort((a, b) => new Date(b.placedOn).getTime() - new Date(a.placedOn).getTime());
        setOrders(sorted)
      } else {
        if (response.message.includes("No orders found")) {
          setOrders([])
        } else {
          setError(response.message)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ⭐️ SỬA ĐỔI: Dùng API mới (PATCH thay vì PUT)
  const handleUpdateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      const response = await ApiClient.put( // Giữ .put
        `${API_CONFIG.ORDER_SERVICE}/order/${orderId}/status?status=${status}`,
        {}
      )
      if (response.success) {
        alert("Action successful!");
        fetchOrders(); // Tải lại
      } else {
        alert("Failed to update status: " + response.message)
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, []) // Bỏ router, chỉ fetch 1 lần

  const handleLogout = () => {
    logout("CUSTOMER")
    router.push("/")
  }

  if (!isAuthenticated) {
    return null 
  }

  // ⭐️ HÀM MỚI: Lấy màu tag
  const getStatusChipColor = (status: OrderStatus) => {
    // (Copy hàm getStatusChipColor từ order-handler.tsx vào đây)
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED": return "bg-blue-100 text-blue-800";
      case "PROCESSING": return "bg-blue-200 text-blue-900";
      case "SHIPPED": return "bg-indigo-100 text-indigo-800";
      case "CANCELLATION_REQUESTED": return "bg-red-200 text-red-900";
      case "CANCELLED": return "bg-red-100 text-red-800";
      case "DELIVERED": return "bg-green-100 text-green-800";
      case "COMPLETED": return "bg-green-200 text-green-900";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ... (Header giữ nguyên) ... */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FoodFast</h1>
          <div className="flex gap-4">
            <Link href="/customer/dashboard" className="text-foreground/70 hover:text-foreground">
              Back to Dashboard
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">My Orders</h2>

        {loading && <div>Loading your orders...</div>}
        {error && <div className="text-destructive">{error}</div>}

        <div className="grid gap-6">
          {!loading && !error && orders.length === 0 && (
            <Card className="p-6 text-center text-foreground/70">
              <p className="text-lg">No orders yet.</p>
              <Link href="/customer/dashboard">
                <Button className="mt-4">Start Ordering</Button>
              </Link>
            </Card>
          )}

          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold">Order #{order.id}</h4>
                  <p className="text-sm text-foreground/70">Placed on: {new Date(order.placedOn).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusChipColor(order.orderStatus)}`}>
                  {order.orderStatus}
                </span>
              </div>
              <p className="text-lg font-semibold mb-4">${order.orderAmt.toFixed(2)}</p>
              
              {/* ⭐️ SỬA ĐỔI: Nút bấm theo điều kiện */}
              {order.orderStatus === "PENDING" && (
                <Button className="w-full" variant="destructive" onClick={() => handleUpdateStatus(order.id, "CANCELLED")}>
                  Cancel Order
                </Button>
              )}
              {/* ⭐️ SỬA LỖI TẠI ĐÂY */}
              {order.orderStatus === "SHIPPED" && ( 
                <Button className="w-full" onClick={() => handleUpdateStatus(order.id, "COMPLETED")}>
                  Confirm Delivery Received
                </Button>
              )}
               {order.orderStatus === "CANCELLATION_REQUESTED" && (
                <p className="text-sm text-center text-destructive">Restaurant has requested to cancel this order. Admin is reviewing.</p>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}