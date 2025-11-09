import { ApiClient } from "./api-client"

export interface OrderItem {
  product_id: string
  quantity: number
  price: number
}

export interface OrderRequest {
  customer_id: string
  items: OrderItem[]
  restaurant_id: string
  total_price: number
  delivery_address: string
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED"
}

export interface Order extends OrderRequest {
  id: string
  createdAt: string
  updatedAt: string
}

export class OrderService {
  static async createOrder(order: Omit<OrderRequest, "id">): Promise<Order> {
    const response = await ApiClient.post<Order>("/api/order", order)
    return response.data!
  }

  static async getOrder(orderId: string): Promise<Order> {
    const response = await ApiClient.get<Order>(`/api/order/${orderId}`)
    return response.data!
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    const response = await ApiClient.get<Order[]>(`/api/order/user/${userId}`)
    return response.data!
  }

  static async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const response = await ApiClient.put<Order>(`/api/order/${orderId}`, { status })
    return response.data!
  }

  static async cancelOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, "CANCELLED")
  }
}
