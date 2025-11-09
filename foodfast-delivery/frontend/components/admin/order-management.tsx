"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ApiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/environment"

// ⭐️ Định nghĩa kiểu Order (phải khớp với EOrderStatus.java)
type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLATION_REQUESTED" | "CANCELLED" | "COMPLETED"

interface Order {
  id: number
  orderStatus: OrderStatus
  userId: string
  restaurantId: string
  orderAmt: number
  placedOn: string
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ⭐️ Hàm fetch tất cả orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      // ⭐️ SỬA: Dùng hằng số
      const response = await ApiClient.get<Order[]>(
        API_ENDPOINTS.GET_ALL_ORDERS 
      )
      
      if (response.success) {
        // Sắp xếp: Yêu cầu hủy lên đầu, sau đó là đơn mới
        const sorted = (response.data || []).sort((a, b) => {
           if (a.orderStatus === "CANCELLATION_REQUESTED") return -1;
           if (b.orderStatus === "CANCELLATION_REQUESTED") return 1;
           if (a.orderStatus === "PENDING") return -1;
           if (b.orderStatus === "PENDING") return 1;
           return new Date(b.placedOn).getTime() - new Date(a.placedOn).getTime();
        });
        setOrders(sorted)
      } else {
        setError(response.message)
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

  // ⭐️ Hàm cập nhật trạng thái (Admin có quyền)
  const handleUpdateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      // ⭐️ SỬA: Dùng hằng số
      const endpoint = API_ENDPOINTS.UPDATE_ORDER_STATUS.replace(":id", orderId.toString())
      const response = await ApiClient.put(
        `${endpoint}?status=${status}`,
        {}
      )
      if (response.success) {
        alert(`Order status set to ${status}!`)
        fetchOrders() // Tải lại
      } else {
        alert("Failed to update status: " + response.message)
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }
  
  if (loading) return <div>Loading all orders...</div>
  if (error) return <div className="text-destructive">{error}</div>

  const cancellationRequests = orders.filter(o => o.orderStatus === "CANCELLATION_REQUESTED");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Manage All Orders</h3>
        <Button onClick={fetchOrders} disabled={loading}>Refresh</Button>
      </div>

      {/* Yêu cầu hủy */}
      <h4 className="text-lg font-semibold text-destructive">Cancellation Requests ({cancellationRequests.length})</h4>
      <div className="grid gap-4 md:grid-cols-2">
        {cancellationRequests.length === 0 ? (
          <Card className="p-4 text-center text-foreground/70 md:col-span-2">No cancellation requests.</Card>
        ) : (
          cancellationRequests.map(order => (
            <Card key={order.id} className="p-4 bg-destructive/10 border-destructive">
               <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">Order #{order.id}</h4>
                    <p className="text-sm">User: {order.userId}</p>
                    <p className="text-sm">Restaurant: {order.restaurantId}</p>
                  </div>
                   <span className="text-lg font-bold">${order.orderAmt.toFixed(2)}</span>
               </div>
               <div className="flex gap-2 mt-4">
                  <Button className="flex-1" variant="destructive" onClick={() => handleUpdateStatus(order.id, "CANCELLED")}>
                    Approve Cancellation
                  </Button>
                  <Button className="flex-1" variant="outline" onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}>
                    Deny Request
                  </Button>
                </div>
            </Card>
          ))
        )}
      </div>

      {/* Tất cả đơn hàng khác (dạng bảng) */}
      <h4 className="text-lg font-semibold">All Other Orders</h4>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-muted">
             <tr>
               <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
               <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
               <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
               <th className="px-4 py-3 text-left text-sm font-medium">User ID</th>
               <th className="px-4 py-3 text-left text-sm font-medium">Restaurant ID</th>
               <th className="px-4 py-3 text-left text-sm font-medium">Placed On</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.filter(o => o.orderStatus !== "CANCELLATION_REQUESTED").map(order => (
              <tr key={order.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">#{order.id}</td>
                <td className="px-4 py-3">{order.orderStatus}</td>
                <td className="px-4 py-3">${order.orderAmt.toFixed(2)}</td>
                <td className="px-4 py-3 text-xs">{order.userId}</td>
                <td className="px-4 py-3 text-xs">{order.restaurantId}</td>
                <td className="px-4 py-3 text-xs">{new Date(order.placedOn).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}