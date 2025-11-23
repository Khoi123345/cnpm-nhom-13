"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  // ⭐️ Thêm fields cho tên
  userName?: string
  restaurantName?: string
}

export function OrderManagement() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  
  // ⭐️ Hàm fetch tất cả orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await ApiClient.get<Order[]>(
        API_ENDPOINTS.GET_ALL_ORDERS 
      )
      
      if (response.success) {
        const ordersData = response.data || []
        
        // ⭐️ userName và restaurantName đã có sẵn từ database
        // Không cần fetch riêng nữa!
        
        // Sắp xếp: Yêu cầu hủy lên đầu, sau đó theo ID mới nhất
        const sorted = ordersData.sort((a, b) => {
           if (a.orderStatus === "CANCELLATION_REQUESTED" && b.orderStatus !== "CANCELLATION_REQUESTED") return -1;
           if (b.orderStatus === "CANCELLATION_REQUESTED" && a.orderStatus !== "CANCELLATION_REQUESTED") return 1;
           // Sắp xếp theo ID giảm dần (mới nhất lên đầu)
           return b.id - a.id;
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

  // Helper: Get status badge variant
  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, { variant: string; label: string }> = {
      PENDING: { variant: "bg-yellow-100 text-yellow-800", label: "Chờ xác nhận" },
      CONFIRMED: { variant: "bg-blue-100 text-blue-800", label: "Đã xác nhận" },
      PROCESSING: { variant: "bg-purple-100 text-purple-800", label: "Đang xử lý" },
      SHIPPED: { variant: "bg-cyan-100 text-cyan-800", label: "Đang giao" },
      DELIVERED: { variant: "bg-green-100 text-green-800", label: "Đã giao" },
      CANCELLATION_REQUESTED: { variant: "bg-orange-100 text-orange-800", label: "Yêu cầu hủy" },
      CANCELLED: { variant: "bg-red-100 text-red-800", label: "Đã hủy" },
      COMPLETED: { variant: "bg-emerald-100 text-emerald-800", label: "Hoàn thành" },
    };
    const config = variants[status] || { variant: "bg-gray-100 text-gray-800", label: status };
    return <Badge className={config.variant}>{config.label}</Badge>;
  };

  const getStatusCount = (status: OrderStatus) => orders.filter(o => o.orderStatus === status).length;

  // Multi-layer filtering
  const baseFiltered = statusFilter === "ALL" 
    ? orders.filter(o => o.orderStatus !== "CANCELLATION_REQUESTED")
    : orders.filter(o => o.orderStatus === statusFilter);
    
  const filteredOrders = baseFiltered
    .filter(o => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        o.id.toString().includes(query) ||
        (o.userName && o.userName.toLowerCase().includes(query)) ||
        (o.restaurantName && o.restaurantName.toLowerCase().includes(query)) ||
        o.orderAmt.toString().includes(query)
      );
    })
    .filter(o => {
      if (!startDate && !endDate) return true;
      const orderDate = new Date(o.placedOn);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start && orderDate < start) return false;
      if (end && orderDate > end) return false;
      return true;
    });
  
  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, startDate, endDate]);

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
        <h3 className="text-xl font-bold">📦 Quản lý đơn hàng</h3>
        <Button onClick={fetchOrders} disabled={loading}>Làm mới</Button>
      </div>

      {/* Search and Date Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="🔍 Tìm theo ID, tên, số tiền..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:col-span-2"
        />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "ALL" ? "default" : "outline"} 
          onClick={() => setStatusFilter("ALL")}
          size="sm"
        >
          Tất cả ({orders.filter(o => o.orderStatus !== "CANCELLATION_REQUESTED").length})
        </Button>
        <Button 
          variant={statusFilter === "PENDING" ? "default" : "outline"} 
          onClick={() => setStatusFilter("PENDING")}
          size="sm"
        >
          Chờ xác nhận ({getStatusCount("PENDING")})
        </Button>
        <Button 
          variant={statusFilter === "CONFIRMED" ? "default" : "outline"} 
          onClick={() => setStatusFilter("CONFIRMED")}
          size="sm"
        >
          Đã xác nhận ({getStatusCount("CONFIRMED")})
        </Button>
        <Button 
          variant={statusFilter === "SHIPPED" ? "default" : "outline"} 
          onClick={() => setStatusFilter("SHIPPED")}
          size="sm"
        >
          Đang giao ({getStatusCount("SHIPPED")})
        </Button>
        <Button 
          variant={statusFilter === "DELIVERED" ? "default" : "outline"} 
          onClick={() => setStatusFilter("DELIVERED")}
          size="sm"
        >
          Đã giao ({getStatusCount("DELIVERED")})
        </Button>
        <Button 
          variant={statusFilter === "CANCELLED" ? "default" : "outline"} 
          onClick={() => setStatusFilter("CANCELLED")}
          size="sm"
        >
          Đã hủy ({getStatusCount("CANCELLED")})
        </Button>
        <Button 
          variant={statusFilter === "COMPLETED" ? "default" : "outline"} 
          onClick={() => setStatusFilter("COMPLETED")}
          size="sm"
        >
          Hoàn thành ({getStatusCount("COMPLETED")})
        </Button>
      </div>

      {/* Yêu cầu hủy */}
      <h4 className="text-lg font-semibold text-destructive">⚠️ Yêu cầu hủy đơn ({cancellationRequests.length})</h4>
      <div className="grid gap-4 md:grid-cols-2">
        {cancellationRequests.length === 0 ? (
          <Card className="p-4 text-center text-foreground/70 md:col-span-2">No cancellation requests.</Card>
        ) : (
          cancellationRequests.map(order => (
            <Card key={order.id} className="p-4 bg-destructive/10 border-destructive">
               <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">Order #{order.id}</h4>
                    <p className="text-sm">User: {order.userName || `User-${order.userId?.substring(0, 8)}`}</p>
                    <p className="text-sm">Restaurant: {order.restaurantName || `Rest-${order.restaurantId?.substring(0, 8)}`}</p>
                  </div>
                   <span className="text-lg font-bold">{order.orderAmt.toLocaleString('vi-VN')}₫</span>
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
      <h4 className="text-lg font-semibold">
        {statusFilter === "ALL" ? "Tất cả đơn hàng khác" : `Đơn hàng: ${statusFilter}`}
      </h4>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-muted">
             <tr>
               <th className="px-4 py-3 text-left text-sm font-medium">Mã đơn</th>
               <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
               <th className="px-4 py-3 text-left text-sm font-medium">Số tiền</th>
               <th className="px-4 py-3 text-left text-sm font-medium">Khách hàng</th>
               <th className="px-4 py-3 text-left text-sm font-medium">Nhà hàng</th>
               <th className="px-4 py-3 text-left text-sm font-medium">Thời gian</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedOrders.map(order => (
              <tr 
                key={order.id} 
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                <td className="px-4 py-3 font-medium">#{order.id}</td>
                <td className="px-4 py-3">{getStatusBadge(order.orderStatus)}</td>
                <td className="px-4 py-3 font-semibold">{order.orderAmt.toLocaleString('vi-VN')}₫</td>
                <td className="px-4 py-3">{order.userName || `User-${order.userId?.substring(0, 8)}`}</td>
                <td className="px-4 py-3">{order.restaurantName || `Rest-${order.restaurantId?.substring(0, 8)}`}</td>
                <td className="px-4 py-3 text-xs">{new Date(order.placedOn).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ← Trước
          </Button>
          <span className="text-sm font-medium">
            Trang {currentPage} / {totalPages} ({filteredOrders.length} đơn)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau →
          </Button>
        </div>
      )}
    </div>
  )
}