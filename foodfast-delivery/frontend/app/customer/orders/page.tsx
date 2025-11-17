"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth" 
import { ApiClient } from "@/lib/api-client" 
import { API_ENDPOINTS } from "@/lib/environment" 

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
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { getStorageKeys, logout } = useAuth() 

  // Ensure hooks are not conditionally skipped
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, startDate, endDate]);

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
        `${API_ENDPOINTS.GET_USER_ORDERS}?mockUserId=${userId}` 
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
      // ⭐️ SỬA: Dùng hằng số, thay thế :id và thêm query param
      const endpoint = API_ENDPOINTS.UPDATE_ORDER_STATUS.replace(":id", orderId.toString())
      
      const response = await ApiClient.put( 
        `${endpoint}?status=${status}`,
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

  // ⭐️ HÀM MỚI: Lấy badge
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
  const filteredOrders = orders
    .filter(o => statusFilter === "ALL" || o.orderStatus === statusFilter)
    .filter(o => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        o.id.toString().includes(query) ||
        o.addressShip.toLowerCase().includes(query) ||
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
  
  // (moved up) Reset to page 1 when filters change

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
        <h2 className="text-3xl font-bold mb-6">📦 Đơn hàng của tôi</h2>

        {/* Search and Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            placeholder="🔍 Tìm theo ID, địa chỉ, số tiền..."
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
        <div className="flex flex-wrap gap-2 mb-8">
          <Button 
            variant={statusFilter === "ALL" ? "default" : "outline"} 
            onClick={() => setStatusFilter("ALL")}
            size="sm"
          >
            Tất cả ({orders.length})
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
        </div>

        {loading && <div>Loading your orders...</div>}
        {error && <div className="text-destructive">{error}</div>}

        <div className="grid gap-6">
          {!loading && !error && paginatedOrders.length === 0 && (
            <Card className="p-6 text-center text-foreground/70">
              <p className="text-lg">
                {statusFilter === "ALL" ? "Chưa có đơn hàng nào." : `Không có đơn hàng ${statusFilter}.`}
              </p>
              {statusFilter === "ALL" && (
                <Link href="/customer/dashboard">
                  <Button className="mt-4">Đặt hàng ngay</Button>
                </Link>
              )}
            </Card>
          )}

          {paginatedOrders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold">Đơn hàng #{order.id}</h4>
                  <p className="text-sm text-foreground/70">
                    Đặt lúc: {new Date(order.placedOn).toLocaleString('vi-VN')}
                  </p>
                </div>
                {getStatusBadge(order.orderStatus)}
              </div>
              <p className="text-lg font-semibold mb-4">{order.orderAmt.toLocaleString('vi-VN')}₫</p>
              
              {/* ⭐️ SỬA ĐỔI: Nút bấm theo điều kiện */}
              {order.orderStatus === "PENDING" && (
                <Button className="w-full" variant="destructive" onClick={() => handleUpdateStatus(order.id, "CANCELLED")}>
                  Hủy đơn hàng
                </Button>
              )}
              {order.orderStatus === "SHIPPED" && ( 
                <Button className="w-full" onClick={() => handleUpdateStatus(order.id, "COMPLETED")}>
                  Xác nhận đã nhận hàng
                </Button>
              )}
               {order.orderStatus === "CANCELLATION_REQUESTED" && (
                <p className="text-sm text-center text-destructive">Nhà hàng yêu cầu hủy đơn. Admin đang xem xét.</p>
              )}
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
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
      </main>
    </div>
  )
}