// ff/app/admin/dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserManagement } from "@/components/admin/user-management"
import { RestaurantApproval } from "@/components/admin/restaurant-approval"
import { PlatformAnalytics } from "@/components/admin/platform-analytics"
import { useAuth } from "@/hooks/use-auth" // ⭐️ THÊM IMPORT NÀY
import { OrderManagement } from "@/components/admin/order-management"
import AdminDroneApproval from "@/components/admin/drone-approval"

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "restaurants" | "orders" | "drones">("analytics")
  const { logout, getStorageKeys } = useAuth() // ⭐️ THÊM HOOK NÀY

  useEffect(() => {
    // ⭐️ SỬA: Dùng logic từ useAuth để lấy đúng key
    const keys = getStorageKeys("ADMIN")
    const token = localStorage.getItem(keys.tokenKey)
    const userStr = localStorage.getItem(keys.userKey)

    console.debug("[AdminGuard] keys:", keys, "; hasToken:", !!token, "; hasUser:", !!userStr)

    if (!token || !userStr) {
      console.warn("[AdminGuard] Missing token or user, redirecting to /login")
      router.push("/login")
      return; // Thoát sớm
    }

    // ⭐️ THÊM: Đồng bộ token toàn cục
    // localStorage.setItem("token", token)
    // localStorage.setItem("user", userStr)

    try {
      const user = JSON.parse(userStr);
      console.debug("[AdminGuard] Parsed user role:", user?.role)

      if (user.role !== "ADMIN") {
        console.warn("[AdminGuard] Role is not ADMIN, redirecting to /login")
        alert("Access Denied: You are not an admin.");
        logout("ADMIN"); // ⭐️ Sửa: Dùng hàm logout
        router.push("/login");
        return;
      }

      setIsAuthenticated(true)

    } catch (e) {
      logout("ADMIN"); // ⭐️ Sửa: Dùng hàm logout
      router.push("/login");
    }
  }, [router, logout, getStorageKeys]) // ⭐️ Cập nhật dependencies

  // ⭐️ XÓA KHỐI useEffect BỊ TRÙNG LẶP NÀY
  // useEffect(() => {
  //   const token = localStorage.getItem("token")
  //   ...
  // }, [router])
  
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Food Fast - Quản Trị</h1>
          <nav className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`font-medium transition ${
                activeTab === "analytics"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Thống Kê
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`font-medium transition ${
                activeTab === "users"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Người Dùng
            </button>
            <button
              onClick={() => setActiveTab("restaurants")}
              className={`font-medium transition ${
                activeTab === "restaurants"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Nhà Hàng
            </button>
            
            {/* ⭐️ 3. THÊM NÚT BẤM TAB ORDERS */}
            <button
              onClick={() => setActiveTab("orders")}
              className={`font-medium transition ${
                activeTab === "orders"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Đơn Hàng
            </button>
            
            <button
              onClick={() => setActiveTab("drones")}
              className={`font-medium transition ${
                activeTab === "drones"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              🚁 Drones
            </button>
            
            <Link href="/admin/settings" className="text-foreground/70 hover:text-foreground">
              Cài Đặt
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                logout("ADMIN") 
                router.push("/")
              }}
            >
              Đăng Xuất
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === "analytics" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Tổng Quan Nền Tảng</h2>
            <PlatformAnalytics />
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Quản Lý Người Dùng</h2>
            <UserManagement />
          </div>
        )}

        {activeTab === "restaurants" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Quản Lý Nhà Hàng</h2>
            <RestaurantApproval />
          </div>
        )}
        
        {/* ⭐️ 4. THÊM NỘI DUNG CHO TAB ORDERS */}
        {activeTab === "orders" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Quản Lý Đơn Hàng</h2>
            <OrderManagement />
          </div>
        )}
        
        {activeTab === "drones" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">🚁 Quản Lý Đăng Ký Drone</h2>
            <AdminDroneApproval />
          </div>
        )}
      </main>
    </div>
  )
}