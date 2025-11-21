package com.nhom13.paymentservice.controller;

import com.nhom13.paymentservice.model.Payment;
import com.nhom13.paymentservice.service.PaymentService;
import com.nhom13.paymentservice.vnpay.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService paymentService;
    private final VNPayService vnPayService;

    public PaymentController(PaymentService paymentService, VNPayService vnPayService) {
        this.paymentService = paymentService;
        this.vnPayService = vnPayService;
    }

    // ============================================
    // VNPay Payment Endpoints
    // ============================================

    /**
     * Tạo VNPay payment URL
     * Client sẽ redirect user đến URL này để thanh toán
     */
    @PostMapping("/vnpay/create")
    // Remove @PreAuthorize to allow public access (orderId already validated during order creation)
    public ResponseEntity<?> createVNPayPayment(
            @RequestParam Long amount,
            @RequestParam(required = false) Long orderId, // ⭐️ THÊM: orderId tùy chọn
            @RequestParam(required = false, defaultValue = "Order Payment") String orderInfo,
            HttpServletRequest request) {
        try {
            // For public endpoint, use orderId as userId placeholder (will be updated on callback)
            Long userId = orderId != null ? orderId : 0L;
            
            // Tạo payment record với status PENDING
            Payment payment;
            if (orderId != null) {
                payment = paymentService.createPendingPaymentWithOrder(userId, orderId, amount.doubleValue(), "VND");
            } else {
                payment = paymentService.createPendingPayment(userId, amount.doubleValue(), "VND");
            }
            
            // Tạo order ID cho VNPay
            String vnpayOrderId = "PAY-" + payment.getId();
            
            // Lấy IP address
            String ipAddress = getClientIP(request);
            
            // Tạo VNPay payment URL
            String paymentUrl = vnPayService.createPaymentUrl(vnpayOrderId, amount, orderInfo, ipAddress);
            
            // Lưu thông tin provider
            paymentService.setProviderInfo(payment.getId(), "VNPAY", vnpayOrderId);
            
            Map<String, Object> paymentData = new HashMap<>();
            paymentData.put("paymentId", payment.getId());
            paymentData.put("orderId", vnpayOrderId);
            paymentData.put("systemOrderId", orderId);
            paymentData.put("amount", amount);
            paymentData.put("paymentUrl", paymentUrl);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Redirect user to paymentUrl to complete payment");
            response.put("data", paymentData);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("success", "false");
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * VNPay IPN Callback - VNPay gọi endpoint này sau khi thanh toán
     * Public endpoint (không cần auth)
     */
    @GetMapping("/vnpay/callback")
    public ResponseEntity<?> vnpayCallback(@RequestParam Map<String, String> params) {
        try {
            // Validate response từ VNPay
            boolean isValid = vnPayService.validateResponse(params);
            
            if (!isValid) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid signature"
                ));
            }
            
            String orderId = params.get("vnp_TxnRef");
            String responseCode = params.get("vnp_ResponseCode");
            String transactionNo = params.get("vnp_TransactionNo");
            
            // Tìm payment theo provider payment ID
            Payment payment = paymentService.findByProviderPaymentId(orderId);
            
            if (payment == null) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Payment not found"
                ));
            }
            
            // Update status dựa trên response code
            if ("00".equals(responseCode)) {
                paymentService.updateStatus(payment.getId(), "COMPLETED");
                paymentService.setProviderInfo(payment.getId(), "VNPAY", transactionNo);
            } else {
                paymentService.updateStatus(payment.getId(), "FAILED");
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment updated successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * VNPay Return URL - User được redirect về đây sau khi thanh toán
     * Public endpoint (không cần auth)
     */
    @GetMapping("/vnpay/return")
    public ResponseEntity<?> vnpayReturn(@RequestParam Map<String, String> params) {
        try {
            System.out.println("🔔 VNPay Return URL called with params: " + params);
            
            boolean isValid = vnPayService.validateResponse(params);
            
            String orderId = params.get("vnp_TxnRef");
            String responseCode = params.get("vnp_ResponseCode");
            String amount = params.get("vnp_Amount");
            String transactionNo = params.get("vnp_TransactionNo");
            
            System.out.println("📝 Processing payment for order: " + orderId + ", responseCode: " + responseCode);
            
            // ⭐️ THÊM: Update payment status giống như callback
            Payment payment = paymentService.findByProviderPaymentId(orderId);
            if (payment != null) {
                System.out.println("💳 Found payment ID: " + payment.getId() + " for order: " + orderId);
                if ("00".equals(responseCode) && isValid) {
                    System.out.println("✅ Payment successful! Updating to COMPLETED...");
                    paymentService.updateStatus(payment.getId(), "COMPLETED");
                    if (transactionNo != null) {
                        paymentService.setProviderInfo(payment.getId(), "VNPAY", transactionNo);
                    }
                    System.out.println("✅ Payment updated. Order should auto-confirm now.");
                } else {
                    System.out.println("❌ Payment failed! ResponseCode: " + responseCode + ", Valid: " + isValid);
                    paymentService.updateStatus(payment.getId(), "FAILED");
                }
            } else {
                System.out.println("⚠️ Payment not found for orderId: " + orderId);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", "00".equals(responseCode) && isValid);
            response.put("orderId", orderId);
            response.put("responseCode", responseCode);
            response.put("amount", Long.parseLong(amount) / 100); // VNPay trả về amount * 100
            response.put("message", getResponseMessage(responseCode));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Query payment status từ VNPay
     */
    @GetMapping("/vnpay/query/{orderId}")
    @PreAuthorize("hasAnyRole('USER','RESTAURANT','ADMIN')")
    public ResponseEntity<?> queryVNPayPayment(
            @PathVariable String orderId,
            @RequestParam String transDate) {
        try {
            Map<String, String> result = vnPayService.queryPayment(orderId, transDate);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // ============================================
    // User Payment Management
    // ============================================

    /**
     * Lấy danh sách payments của user hiện tại
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER','RESTAURANT','ADMIN')")
    public ResponseEntity<List<Payment>> myPayments(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        List<Payment> payments = paymentService.findByUserId(userId);
        return ResponseEntity.ok(payments);
    }

    /**
     * Lấy chi tiết một payment
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','RESTAURANT','ADMIN')")
    public ResponseEntity<?> getPayment(@PathVariable Long id, Authentication authentication) {
        Payment payment = paymentService.findById(id);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }

        Long userId = Long.parseLong(authentication.getName());
        // Nếu không phải admin, kiểm tra ownership
        if (!authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            if (!payment.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
        }
        return ResponseEntity.ok(payment);
    }

    // ============================================
    // Admin Endpoints
    // ============================================

    /**
     * Admin - Lấy tất cả payments
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Payment>> allPayments() {
        return ResponseEntity.ok(paymentService.findAll());
    }

    // ============================================
    // Helper Methods
    // ============================================

    private String getClientIP(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress;
    }

    private String getResponseMessage(String responseCode) {
        return switch (responseCode) {
            case "00" -> "Giao dịch thành công";
            case "07" -> "Trừ tiền thành công. Giao dịch đang được nghi ngờ";
            case "09" -> "Chưa đăng ký Internet Banking";
            case "10" -> "Xác thực thông tin sai quá 3 lần";
            case "11" -> "Đã hết hạn chờ thanh toán";
            case "12" -> "Thẻ/Tài khoản bị khóa";
            case "13" -> "Sai mật khẩu xác thực giao dịch (OTP)";
            case "24" -> "Khách hàng hủy giao dịch";
            case "51" -> "Tài khoản không đủ số dư";
            case "65" -> "Tài khoản đã vượt quá hạn mức giao dịch";
            case "75" -> "Ngân hàng thanh toán đang bảo trì";
            case "79" -> "Sai mật khẩu thanh toán quá số lần quy định";
            default -> "Giao dịch thất bại";
        };
    }
}
