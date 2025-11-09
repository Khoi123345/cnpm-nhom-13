import { ApiClient } from "./api-client"
// ⭐️ THÊM: Import API_ENDPOINTS
import { API_ENDPOINTS } from "./environment"

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
    // ⭐️ SỬA: Dùng hằng số
    const response = await ApiClient.post<Order>(API_ENDPOINTS.CREATE_ORDER, order)
    return response.data!
  }

  static async getOrder(orderId: string): Promise<Order> {
    // ⭐️ SỬA: Dùng hằng số và thay thế :id
    const endpoint = API_ENDPOINTS.GET_ORDER.replace(":id", orderId)
    const response = await ApiClient.get<Order>(endpoint)
    return response.data!
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    // ⭐️ SỬA: Dùng hằng số và thay thế :userId
    const endpoint = API_ENDPOINTS.GET_USER_ORDERS.replace(":userId", userId)
    const response = await ApiClient.get<Order[]>(endpoint)
    return response.data!
  }

  static async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    // ⭐️ SỬA: Dùng hằng số và thay thế :id
    const endpoint = API_ENDPOINTS.UPDATE_ORDER_STATUS.replace(":id", orderId)
    const response = await ApiClient.put<Order>(endpoint, { status })
    return response.data!
  }

  static async cancelOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, "CANCELLED")
  }
}