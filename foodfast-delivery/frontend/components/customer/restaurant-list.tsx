"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { API_ENDPOINTS } from "@/lib/environment" // ⭐️ SỬA: Xoá API_CONFIG
import { ApiClient } from "@/lib/api-client" // ⭐️ THÊM: Import ApiClient

interface Restaurant {
  _id: string
  name: string
  address: string
  phone: string
  isActive: boolean
  isOnline: boolean
  createdAt: string
}

// ⭐️ THÊM: Định nghĩa props
interface RestaurantListProps {
  onSelectRestaurant: (restaurantId: string) => void;
}

export function RestaurantList({ onSelectRestaurant }: RestaurantListProps) { // ⭐️ SỬA
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true)
        // ⭐️ SỬA: Dùng ApiClient thay vì fetch
        const data: any = await ApiClient.get(API_ENDPOINTS.GET_RESTAURANTS)

        // ⭐️ SỬA: Logic trích xuất data
        // (Giả định product-service trả về { restaurants: [...] }
        // không giống các service khác)
        const onlineRestaurants = (data.restaurants || []) 
          .filter(
            (r: Restaurant) => r.isActive === true && r.isOnline === true,
          )
        setRestaurants(onlineRestaurants)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
    const interval = setInterval(fetchRestaurants, 5000)
    return () => clearInterval(interval)
  }, [])

  // ... (loading, error, no restaurants...)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants.map((restaurant) => (
        <Card key={restaurant._id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {/* ... (phần header card) ... */}
           <div className="bg-gradient-to-r from-primary to-accent h-32 flex items-center justify-center">
            <div className="text-4xl font-bold text-primary-foreground">{restaurant.name.charAt(0)}</div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold">{restaurant.name}</h3>
              <p className="text-sm text-foreground/70">{restaurant.address}</p>
            </div>

            {/* ... (phần phone, status) ... */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">📞 {restaurant.phone}</span>

              {restaurant.isOnline ? (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Open</span>
              ) : (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Closed</span>
              )}
            </div>

            {/* ⭐️ SỬA: Thêm onClick */}
            <Button className="w-full" onClick={() => onSelectRestaurant(restaurant._id)}>
              View Menu
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}