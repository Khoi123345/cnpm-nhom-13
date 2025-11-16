# VNPay Payment Integration Guide

## 🏦 VNPay là gì?

VNPay là cổng thanh toán trực tuyến hàng đầu Việt Nam, hỗ trợ:
- Thẻ ATM nội địa
- Thẻ tín dụng quốc tế (Visa, MasterCard, JCB)
- Ví điện tử VNPay
- QR Code

---

## 🚀 Quick Start

### 1. Đăng ký tài khoản VNPay

1. Truy cập: https://sandbox.vnpayment.vn/
2. Đăng ký tài khoản Merchant (Test)
3. Lấy thông tin:
   - **TMN Code**: Mã định danh merchant
   - **Hash Secret**: Secret key để mã hóa

### 2. Cấu hình trong application.properties

```properties
# VNPay Sandbox Configuration
vnpay.url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.returnUrl=http://localhost:8085/api/payments/vnpay/return
vnpay.tmnCode=YOUR_TMN_CODE
vnpay.hashSecret=YOUR_HASH_SECRET
vnpay.apiUrl=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
```

### 3. Production Configuration

```properties
# VNPay Production
vnpay.url=https://vnpayment.vn/paymentv2/vpcpay.html
vnpay.apiUrl=https://vnpayment.vn/merchant_webapi/api/transaction
```

---

## 📡 API Endpoints

### 1. Tạo Payment URL

**Endpoint:** `POST /api/payments/vnpay/create`

**Headers:**
```
X-User-Id: 1
X-User-Role: ROLE_USER
```

**Parameters:**
- `amount` (required): Số tiền thanh toán (VNĐ)
- `orderInfo` (optional): Thông tin đơn hàng

**Example:**
```bash
curl -X POST "http://localhost:8085/api/payments/vnpay/create?amount=100000&orderInfo=Thanh%20toan%20don%20hang%20123" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": 1,
    "userId": 1,
    "amount": 100000.0,
    "currency": "VND",
    "status": "PENDING",
    "provider": "VNPAY",
    "providerPaymentId": "PAY-1"
  },
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
  "message": "Redirect user to paymentUrl to complete payment"
}
```

### 2. VNPay Callback (IPN)

**Endpoint:** `GET /api/payments/vnpay/callback` (Public - No Auth)

VNPay tự động gọi endpoint này sau khi thanh toán.

**Parameters từ VNPay:**
- `vnp_TxnRef`: Order ID
- `vnp_ResponseCode`: Mã kết quả (00 = thành công)
- `vnp_TransactionNo`: Mã giao dịch VNPay
- `vnp_Amount`: Số tiền
- `vnp_SecureHash`: Chữ ký bảo mật

### 3. Return URL

**Endpoint:** `GET /api/payments/vnpay/return` (Public)

Trang người dùng được redirect về sau khi thanh toán.

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment successful",
  "orderId": "PAY-1",
  "transactionId": "14012345",
  "amount": 100000
}
```

### 4. Query Payment Status

**Endpoint:** `GET /api/payments/vnpay/query/{orderId}`

**Parameters:**
- `transDate`: Ngày giao dịch (yyyyMMddHHmmss)

**Example:**
```bash
curl "http://localhost:8085/api/payments/vnpay/query/PAY-1?transDate=20241113120000" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

---

## 🔄 Payment Flow

```
┌─────────┐         ┌──────────────┐         ┌──────────┐
│ Client  │         │ Payment API  │         │  VNPay   │
└────┬────┘         └──────┬───────┘         └────┬─────┘
     │                     │                      │
     │ 1. Create Payment   │                      │
     ├────────────────────>│                      │
     │                     │                      │
     │ 2. Payment URL      │                      │
     │<────────────────────┤                      │
     │                     │                      │
     │ 3. Redirect         │                      │
     ├─────────────────────┼─────────────────────>│
     │                     │                      │
     │ 4. User pays        │                      │
     │                     │                      │
     │                     │ 5. IPN Callback      │
     │                     │<─────────────────────┤
     │                     │                      │
     │                     │ 6. Update Status     │
     │                     │                      │
     │ 7. Redirect back    │                      │
     │<────────────────────┼──────────────────────┤
     │                     │                      │
```

**Chi tiết:**

1. **Client tạo payment request** → Backend tạo payment record (status=PENDING)
2. **Backend trả về VNPay URL** → URL chứa các tham số đã mã hóa
3. **Client redirect user** → Người dùng vào trang VNPay
4. **User thanh toán** → Nhập thông tin thẻ/ví
5. **VNPay gọi IPN callback** → Backend cập nhật status (COMPLETED/FAILED)
6. **Backend update database** → Lưu transaction ID
7. **VNPay redirect user** → Về trang return URL

---

## 🔐 Security

### Hash Signature

VNPay sử dụng HMAC SHA512 để ký các request/response:

```java
// Create signature
String hashData = "vnp_Amount=10000000&vnp_Command=pay&...";
String signature = hmacSHA512(hashSecret, hashData);
```

### Validate Response

```java
boolean isValid = vnPayService.validateResponse(params);
if (!isValid) {
    // Invalid signature - reject
}
```

---

## 💳 Test Cards (Sandbox)

### Thẻ ATM nội địa
```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mật khẩu OTP: 123456
```

### Thẻ quốc tế
```
Card Number: 4000000000000002 (Visa)
Expiry: 12/25
CVV: 123
```

---

## 🧪 Testing Locally

### 1. Start Payment Service

```bash
cd services/payment-service
mvn spring-boot:run
```

### 2. Create Payment

```bash
curl -X POST "http://localhost:8085/api/payments/vnpay/create?amount=100000" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

### 3. Copy paymentUrl từ response và mở trong browser

### 4. Thanh toán với test card

---

## 🌐 Production Deployment

### Environment Variables

```bash
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/api/payments/vnpay/return
VNPAY_TMN_CODE=YOUR_PRODUCTION_TMN_CODE
VNPAY_HASH_SECRET=YOUR_PRODUCTION_HASH_SECRET
VNPAY_API_URL=https://vnpayment.vn/merchant_webapi/api/transaction
```

### Docker Compose

```yaml
payment-service:
  environment:
    - VNPAY_URL=${VNPAY_URL}
    - VNPAY_RETURN_URL=${VNPAY_RETURN_URL}
    - VNPAY_TMN_CODE=${VNPAY_TMN_CODE}
    - VNPAY_HASH_SECRET=${VNPAY_HASH_SECRET}
```

### IMPORTANT: IPN URL

VNPay callback URL **PHẢI** là public URL (không phải localhost).

**Giải pháp cho development:**
1. Sử dụng **ngrok**: `ngrok http 8085`
2. Cấu hình callback URL: `https://your-ngrok-id.ngrok.io/api/payments/vnpay/callback`

---

## 📊 VNPay Response Codes

| Code | Meaning |
|------|---------|
| 00 | Giao dịch thành công |
| 07 | Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường). |
| 09 | Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng. |
| 10 | Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần |
| 11 | Giao dịch không thành công do: Đã hết hạn chờ thanh toán. |
| 12 | Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa. |
| 13 | Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). |
| 24 | Giao dịch không thành công do: Khách hàng hủy giao dịch |
| 51 | Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch. |
| 65 | Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày. |
| 75 | Ngân hàng thanh toán đang bảo trì. |
| 79 | Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. |
| 99 | Các lỗi khác |

---

## 🔧 Troubleshooting

### Lỗi: Invalid Signature
```
→ Kiểm tra hashSecret có đúng không
→ Kiểm tra thứ tự sắp xếp parameters
→ Kiểm tra encoding (UTF-8)
```

### Lỗi: Payment not found
```
→ Kiểm tra orderId/vnp_TxnRef có khớp không
→ Kiểm tra payment đã được tạo trong DB chưa
```

### IPN không được gọi
```
→ Kiểm tra URL có public không (không dùng localhost)
→ Kiểm tra firewall
→ Sử dụng ngrok cho development
```

---

## 📝 Notes

- VNPay sandbox có thể không gọi IPN, chỉ production mới chắc chắn
- Thời gian hết hạn thanh toán: 15 phút (có thể config)
- Amount phải nhân 100 khi gửi lên VNPay (VNPay tính bằng đồng, không có xu)
- Return URL và IPN URL có thể giống hoặc khác nhau

---

## 🔗 Resources

- VNPay Sandbox: https://sandbox.vnpayment.vn/
- VNPay Documentation: https://sandbox.vnpayment.vn/apis/docs/
- Support: support@vnpay.vn

---

## ✅ Checklist Integration

- [ ] Đăng ký tài khoản VNPay sandbox
- [ ] Lấy TMN Code và Hash Secret
- [ ] Cấu hình trong application.properties
- [ ] Test tạo payment URL
- [ ] Test thanh toán với test card
- [ ] Kiểm tra callback được gọi
- [ ] Kiểm tra payment status được update
- [ ] Setup ngrok cho local development
- [ ] Cấu hình production environment variables
- [ ] Test end-to-end flow

---

**VNPay Integration hoàn tất! 🎉**
