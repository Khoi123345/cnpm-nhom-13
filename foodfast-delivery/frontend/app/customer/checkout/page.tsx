"use client"

import type React from "react"
import { useState } from "react"
import { useCartContext } from "@/hooks/cart-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/environment"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { PaymentService } from "@/lib/payment-service"

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartContext()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD")
  const { getStorageKeys } = useAuth()

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      setError("Your cart is empty.")
      return
    }
    
    if (!deliveryAddress.trim()) {
      setError("Please enter your delivery address.")
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
      const orderItems = items.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        restaurantId: item.restaurantId,
      }))

      // 3. Định dạng OrderRequest DTO
      const totalAmount = getTotalPrice() + 2.99
      const orderRequest = {
        userId: user.id,
        addressShip: deliveryAddress,
        orderAmt: totalAmount,
        orderItems: orderItems,
      }

      // 4. Tạo đơn hàng
      const response = await ApiClient.post(
        `${API_ENDPOINTS.CREATE_ORDER}`,
        orderRequest
      )

      if (!response.success) {
        throw new Error(response.message || "Failed to create order")
      }

      const orderId = (response.data as { id: number })?.id

      // Clear cart ngay sau khi tạo order thành công (cho cả COD và VNPay)
      clearCart()

      // 5. Xử lý theo phương thức thanh toán
      if (paymentMethod === "COD") {
        // COD: Chuyển đến trang đơn hàng
        alert("Order placed successfully! You will pay on delivery.")
        router.push("/customer/orders")
      } else {
        // VNPay: Tạo payment URL và redirect
        const amountInVND = Math.round(totalAmount) // Đã là VND rồi, không cần convert
        
        const paymentResponse = await PaymentService.createVNPayPayment({
          amount: amountInVND,
          orderId: orderId,
          orderInfo: `Thanh toán đơn hàng #${orderId}`,
        })

        // Lưu orderId vào localStorage để xử lý sau khi thanh toán
        localStorage.setItem("pending_order_id", orderId.toString())
        
        // Redirect đến VNPay
        window.location.href = paymentResponse.paymentUrl
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = getTotalPrice()
  const deliveryFee = 15000 // Phí giao hàng 15,000 VND
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
                    <p>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Subtotal</span>
                  <span>{totalPrice.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Delivery Fee</span>
                  <span>{deliveryFee.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{totalAmt.toLocaleString('vi-VN')}₫</span>
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
              <div className="space-y-3">
                {/* COD Option */}
                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === "COD" 
                    ? "border-primary bg-primary/5" 
                    : "border-input hover:border-primary/50"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value as "COD")}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Cash on Delivery (COD)</div>
                    <div className="text-sm text-foreground/70">Pay when you receive your order</div>
                  </div>
                  <div className="text-2xl">💵</div>
                </label>

                {/* VNPay Option */}
                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === "VNPAY" 
                    ? "border-primary bg-primary/5" 
                    : "border-input hover:border-primary/50"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={paymentMethod === "VNPAY"}
                    onChange={(e) => setPaymentMethod(e.target.value as "VNPAY")}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      VNPay Online Payment
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Recommended</span>
                    </div>
                    <div className="text-sm text-foreground/70">Pay securely with ATM, Credit Card, or E-wallet</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                      VNP
                    </div>
                  </div>
                </label>
              </div>

              {/* VNPay Info */}
              {paymentMethod === "VNPAY" && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-medium mb-1">You will be redirected to VNPay payment gateway</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Support all ATM cards, credit cards (Visa, Master, JCB)</li>
                        <li>E-wallets: Momo, ZaloPay, VNPay Wallet</li>
                        <li>Secure payment with SSL encryption</li>
                        <li>Your order will be confirmed after successful payment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || items.length === 0}>
              {loading ? "Processing..." : paymentMethod === "VNPAY" ? "Proceed to VNPay Payment" : "Place Order"}
            </Button>
            
            {paymentMethod === "VNPAY" && (
              <p className="text-xs text-center text-foreground/60 mt-2">
                🔒 Secured by VNPay - Your payment information is protected
              </p>
            )}
          </form>
        </Card>
      </main>
    </div>
  )
}