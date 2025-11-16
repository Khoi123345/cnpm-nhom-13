# 🎯 VNPay Payment Integration - Quick Reference

## ✅ Trạng thái: ĐÃ HOÀN CHỈNH

### 📌 Credentials đã cấu hình:
```properties
vnpay.tmnCode=0LJWVZP7
vnpay.hashSecret=5SDVJZTMOJMFFTJ4LSM08Q34TTM65J4M
```

---

## 🚀 TEST NHANH

### 1️⃣ Start Payment Service

```bash
cd services/payment-service
mvn spring-boot:run
```

### 2️⃣ Tạo Payment URL

```bash
curl -X POST "http://localhost:8085/api/payments/vnpay/create?amount=100000&orderInfo=Test Payment" \
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
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&...",
  "message": "Redirect user to paymentUrl to complete payment"
}
```

### 3️⃣ Copy paymentUrl và mở trong browser

### 4️⃣ Thanh toán với Test Card

```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mật khẩu OTP: 123456
```

---

## 📡 VNPay API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/vnpay/create` | Tạo payment URL | ✅ Required |
| GET | `/api/payments/vnpay/callback` | VNPay IPN callback | 🔓 Public |
| GET | `/api/payments/vnpay/return` | Return URL sau thanh toán | 🔓 Public |
| GET | `/api/payments/vnpay/query/{orderId}` | Query payment status | ✅ Required |
| GET | `/api/payments/me` | Xem payments của mình | ✅ Required |
| GET | `/api/payments/admin/all` | Xem tất cả (Admin) | 👑 Admin |

---

## 🔄 Payment Flow

```
┌──────────┐    1. Create Payment     ┌─────────────┐
│ Frontend │ ─────────────────────────>│   Backend   │
└──────────┘                           └─────────────┘
     │                                        │
     │        2. Return paymentUrl            │
     │ <──────────────────────────────────────┤
     │                                        │
     │        3. Redirect to VNPay            │
     ├───────────────────────────────────────>│
     │                                   ┌────▼─────┐
     │        4. User pays               │  VNPay   │
     ├──────────────────────────────────>│  Gateway │
     │                                   └────┬─────┘
     │                                        │
     │                             5. Callback (IPN)
     │                                   Backend◄────┘
     │                              (Update to COMPLETED)
     │        6. Redirect Return              │
     │ <──────────────────────────────────────┤
     │      Show payment result               │
```

---

## 🧪 Test Commands

### Test 1: Tạo payment (100,000 VNĐ)
```bash
curl -X POST "http://localhost:8085/api/payments/vnpay/create?amount=100000&orderInfo=Don hang 123" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

### Test 2: Tạo payment (500,000 VNĐ)
```bash
curl -X POST "http://localhost:8085/api/payments/vnpay/create?amount=500000&orderInfo=Order ABC" \
  -H "X-User-Id: 2" \
  -H "X-User-Role: ROLE_USER"
```

### Test 3: Xem payments của user
```bash
curl "http://localhost:8085/api/payments/me" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

### Test 4: Admin xem tất cả payments
```bash
curl "http://localhost:8085/api/payments/admin/all" \
  -H "X-User-Id: 999" \
  -H "X-User-Role: ROLE_ADMIN"
```

### Test 5: Query payment status
```bash
curl "http://localhost:8085/api/payments/vnpay/query/PAY-1?transDate=20241113120000" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

---

## 💳 VNPay Test Cards

### NCB Bank (Recommended)
```
Card Number: 9704198526191432198
Card Holder: NGUYEN VAN A
Issue Date: 07/15
OTP: 123456
```

### International Card (Visa)
```
Card Number: 4000000000000002
Expiry: 12/25
CVV: 123
```

---

## 📊 VNPay Response Codes

| Code | Meaning | Status |
|------|---------|--------|
| 00 | Giao dịch thành công | ✅ SUCCESS |
| 07 | Trừ tiền thành công, giao dịch nghi ngờ | ⚠️ WARNING |
| 09 | Chưa đăng ký Internet Banking | ❌ FAILED |
| 10 | Xác thực sai quá 3 lần | ❌ FAILED |
| 11 | Đã hết hạn chờ thanh toán (15 phút) | ⏰ EXPIRED |
| 12 | Thẻ/Tài khoản bị khóa | 🔒 LOCKED |
| 13 | Sai OTP | ❌ FAILED |
| 24 | Khách hàng hủy giao dịch | ❌ CANCELLED |
| 51 | Không đủ số dư | 💰 INSUFFICIENT |
| 65 | Vượt hạn mức giao dịch | 📊 LIMIT_EXCEEDED |
| 75 | Ngân hàng bảo trì | 🔧 MAINTENANCE |
| 79 | Sai mật khẩu quá số lần | ❌ FAILED |

---

## 🔐 Security

### HMAC SHA512 Signature
- Mọi request/response đều được ký với HMAC SHA512
- Hash Secret: `5SDVJZTMOJMFFTJ4LSM08Q34TTM65J4M`
- Validate signature trước khi xử lý callback

### Payment Expiry
- Mỗi payment URL hết hạn sau **15 phút**
- Sau 15 phút user phải tạo payment mới

---

## 📂 File Structure

```
payment-service/
├── src/main/java/.../vnpay/
│   └── VNPayService.java              ✅ VNPay integration
├── src/main/java/.../controller/
│   └── PaymentController.java         ✅ VNPay endpoints
├── src/main/java/.../config/
│   └── SecurityConfig.java            ✅ Public callbacks
└── src/main/resources/
    └── application.properties         ✅ VNPay credentials
```

---

## 🌐 Frontend Integration Example

### JavaScript/React
```javascript
// 1. Tạo payment
const createPayment = async (amount) => {
  const response = await fetch(
    `http://localhost:8085/api/payments/vnpay/create?amount=${amount}`,
    {
      method: 'POST',
      headers: {
        'X-User-Id': '1',
        'X-User-Role': 'ROLE_USER'
      }
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    // 2. Redirect đến VNPay
    window.location.href = data.paymentUrl;
  }
};

// 3. Handle return page
const urlParams = new URLSearchParams(window.location.search);
const responseCode = urlParams.get('vnp_ResponseCode');

if (responseCode === '00') {
  alert('Thanh toán thành công!');
} else {
  alert('Thanh toán thất bại!');
}
```

---

## 🔧 Environment Variables (Production)

```bash
# VNPay Production
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/api/payments/vnpay/return
VNPAY_TMN_CODE=YOUR_PRODUCTION_TMN_CODE
VNPAY_HASH_SECRET=YOUR_PRODUCTION_HASH_SECRET
VNPAY_API_URL=https://vnpayment.vn/merchant_webapi/api/transaction
```

---

## 🐛 Common Issues

### 1. Invalid Signature
```
Nguyên nhân: hashSecret sai hoặc params không đúng thứ tự
Giải pháp: Kiểm tra lại hashSecret trong application.properties
```

### 2. Payment URL không hoạt động
```
Nguyên nhân: URL encoding sai hoặc params thiếu
Giải pháp: Log ra paymentUrl để kiểm tra
```

### 3. Callback không được gọi
```
Nguyên nhân: URL không public (localhost)
Giải pháp: Sử dụng ngrok cho development
  ngrok http 8085
  Cập nhật vnpay.returnUrl với ngrok URL
```

---

## ✅ Checklist

- [x] VNPayService implementation
- [x] Payment endpoints (create, callback, return, query)
- [x] Security configuration (public callbacks)
- [x] Credentials configured (TMN Code, Hash Secret)
- [x] Test card information
- [x] Documentation
- [ ] Test end-to-end payment flow
- [ ] Frontend integration
- [ ] Production deployment

---

## 📚 Resources

- **VNPay Sandbox:** https://sandbox.vnpayment.vn/
- **VNPay API Docs:** https://sandbox.vnpayment.vn/apis/docs/
- **Support:** support@vnpay.vn

---

## 🎉 Quick Start Commands

```bash
# 1. Start service
cd services/payment-service
mvn spring-boot:run

# 2. Test payment (in another terminal)
curl -X POST "http://localhost:8085/api/payments/vnpay/create?amount=100000" \
  -H "X-User-Id: 1" -H "X-User-Role: ROLE_USER"

# 3. Copy paymentUrl và test trong browser

# 4. Xem kết quả
curl "http://localhost:8085/api/payments/me" \
  -H "X-User-Id: 1" -H "X-User-Role: ROLE_USER"
```

---

**VNPay Integration đã sẵn sàng! 🚀**

Test ngay: Chạy service và tạo payment với curl command ở trên!
