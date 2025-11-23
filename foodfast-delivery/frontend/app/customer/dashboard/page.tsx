// ff/app/customer/dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RestaurantList } from "@/components/customer/restaurant-list"
import { ProductBrowser } from "@/components/customer/product-browser"
import { useAuth } from "@/hooks/use-auth"
import { Cart } from "@/components/customer/cart"
import { ProfileManager } from "@/components/customer/profile-manager" // ⭐️ THÊM IMPORT

export default function CustomerDashboard() {
  const router = useRouter()
  const { logout, getStorageKeys } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // ⭐️ SỬA 1: Thêm "profile" vào kiểu trạng thái
  const [activeTab, setActiveTab] = useState<"restaurants" | "products" | "profile">("restaurants")
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null) // ⭐️ THÊM state

  // ... (phần useEffect xác thực giữ nguyên)
  useEffect(() => {
    const keys = getStorageKeys("CUSTOMER")
    const token = localStorage.getItem(keys.tokenKey)
    const userStr = localStorage.getItem(keys.userKey)

    if (!token || !userStr) {
      router.push("/login")
      return
    }
    
    try {
      const user = JSON.parse(userStr)

      if (user.role !== "CUSTOMER") {
        alert("Access Denied: You are not a customer.")
        logout("CUSTOMER")
        router.push("/login")
        return
      }

      setIsAuthenticated(true)
    } catch (e) {
      logout("CUSTOMER")
      router.push("/login")
    }
  }, [router, logout, getStorageKeys])

  if (!isAuthenticated) {
    return null
  }
  
  const handleLogout = () => {
    logout("CUSTOMER")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Food Fast</h1>
          
          {/* ⭐️ SỬA 2: Thêm nút "My Profile" */}
          <nav className="flex items-center gap-6">
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
            <button
              onClick={() => setActiveTab("products")}
              className={`font-medium transition ${
                activeTab === "products"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Thực Đơn
            </button>
            <Link href="/customer/orders" className="text-foreground/70 hover:text-foreground">
              Đơn Hàng Của Tôi
            </Link>
            <Link href="/customer/tracking" className="text-foreground/70 hover:text-foreground font-medium">
              🚁 Theo dõi Drone
            </Link>
            {/* NÚT MỚI */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`font-medium transition ${
                activeTab === "profile"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Hồ Sơ Của Tôi
            </button>
            
            <Button variant="outline" onClick={handleLogout}>
              Đăng Xuất
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-balance">
            {/* ⭐️ SỬA 3: Cập nhật tiêu đề động */}
            {activeTab === "restaurants" && "Đặt Hàng Từ Các Nhà Hàng Hàng Đầu"}
            {activeTab === "products" && "Các Món Phổ Biến"}
            {activeTab === "profile" && "Quản Lý Hồ Sơ Của Bạn"}
          </h2>
          <p className="text-foreground/70 mt-2">
            {activeTab === "restaurants" && "Khám phá đồ ăn tuyệt vời từ các nhà hàng địa phương"}
            {activeTab === "products" && "Duyệt tất cả các món ăn hiện có"}
            {activeTab === "profile" && "Cập nhật thông tin cá nhân và liên hệ của bạn"}
          </p>
        </div>

        {/* ⭐️ SỬA 4: Điều chỉnh layout để ẩn giỏ hàng khi xem Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className={activeTab === 'profile' ? "lg:col-span-3" : "lg:col-span-2 space-y-8"}>
            
            {activeTab === "restaurants" && (
              <RestaurantList onSelectRestaurant={(restaurantId) => {
                setSelectedRestaurantId(restaurantId)
                setActiveTab("products")
              }} />
            )}
            {activeTab === "products" && <ProductBrowser selectedRestaurantId={selectedRestaurantId} />}
            
            {/* KHI CLICK TAB MỚI, HIỂN THỊ COMPONENT MỚI */}
            {activeTab === "profile" && <ProfileManager />}
          </div>
          
          {/* Ẩn giỏ hàng khi ở tab profile */}
          {activeTab !== 'profile' && (
            <div className="lg:col-span-1 sticky top-24">
              <Cart />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}