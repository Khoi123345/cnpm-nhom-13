"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { API_ENDPOINTS } from "@/lib/environment" // ⭐️ SỬA: Import API_ENDPOINTS
import { ApiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

// ⭐️ Cập nhật kiểu EOrderStatus (thêm các trạng thái mới)
type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLATION_REQUESTED" | "CANCELLED" | "COMPLETED"

interface Order {
  id: number
  orderStatus: OrderStatus
  addressShip: string
  orderAmt: number
  placedOn: string
  orderItems: Array<{
    id: number
    productName: string
    quantity: number
    price: number
  }>
}

export function OrderHandler() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getStorageKeys } = useAuth() 

  const getRestaurantId = () => {
    const keys = getStorageKeys("RESTAURANT")
    const userStr = localStorage.getItem(keys.userKey)
    if (userStr) {
      const user = JSON.parse(userStr)
      return user.id 
    }
    return null
  }

  const fetchOrders = async () => {
    const restaurantId = getRestaurantId()
    if (!restaurantId) {
      setError("Could not find restaurant ID.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      // ⭐️ SỬA: Dùng hằng số
      const response = await ApiClient.get<Order[]>(
        `${API_ENDPOINTS.GET_RESTAURANT_ORDERS}?restaurantId=${restaurantId}`
      )
      
      if (response.success) {
        // Sắp xếp đơn hàng: PENDING và CANCELLATION_REQUESTED lên đầu
        const sorted = (response.data || []).sort((a, b) => {
           if (a.orderStatus === "PENDING") return -1;
           if (b.orderStatus === "PENDING") return 1;
           if (a.orderStatus === "CANCELLATION_REQUESTED") return -1;
           if (b.orderStatus === "CANCELLATION_REQUESTED") return 1;
           return new Date(b.placedOn).getTime() - new Date(a.placedOn).getTime();
        });
        setOrders(sorted)
      } else {
        setError(response.message)
        setOrders([]) 
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleUpdateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      // ⭐️ SỬA: Dùng hằng số
      const endpoint = API_ENDPOINTS.UPDATE_ORDER_STATUS.replace(":id", orderId.toString())
      const response = await ApiClient.put( 
        `${endpoint}?status=${status}`,
        {} 
      )
      if (response.success) {
        alert(`Order ${status.toLowerCase()}!`)
        fetchOrders() 
      } else {
        alert("Failed to update status: " + response.message)
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  // ⭐️ HÀM MỚI: Hiển thị nút bấm dựa trên trạng thái
  const renderOrderActions = (order: Order) => {
    switch (order.orderStatus) {
      case "PENDING":
        return (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}>
              Confirm Order
            </Button>
            <Button className="flex-1" variant="destructive" onClick={() => handleUpdateStatus(order.id, "CANCELLED")}>
              Cancel Order
            </Button>
          </div>
        );
      case "CONFIRMED":
        return (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => handleUpdateStatus(order.id, "PROCESSING")}>
              Start Preparing
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => handleUpdateStatus(order.id, "CANCELLATION_REQUESTED")}>
              Request Cancellation
            </Button>
          </div>
        );
      case "PROCESSING":
         return (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => handleUpdateStatus(order.id, "SHIPPED")}>
              Mark as Shipped
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => handleUpdateStatus(order.id, "CANCELLATION_REQUESTED")}>
              Request Cancellation
            </Button>
          </div>
        );
      case "CANCELLATION_REQUESTED":
        return <p className="text-sm font-medium text-destructive">Waiting for Admin approval to cancel...</p>;
      case "SHIPPED":
        return <p className="text-sm font-medium text-blue-600">Waiting for customer to confirm delivery...</p>;
      default:
        return <p className="text-sm text-foreground/70">{order.orderStatus}</p>;
    }
  }

  // ⭐️ HÀM MỚI: Lấy màu tag
  const getStatusChipColor = (status: OrderStatus) => {
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

  if (loading) return <div>Loading orders...</div>
  if (error) return <div className="text-destructive">{error}</div>

  return (
    <div className="space-y-8">
      <Button onClick={fetchOrders} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh Orders"}
      </Button>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.length === 0 ? (
          <Card className="p-6 text-center text-foreground/70 md:col-span-3">No orders found.</Card>
        ) : (
          orders.map(order => (
            <Card key={order.id} className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold">Order #{order.id}</h4>
                    <p className="text-sm text-foreground/70">{order.addressShip}</p>
                    <p className="text-lg font-bold text-primary">{order.orderAmt.toLocaleString('vi-VN')}₫</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusChipColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {order.orderItems.map(item => (
                     <div key={item.id} className="flex justify-between text-sm">
                       <span>{item.quantity} x {item.productName}</span>
                       <span>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                     </div>
                  ))}
                </div>
              </div>
              {/* ⭐️ SỬA ĐỔI: Gọi hàm render actions */}
              <div className="mt-4">
                {renderOrderActions(order)}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}