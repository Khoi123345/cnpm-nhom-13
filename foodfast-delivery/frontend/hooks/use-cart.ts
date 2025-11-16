"use client"

import { useState, useCallback } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  restaurantId: string
  restaurantName: string // ⭐️ Thêm field
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prevItems) => {
      // ⭐️ Kiểm tra nếu giỏ hàng đã có sản phẩm từ nhà hàng khác
      if (prevItems.length > 0) {
        const existingRestaurantId = prevItems[0].restaurantId
        if (existingRestaurantId !== item.restaurantId) {
          // Thông báo lỗi và không thêm
          alert(`Bạn chỉ có thể đặt món từ một nhà hàng. Giỏ hàng hiện tại có món từ "${prevItems[0].restaurantName}". Vui lòng xóa giỏ hàng để đặt từ nhà hàng khác.`)
          return prevItems
        }
      }
      
      const existingItem = prevItems.find((i) => i.id === item.id)
      if (existingItem) {
        return prevItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prevItems, { ...item, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== id))
  }, [])

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(id)
        return
      }
      setItems((prevItems) => prevItems.map((i) => (i.id === id ? { ...i, quantity } : i)))
    },
    [removeFromCart],
  )

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [items])

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }, [items])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart,
  }
}
