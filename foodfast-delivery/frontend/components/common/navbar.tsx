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
    localStorage.removeItem("token")
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
          {userRole === "CUSTOMER" && (
            <>
              <Link href="/customer/dashboard" className="text-foreground/70 hover:text-foreground">
                Browse
              </Link>
              <Link href="/customer/orders" className="text-foreground/70 hover:text-foreground">
                My Orders
              </Link>
            </>
          )}

          {userRole === "RESTAURANT" && (
            <>
              <Link href="/restaurant/dashboard" className="text-foreground/70 hover:text-foreground">
                Menu
              </Link>
              <Link href="/restaurant/settings" className="text-foreground/70 hover:text-foreground">
                Settings
              </Link>
            </>
          )}

          {userRole === "ADMIN" && (
            <>
              <Link href="/admin/dashboard" className="text-foreground/70 hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/admin/settings" className="text-foreground/70 hover:text-foreground">
                Settings
              </Link>
            </>
          )}

          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </nav>
      </div>
    </header>
  )
}
