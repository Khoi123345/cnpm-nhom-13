"use client"

import type React from "react"
import { useState } from "react"
import { useCartContext } from "@/hooks/cart-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/environment"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartContext()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const { getStorageKeys } = useAuth()

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      setError("Your cart is empty.")
      return
    }
    setLoading(true)
    setError(null)

    try {
      // 1. Lấy user từ localStorage
      const keys = getStorageKeys("CUSTOMER")
      const userStr = localStorage.getItem(keys.userKey)
      const user = userStr ? JSON.parse(userStr) : null
      if (!user) {
        throw new Error("You must be logged in to check out.")
      }

      // 2. Định dạng OrderItems theo Model Java
      // (OrderItems.java)
      const orderItems = items.map((item) => ({
        productId: item.id, // Đảm bảo là số nếu backend yêu cầu Long
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        restaurantId: item.restaurantId,
      }))

      // 3. Định dạng OrderRequest DTO
      // (OrderRequestDto.java)
      const orderRequest = {
        userId: user.id,
        addressShip: deliveryAddress,
        orderAmt: getTotalPrice() + 2.99, // (Giả định phí ship 2.99)
        orderItems: orderItems,
      }

      // 4. Gọi API (đến port 8082, endpoint /order/create)
      const response = await ApiClient.post(
        `${API_CONFIG.ORDER_SERVICE}/order/create`,
        orderRequest
      )

      if (!response.success) {
        throw new Error(response.message || "Failed to create order")
      }

      // 5. Xử lý thành công
      clearCart()
      alert("Order placed successfully!")
      router.push("/customer/orders") // Chuyển đến trang "My Orders"

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = getTotalPrice()
  const deliveryFee = 2.99
  const totalAmt = totalPrice + deliveryFee

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8">
        <Link href="/customer/dashboard" className="text-primary hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-4">Checkout</h1>
      </header>
      
      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Cột Tóm tắt Đơn hàng */}
        <Card className="p-6 sticky top-8">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          {items.length > 0 ? (
            <>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-foreground/70">Qty: {item.quantity}</p>
                    </div>
                    <p>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${totalAmt.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-foreground/70">Your cart is empty.</p>
          )}
        </Card>

        {/* Cột Thanh toán */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6">Delivery & Payment</h3>
          {error && <div className="bg-destructive/10 text-destructive p-3 rounded mb-4">{error}</div>}
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Delivery Address</label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="Enter your delivery address"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                <option>Cash on Delivery (COD)</option>
                <option disabled>Credit Card (Not available)</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading || items.length === 0}>
              {loading ? "Processing..." : "Place Order"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}