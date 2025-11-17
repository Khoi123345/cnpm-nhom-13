"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { API_ENDPOINTS } from "@/lib/environment" // ⭐️ SỬA: Import API_ENDPOINTS
import { ApiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

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
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { getStorageKeys } = useAuth() 
  
  // Drone assignment states
  const [showDroneDialog, setShowDroneDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [availableDrones, setAvailableDrones] = useState<any[]>([])
  const [selectedDroneId, setSelectedDroneId] = useState<string>("")
  const [assigningDrone, setAssigningDrone] = useState(false)

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

  // Load available drones
  const loadAvailableDrones = async () => {
    const restaurantId = getRestaurantId()
    if (!restaurantId) {
      console.warn("Missing restaurant id, cannot load drones")
      setAvailableDrones([])
      return
    }
    try {
      const response = await ApiClient.get<any[]>(
        `${API_ENDPOINTS.GET_AVAILABLE_DRONES}?restaurantId=${restaurantId}&minBattery=20`
      )
      if (response.success && response.data) {
        setAvailableDrones(response.data)
        console.log('✅ Loaded drones:', response.data)
      } else {
        console.error('Failed to load drones:', response.message)
        setAvailableDrones([])
      }
    } catch (err: any) {
      console.error('Error loading drones:', err)
      setAvailableDrones([])
    }
  }

  // Open drone selection dialog
  const handleShipOrder = async (order: Order) => {
    setSelectedOrder(order)
    setShowDroneDialog(true)
    await loadAvailableDrones()
  }

  // Assign drone and ship order
  const handleAssignDrone = async () => {
    if (!selectedOrder || !selectedDroneId) {
      alert('Vui lòng chọn drone')
      return
    }

    setAssigningDrone(true)
    try {
      // Call order service to ship with drone
      const endpoint = API_ENDPOINTS.SHIP_ORDER.replace(":id", selectedOrder.id.toString())
      const response = await ApiClient.post(endpoint, { droneId: parseInt(selectedDroneId) })
      
      if (response.success) {
        alert('Đã giao drone giao hàng thành công!')
        setShowDroneDialog(false)
        setSelectedOrder(null)
        setSelectedDroneId('')
        await fetchOrders()
      } else {
        alert('Lỗi: ' + response.message)
      }
    } catch (err: any) {
      alert('Lỗi khi gán drone: ' + err.message)
    } finally {
      setAssigningDrone(false)
    }
  }

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
            <Button className="flex-1" onClick={() => handleShipOrder(order)}>
              Giao hàng (Chọn Drone)
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

  // Helper: Get status badge with Vietnamese labels
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
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, startDate, endDate]);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">📦 Quản lý đơn hàng</h3>
        <Button onClick={fetchOrders} disabled={loading}>
          {loading ? "Đang tải..." : "Làm mới"}
        </Button>
      </div>

      {/* Search and Date Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="🔍 Tìm theo ID, địa chỉ, số tiền..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:col-span-2"
        />
        <Input
          type="date"
          placeholder="Từ ngày"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          type="date"
          placeholder="Đến ngày"
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
          variant={statusFilter === "PROCESSING" ? "default" : "outline"} 
          onClick={() => setStatusFilter("PROCESSING")}
          size="sm"
        >
          Đang xử lý ({getStatusCount("PROCESSING")})
        </Button>
        <Button 
          variant={statusFilter === "SHIPPED" ? "default" : "outline"} 
          onClick={() => setStatusFilter("SHIPPED")}
          size="sm"
        >
          Đang giao ({getStatusCount("SHIPPED")})
        </Button>
        <Button 
          variant={statusFilter === "CANCELLATION_REQUESTED" ? "default" : "outline"} 
          onClick={() => setStatusFilter("CANCELLATION_REQUESTED")}
          size="sm"
        >
          Yêu cầu hủy ({getStatusCount("CANCELLATION_REQUESTED")})
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedOrders.length === 0 ? (
          <Card className="p-6 text-center text-foreground/70 md:col-span-3">
            {statusFilter === "ALL" ? "Chưa có đơn hàng nào." : `Không có đơn hàng ${statusFilter}.`}
          </Card>
        ) : (
          paginatedOrders.map(order => (
            <Link key={order.id} href={`/restaurant/orders/${order.id}`}>
              <Card className="p-6 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold">Đơn hàng #{order.id}</h4>
                      <p className="text-sm text-foreground/70">{order.addressShip}</p>
                      <p className="text-lg font-bold text-primary">{order.orderAmt.toLocaleString('vi-VN')}₫</p>
                    </div>
                    {getStatusBadge(order.orderStatus)}
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
                <div className="mt-4" onClick={(e) => e.preventDefault()}>
                  {renderOrderActions(order)}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Drone Selection Dialog */}
      <Dialog open={showDroneDialog} onOpenChange={setShowDroneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chọn Drone để giao hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="bg-muted p-3 rounded">
                <p className="text-sm font-medium">Đơn hàng #{selectedOrder.id}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.addressShip}</p>
                <p className="text-sm font-bold text-primary">{selectedOrder.orderAmt.toLocaleString('vi-VN')}₫</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn Drone</label>
              <Select value={selectedDroneId} onValueChange={setSelectedDroneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn drone khả dụng..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDrones.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">Không có drone khả dụng</div>
                  ) : (
                    availableDrones.map((drone) => (
                      <SelectItem key={drone.id} value={drone.id.toString()}>
                        {drone.name} - Pin: {drone.batteryPercent}% - Tải: {drone.maxPayloadKg}kg
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableDrones.length === 0 && (
                <p className="text-xs text-destructive">
                  Không có drone sẵn sàng. Vui lòng kiểm tra danh sách drone.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDroneDialog(false)} disabled={assigningDrone}>
              Hủy
            </Button>
            <Button onClick={handleAssignDrone} disabled={!selectedDroneId || assigningDrone}>
              {assigningDrone ? "Đang xử lý..." : "Gửi lệnh xuất phát"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
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