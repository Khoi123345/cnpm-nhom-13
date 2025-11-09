// ff/components/admin/restaurant-approval.tsx

"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApiClient } from "@/lib/api-client"
import { API_CONFIG, API_ENDPOINTS } from "@/lib/environment";

interface RestaurantRequest {
  id: string
  name: string
  owner_email: string
  address: string
  phone: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  owner_id: string
}

export function RestaurantApproval() {
  const [requests, setRequests] = useState<RestaurantRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  // ⭐️ HÀM ĐÃ SỬA
  const fetchRequests = async () => {
    try {
      setLoading(true)
      
      // Dùng ApiClient (đã tự động đính kèm token)
      // Kiểu 'any' ở đây vì response từ API không khớp với ApiResponse<T>
      const response: any = await ApiClient.get( 
        `${API_CONFIG.PRODUCT_SERVICE}${API_ENDPOINTS.GET_RESTAURANTS}`
      );
      
      if (!response.success) throw new Error("Failed to fetch restaurants");

      // ⭐️ SỬA LỖI TẠI ĐÂY:
      // Dữ liệu nằm trong `response.restaurants`, không phải `response.data.restaurants`
      const pendingRequests = (response.restaurants || []) 
        .filter((r: any) => !r.isActive) // Lọc những nhà hàng chưa được kích hoạt
        .map((r: any) => ({
            id: r.owner_id, 
            name: r.name,
            owner_email: "N/A", // Bạn có thể cần lấy email từ user-service sau này
            address: r.address,
            phone: r.phone,
            status: "pending",
            createdAt: r.createdAt,
            owner_id: r.owner_id
        }));
        
      setRequests(pendingRequests);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // ⭐️ KẾT THÚC SỬA ĐỔI

  const handleApprove = async (id: string) => { 
    try {
      const response = await ApiClient.put(
          `${API_CONFIG.USER_SERVICE}${API_ENDPOINTS.GET_USERS}/${id}/approve`, // Dùng biến env
          {} 
      );

      if (!response.success) {
          throw new Error(response.message || "Failed to approve");
      }

      alert("Restaurant approved!");
      fetchRequests(); // Tải lại danh sách
    } catch (err: any) {
       setError(err.message);
       alert("Error: " + err.message);
    }
  };

  const handleReject = async (id: string) => {
    // In production, make API call to reject
    alert("Restaurant rejected!")
    // Tạm thời xóa khỏi UI để mô phỏng
    setRequests(prev => prev.filter(r => r.id !== id));
  }

  if (loading) return <div>Loading requests...</div>

  // ... (Phần JSX return giữ nguyên)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Restaurant Requests</h3>
        <Button onClick={() => fetchRequests()}>Refresh</Button>
      </div>
      
      {/* ⭐️ THÊM: Hiển thị lỗi nếu có */}
      {error && (
        <Card className="p-4 bg-destructive/10 text-destructive border-destructive">
          <p className="font-medium">Error loading requests:</p>
          <p className="text-sm">{error}</p>
        </Card>
      )}

      <div className="grid gap-4">
        {requests.length === 0 && !loading && !error ? ( // Thêm điều kiện !error
          <Card className="p-6 text-center text-foreground/70">
            <p>No pending restaurant requests</p>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold">{request.name}</h4>
                  <p className="text-sm text-foreground/70">{request.owner_email}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    request.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800" // Chỉ có thể là pending
                  }`}
                >
                  {request.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <p>📍 {request.address}</p>
                <p>📞 {request.phone}</p>
                <p>📅 Applied: {new Date(request.createdAt).toLocaleDateString()}</p>
              </div>

              {request.status === "pending" && (
                <div className="flex gap-2">
                  <Button onClick={() => handleApprove(request.id)} className="flex-1">
                    Approve
                  </Button>
                  <Button onClick={() => handleReject(request.id)} variant="destructive" className="flex-1">
                    Reject
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}