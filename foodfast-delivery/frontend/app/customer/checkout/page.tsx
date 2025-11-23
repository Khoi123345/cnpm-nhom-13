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
import AddressMapPicker from "@/components/customer/address-map-picker-wrapper"

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartContext()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [destinationLat, setDestinationLat] = useState<number | null>(null)
  const [destinationLng, setDestinationLng] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD")
  const { getStorageKeys } = useAuth()

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setDestinationLat(lat)
    setDestinationLng(lng)
    setDeliveryAddress(address)
  }

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
      
      console.log("User object:", user) // ⭐️ Debug log
      console.log("Cart items:", items) // ⭐️ Debug log

      // 2. Định dạng OrderItems theo Model Java
      const orderItems = items.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName, // ⭐️ Thêm restaurantName
      }))

      // 3. Định dạng OrderRequest DTO
      const totalAmount = getTotalPrice() + deliveryFee
      const orderRequest = {
        userId: user.id,
        userName: user.full_name || user.email || "Unknown User", // ⭐️ Dùng full_name từ database
        addressShip: deliveryAddress,
        orderAmt: totalAmount,
        orderItems: orderItems,
        destinationLat: destinationLat, // ⭐️ GPS coordinates cho drone delivery
        destinationLng: destinationLng,
      }
      
      console.log("Order request:", orderRequest) // ⭐️ Debug log

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
          &larr; Quay lại trang chính
        </Link>
        <h1 className="text-3xl font-bold mt-4">Thanh Toán</h1>
      </header>
      
      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Cột Tóm tắt Đơn hàng */}
        <Card className="p-6 sticky top-8">
          <h2 className="text-xl font-bold mb-4">Tóm Tắt Đơn Hàng</h2>
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
                  <span className="text-foreground/70">Tạm tính</span>
                  <span>{totalPrice.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Phí giao hàng</span>
                  <span>{deliveryFee.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{totalAmt.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-foreground/70">Giỏ hàng của bạn trống.</p>
          )}
        </Card>

        {/* Cột Thanh toán */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6">Giao Hàng & Thanh Toán</h3>
          {error && <div className="bg-destructive/10 text-destructive p-3 rounded mb-4">{error}</div>}
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">📍 Vị Trí Giao Hàng</label>
              <AddressMapPicker onLocationSelect={handleLocationSelect} />
              <p className="text-xs text-foreground/60 mt-2">
                Nhấp vào bản đồ để chọn địa điểm giao hàng. Điều này sẽ kích hoạt theo dõi drone.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Địa Chỉ Giao Hàng (Tùy chọn)</label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="Ghi chú thêm hoặc nhập địa chỉ thủ công"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phương Thức Thanh Toán</label>
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
                    <div className="font-medium">Tiền Mặt Khi Nhận Hàng (COD)</div>
                    <div className="text-sm text-foreground/70">Thanh toán khi nhận đơn hàng</div>
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
                      Thanh Toán Trực Tuyến VNPay
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Đề xuất</span>
                    </div>
                    <div className="text-sm text-foreground/70">Thanh toán an toàn với ATM, Thẻ tín dụng, hoặc Ví điện tử</div>
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
                      <p className="font-medium mb-1">Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Hỗ trợ tất cả thẻ ATM, thẻ tín dụng (Visa, Master, JCB)</li>
                        <li>Ví điện tử: Momo, ZaloPay, Ví VNPay</li>
                        <li>Thanh toán bảo mật với mã hóa SSL</li>
                        <li>Đơn hàng sẽ được xác nhận sau khi thanh toán thành công</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || items.length === 0}>
              {loading ? "Đang xử lý..." : paymentMethod === "VNPAY" ? "Tiếp tục thanh toán VNPay" : "Đặt Hàng"}
            </Button>
            
            {paymentMethod === "VNPAY" && (
              <p className="text-xs text-center text-foreground/60 mt-2">
                🔒 Bảo mật bởi VNPay - Thông tin thanh toán của bạn được bảo vệ
              </p>
            )}
          </form>
        </Card>
      </main>
    </div>
  )
}