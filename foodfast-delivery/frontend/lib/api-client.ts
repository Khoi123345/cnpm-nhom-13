// ff/lib/api-client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  user?: any
  token?: string
}

// Hàm trợ giúp kiểm tra URL tuyệt đối
function isAbsoluteURL(url: string) {
  return url.startsWith("http://") || url.startsWith("https://")
}

export class ApiClient {
  private static getHeaders() {
    const path = typeof window !== "undefined" ? window.location.pathname : ""
    let token: string | null = null

    // 1. Xác định thứ tự ưu tiên token dựa trên URL
    const tokenPriority: string[] = []

    if (path.startsWith("/admin")) {
      // Nếu ở trang Admin, ưu tiên admin_token
      tokenPriority.push("admin_token", "restaurant_token", "customer_token")
    } else if (path.startsWith("/restaurant")) {
      // Nếu ở trang Restaurant, ưu tiên restaurant_token
      tokenPriority.push("restaurant_token", "admin_token", "customer_token")
    } else if (path.startsWith("/customer")) {
      // Nếu ở trang Customer, ưu tiên customer_token
      tokenPriority.push("customer_token", "admin_token", "restaurant_token")
    } else {
      // Mặc định (cho trang login, homepage, v.v.)
      tokenPriority.push("admin_token", "restaurant_token", "customer_token")
    }

    // 2. Lấy token đầu tiên tìm thấy theo thứ tự ưu tiên
    for (const key of tokenPriority) {
      const t = localStorage.getItem(key)
      if (t) {
        token = t
        break // Đã tìm thấy token phù hợp nhất
      }
    }

    // 3. Trả về headers
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  static async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      // ⭐️ SỬA ĐỔI TẠI ĐÂY
      const url = isAbsoluteURL(endpoint) ? endpoint : `${API_BASE_URL}${endpoint}`

      const response = await fetch(url, { // ⭐️ Dùng url
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    } catch (error: any) {
      console.error("[API Error]", error.message)
      throw error
    }
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      // ⭐️ SỬA ĐỔI TẠI ĐÂY
      const url = isAbsoluteURL(endpoint) ? endpoint : `${API_BASE_URL}${endpoint}`

      const response = await fetch(url, { // ⭐️ Dùng url
        method: "GET",
        headers: this.getHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    } catch (error: any) {
      console.error("[API Error]", error.message)
      throw error
    }
  }

  static async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      // ⭐️ SỬA ĐỔI TẠI ĐÂY
      const url = isAbsoluteURL(endpoint) ? endpoint : `${API_BASE_URL}${endpoint}`
      
      const response = await fetch(url, { // ⭐️ Dùng url
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    } catch (error: any) {
      console.error("[API Error]", error.message)
      throw error
    }
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      // ⭐️ SỬA ĐỔI TẠI ĐÂY
      const url = isAbsoluteURL(endpoint) ? endpoint : `${API_BASE_URL}${endpoint}`
      
      const response = await fetch(url, { // ⭐️ Dùng url
        method: "DELETE",
        headers: this.getHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    } catch (error: any) {
      console.error("[API Error]", error.message)
      throw error
    }
  }
}