"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PaymentService } from "@/lib/payment-service"
import { useCartContext } from "@/hooks/cart-provider"

function PaymentReturnContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart } = useCartContext()
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean
    orderId: string
    responseCode: string
    amount: number
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        // 1. Parse VNPay callback parameters
        const result = PaymentService.parseVNPayCallback(searchParams)
        
        // 2. Call backend to process payment return (this will update order status)
        const params = new URLSearchParams()
        searchParams.forEach((value, key) => {
          params.append(key, value)
        })
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/payments/vnpay/return?${params.toString()}`)
        const backendResult = await response.json()
        
        console.log('Backend payment result:', backendResult)
        
        setPaymentResult(result)
        setLoading(false)

        // 3. Nếu thanh toán thành công, xóa giỏ hàng và pending order ID
        if (result.success) {
          clearCart()
          localStorage.removeItem("pending_order_id")
        }
      } catch (error) {
        console.error('Error processing payment return:', error)
        // Still show result to user even if backend call fails
        const result = PaymentService.parseVNPayCallback(searchParams)
        setPaymentResult(result)
        setLoading(false)
      }
    }

    processPaymentReturn()
  }, [searchParams, clearCart])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Processing payment result...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-8 text-center">
          {paymentResult?.success ? (
            <>
              {/* Success */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
              <p className="text-foreground/70 mb-6">
                Your payment has been processed successfully.
              </p>
              
              <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-foreground/70">Transaction ID:</div>
                  <div className="font-medium">{paymentResult.orderId}</div>
                  
                  <div className="text-foreground/70">Amount Paid:</div>
                  <div className="font-medium">{paymentResult.amount.toLocaleString()} VND</div>
                  
                  <div className="text-foreground/70">Status:</div>
                  <div className="font-medium text-green-600">Completed</div>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/customer/orders" className="block">
                  <Button className="w-full">View My Orders</Button>
                </Link>
                <Link href="/customer/dashboard" className="block">
                  <Button variant="outline" className="w-full">Back to Dashboard</Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Failed */}
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h1>
              <p className="text-foreground/70 mb-2">
                {paymentResult?.message || "Your payment could not be processed."}
              </p>
              <p className="text-sm text-foreground/60 mb-6">
                Response Code: {paymentResult?.responseCode}
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Your order has been created but payment was not completed. 
                  You can try paying again or contact support.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/customer/checkout" className="block">
                  <Button className="w-full">Try Again</Button>
                </Link>
                <Link href="/customer/orders" className="block">
                  <Button variant="outline" className="w-full">View My Orders</Button>
                </Link>
              </div>
            </>
          )}
        </Card>

        {/* VNPay Branding */}
        <div className="text-center mt-6 text-sm text-foreground/60">
          <p>Payment processed by VNPay</p>
          <p className="text-xs mt-1">🔒 Secured transaction</p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentReturnContent />
    </Suspense>
  )
}
