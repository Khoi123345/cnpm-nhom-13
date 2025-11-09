"use client"

import { createContext, useContext, ReactNode } from "react"
import { useCart } from "./use-cart"

// Định nghĩa kiểu dữ liệu trả về của hook useCart
type CartContextType = ReturnType<typeof useCart>

// Tạo Context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Tạo Provider
export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart()
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>
}

// Tạo hook tùy chỉnh để sử dụng context
export function useCartContext() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider")
  }
  return context
}