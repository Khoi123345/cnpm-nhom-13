"use client"

import { useCartContext } from "@/hooks/cart-provider" // ⭐️ SỬA IMPORT
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation" // ⭐️ THÊM IMPORT

export function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCartContext() // ⭐️ SỬA
  const router = useRouter() // ⭐️ THÊM

  if (items.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-foreground/70">Your cart is empty</p>
      </Card>
    )
  }
  
  const deliveryFee = 15000 // Phí giao hàng 15,000 VND
  const totalPrice = getTotalPrice()
  const totalAmt = totalPrice + deliveryFee

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Shopping Cart ({getTotalItems()})</h3>

      <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center pb-4 border-b border-border">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-foreground/70">{item.price.toLocaleString('vi-VN')}₫</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center border border-border rounded hover:bg-muted"
              >
                -
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center border border-border rounded hover:bg-muted"
              >
                +
              </button>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-destructive hover:text-destructive/80 ml-2"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-foreground/70">Subtotal</span>
          <span>{totalPrice.toLocaleString('vi-VN')}₫</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-foreground/70">Delivery Fee</span>
          <span>{deliveryFee.toLocaleString('vi-VN')}₫</span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{totalAmt.toLocaleString('vi-VN')}₫</span>
        </div>
      </div>

      {/* ⭐️ SỬA: Thêm onClick và disable nếu giỏ rỗng */}
      <Button 
        className="w-full" 
        onClick={() => router.push("/customer/checkout")}
        disabled={items.length === 0}
      >
        Proceed to Checkout
      </Button>
    </Card>
  )
}