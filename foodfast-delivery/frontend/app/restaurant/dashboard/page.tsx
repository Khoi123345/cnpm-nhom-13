// ff/app/restaurant/dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MenuManager } from "@/components/restaurant/menu-manager"
import { OrderHandler } from "@/components/restaurant/order-handler"
import RestaurantDroneManager from "@/components/restaurant/drone-manager"
import { useAuth } from "@/hooks/use-auth"
import { ApiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/environment" // ⭐️ Sửa 1: Import API_ENDPOINTS

export default function RestaurantDashboard() {
  const router = useRouter()
  const { logout, getStorageKeys } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "drones">("menu")

  useEffect(() => {
    const keys = getStorageKeys("RESTAURANT")
    const token = localStorage.getItem(keys.tokenKey)
    const userStr = localStorage.getItem(keys.userKey)
    console.debug("[RestGuard] keys:", keys, "; hasToken:", !!token, "; hasUser:", !!userStr)

    if (!token || !userStr) {
      console.warn("[RestGuard] Missing token or user, redirecting to /login")
      router.push("/login")
      return
    }
    
    // ⭐️ SỬA 2: Đồng bộ hóa token toàn cục khi tải lại trang
    // Điều này đảm bảo ApiClient và fetch() luôn dùng đúng token
    // localStorage.setItem("token", token)
    // localStorage.setItem("user", userStr)
    // ⭐️ KẾT THÚC SỬA 2

    try {
      const user = JSON.parse(userStr)
      console.debug("[RestGuard] Parsed user role:", user?.role)

      if (user.role !== "RESTAURANT") {
        alert("Access Denied: You are not a restaurant owner.")
        logout("RESTAURANT")
        router.push("/login")
        return
      }

      setIsAuthenticated(true)

      const setRestaurantOnline = async () => {
        try {
          // ⭐️ SỬA 3: Dùng .put và đúng endpoint
          await ApiClient.put(
            `${API_ENDPOINTS.GET_MY_RESTAURANT}/status`, 
            {
              isOnline: true,
            },
            "RESTAURANT"
          )
          console.log("Restaurant set to ONLINE")
        } catch (error) {
          console.error("Failed to set restaurant online:", error)
        }
      }

      setRestaurantOnline()
    } catch (e) {
      logout("RESTAURANT")
      router.push("/login")
    }
  }, [router, logout, getStorageKeys])

  useEffect(() => {
    // ⭐️ SỬA 4: Phải return một hàm cleanup
    return () => {
      if (isAuthenticated) {
        // (Kiểm tra này có thể không cần thiết nhưng để an toàn)
        const keys = getStorageKeys("RESTAURANT")
        const userStr = localStorage.getItem(keys.userKey)
        if (userStr) {
          const setRestaurantOffline = async () => {
            try {
              // ⭐️ SỬA 5: Dùng .put và đúng endpoint
              await ApiClient.put(
                `${API_ENDPOINTS.GET_MY_RESTAURANT}/status`,
                {
                  isOnline: false,
                },
                "RESTAURANT"
              )
              console.log("Restaurant set to OFFLINE")
            } catch (error) {
              // Không cần báo lỗi nghiêm trọng khi đóng tab
              console.warn("Failed to set restaurant offline on cleanup:", error)
            }
          }
          setRestaurantOffline()
        }
      }
    }
  }, [isAuthenticated, getStorageKeys]) // ⭐️ KẾT THÚC SỬA 4

  const handleLogout = async () => {
    try {
      // ⭐️ SỬA 6: Dùng .put và đúng endpoint
      await ApiClient.put(
        `${API_ENDPOINTS.GET_MY_RESTAURANT}/status`, 
        {
          isOnline: false,
        },
        "RESTAURANT"
      )
    } catch (error) {
      console.error("Failed to set restaurant offline:", error)
    }

    logout("RESTAURANT")
    router.push("/")
  }

  if (!isAuthenticated) {
    return null
  }

  // ... (Phần return JSX giữ nguyên)
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FoodFast Restaurant</h1>
          <nav className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab("menu")}
              className={`font-medium transition ${
                activeTab === "menu"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Menu Management
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`font-medium transition ${
                activeTab === "orders"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Orders
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
            <Link href="/restaurant/settings" className="text-foreground/70 hover:text-foreground">
              Settings
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === "menu" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Manage Your Menu</h2>
            <MenuManager />
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Order Management</h2>
            <OrderHandler />
          </div>
        )}

        {activeTab === "drones" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">🚁 Drone Fleet Management</h2>
            <RestaurantDroneManager />
          </div>
        )}
      </main>
    </div>
  )
}