"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  userRole?: "CUSTOMER" | "RESTAURANT" | "ADMIN"
  onLogout?: () => void
}

export function Navbar({ userRole, onLogout }: NavbarProps) {
  const router = useRouter()

  const handleLogout = () => {
    // Xóa tất cả các key có thể có để đảm bảo logout sạch
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("customer_token")
    localStorage.removeItem("customer_user")
    localStorage.removeItem("restaurant_token")
    localStorage.removeItem("restaurant_user")
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")

    if (onLogout) onLogout()
    router.push("/")
  }

  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          FoodFast
        </Link>

        <nav className="flex items-center gap-6">
          {userRole ? (
            // --- Dành cho người dùng đã đăng nhập ---
            <>
              {userRole === "CUSTOMER" && (
                <>
                  <Link href="/customer/dashboard" className="text-foreground/70 hover:text-foreground">
                    Duyệt
                  </Link>
                  <Link href="/customer/orders" className="text-foreground/70 hover:text-foreground">
                    Đơn Hàng Của Tôi
                  </Link>
                </>
              )}

              {userRole === "RESTAURANT" && (
                <>
                  <Link href="/restaurant/dashboard" className="text-foreground/70 hover:text-foreground">
                    Thực Đơn
                  </Link>
                  <Link href="/restaurant/settings" className="text-foreground/70 hover:text-foreground">
                    Cài Đặt
                  </Link>
                </>
              )}

              {userRole === "ADMIN" && (
                <>
                  <Link href="/admin/dashboard" className="text-foreground/70 hover:text-foreground">
                    Bảng Điều Khiển
                  </Link>
                  <Link href="/admin/settings" className="text-foreground/70 hover:text-foreground">
                    Cài Đặt
                  </Link>
                </>
              )}

              <Button variant="outline" onClick={handleLogout}>
                Đăng Xuất
              </Button>
            </>
          ) : (
            // --- Dành cho khách (chưa đăng nhập) ---
            <>
              <Button variant="outline" asChild>
                <Link href="/login">Đăng Nhập</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Đăng Ký</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}