// Frontend Payment Service Integration

import { ApiClient } from "./api-client"

export interface CreatePaymentRequest {
  amount: number
  orderId?: number
  orderInfo?: string
}

export interface CreatePaymentResponse {
  success: boolean
  paymentId: number
  orderId: string
  systemOrderId?: number
  amount: number
  paymentUrl: string
  message: string
}

export interface PaymentRecord {
  id: number
  userId: number
  orderId?: number
  amount: number
  currency: string
  status: string  // PENDING, COMPLETED, FAILED
  createdAt: string
  provider: string
  providerPaymentId: string
}

export class PaymentService {
  /**
   * Tạo VNPay payment URL
   * @param request - Thông tin thanh toán
   * @returns Payment URL để redirect user
   */
  static async createVNPayPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const params = new URLSearchParams({
      amount: request.amount.toString(),
      ...(request.orderId && { orderId: request.orderId.toString() }),
      ...(request.orderInfo && { orderInfo: request.orderInfo }),
    })

    const response = await ApiClient.post<CreatePaymentResponse>(
      `/api/payments/vnpay/create?${params.toString()}`,
      {}
    )

    if (!response.success) {
      throw new Error(response.message || "Failed to create payment")
    }

    return response.data!
  }

  /**
   * Lấy danh sách payments của user
   */
  static async getMyPayments(): Promise<PaymentRecord[]> {
    const response = await ApiClient.get<PaymentRecord[]>("/api/payments/me")
    
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch payments")
    }

    return response.data || []
  }

  /**
   * Lấy chi tiết một payment
   */
  static async getPayment(paymentId: number): Promise<PaymentRecord> {
    const response = await ApiClient.get<PaymentRecord>(`/api/payments/${paymentId}`)
    
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch payment")
    }

    return response.data!
  }

  /**
   * Admin: Lấy tất cả payments
   */
  static async getAllPayments(): Promise<PaymentRecord[]> {
    const response = await ApiClient.get<PaymentRecord[]>("/api/payments/admin/all")
    
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch payments")
    }

    return response.data || []
  }

  /**
   * Xử lý VNPay return callback
   * Parse query params từ URL sau khi thanh toán
   */
  static parseVNPayCallback(searchParams: URLSearchParams): {
    success: boolean
    orderId: string
    responseCode: string
    amount: number
    message: string
  } {
    const orderId = searchParams.get("vnp_TxnRef") || ""
    const responseCode = searchParams.get("vnp_ResponseCode") || ""
    const amount = parseInt(searchParams.get("vnp_Amount") || "0") / 100

    return {
      success: responseCode === "00",
      orderId,
      responseCode,
      amount,
      message: this.getResponseMessage(responseCode),
    }
  }

  /**
   * Map VNPay response code sang message tiếng Việt
   */
  private static getResponseMessage(responseCode: string): string {
    const messages: Record<string, string> = {
      "00": "Giao dịch thành công",
      "07": "Trừ tiền thành công. Giao dịch đang được nghi ngờ",
      "09": "Chưa đăng ký Internet Banking",
      "10": "Xác thực thông tin sai quá 3 lần",
      "11": "Đã hết hạn chờ thanh toán",
      "12": "Thẻ/Tài khoản bị khóa",
      "13": "Sai mật khẩu xác thực giao dịch (OTP)",
      "24": "Khách hàng hủy giao dịch",
      "51": "Tài khoản không đủ số dư",
      "65": "Tài khoản đã vượt quá hạn mức giao dịch",
      "75": "Ngân hàng thanh toán đang bảo trì",
      "79": "Sai mật khẩu thanh toán quá số lần quy định",
    }

    return messages[responseCode] || "Giao dịch thất bại"
  }
}
