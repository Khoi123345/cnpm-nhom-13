# 🎯 Payment Service - VNPay Integration Summary

## ✅ Những gì đã được implement

### 1. **VNPay Service** (`VNPayService.java`)
- ✅ Tạo payment URL với HMAC SHA512 signature
- ✅ Validate response từ VNPay callback
- ✅ Query payment status
- ✅ Xử lý các parameters theo chuẩn VNPay

### 2. **Payment Controller** - VNPay Endpoints
- ✅ `POST /api/payments/vnpay/create` - Tạo payment URL
- ✅ `GET /api/payments/vnpay/callback` - IPN callback từ VNPay
- ✅ `GET /api/payments/vnpay/return` - Return URL sau thanh toán
- ✅ `GET /api/payments/vnpay/query/{orderId}` - Query trạng thái

### 3. **Security Configuration**
- ✅ Cho phép VNPay callback endpoints (public)
- ✅ Giữ nguyên Momo endpoints (legacy)

### 4. **Configuration**
- ✅ VNPay properties trong `application.properties`
- ✅ Support environment variables

### 5. **Documentation**
- ✅ `VNPAY_GUIDE.md` - Hướng dẫn chi tiết
- ✅ `test-vnpay.bat` - Script test

---

## 🚀 Cách sử dụng

### Bước 1: Cấu hình VNPay

Sửa file `application.properties`:

```properties
vnpay.tmnCode=YOUR_TMN_CODE
vnpay.hashSecret=YOUR_HASH_SECRET
```

**Lấy credentials:**
1. Đăng ký tại: https://sandbox.vnpayment.vn/
2. Copy TMN Code và Hash Secret

### Bước 2: Build & Run

```bash
cd services/payment-service
mvn clean package
mvn spring-boot:run
```

### Bước 3: Test Payment

```bash
# Chạy test script
test-vnpay.bat

# Hoặc manual:
curl -X POST "http://localhost:8085/api/payments/vnpay/create?amount=100000" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

### Bước 4: Complete Payment

1. Copy `paymentUrl` từ response
2. Mở trong browser
3. Thanh toán với test card:
   ```
   Card: 9704198526191432198
   Holder: NGUYEN VAN A
   Date: 07/15
   OTP: 123456
   ```

---

## 📡 API Examples

### 1. Tạo Payment

```bash
curl -X POST "http://localhost:8085/api/payments/vnpay/create?amount=100000&orderInfo=Don hang 123" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": 1,
    "status": "PENDING"
  },
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&..."
}
```

### 2. Query Payment

```bash
curl "http://localhost:8085/api/payments/vnpay/query/PAY-1?transDate=20241113120000" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

### 3. Get My Payments

```bash
curl "http://localhost:8085/api/payments/me" \
  -H "X-User-Id: 1" \
  -H "X-User-Role: ROLE_USER"
```

---

## 🔄 Payment Flow

```
Frontend → POST /vnpay/create → Backend
           ↓
        Payment URL
           ↓
    User → VNPay Website
           ↓
       Pay with card
           ↓
VNPay → GET /vnpay/callback → Backend (update status)
           ↓
    User → GET /vnpay/return → Show result
```

---

## 🔐 Security Features

1. **HMAC SHA512 Signature** - Mọi request/response được ký
2. **Request Validation** - Validate signature trước khi xử lý
3. **15 Minutes Expiry** - Payment URL hết hạn sau 15 phút
4. **IP Tracking** - Lưu IP của người tạo payment

---

## 🧪 Testing

### Local Testing

```bash
# Start service
mvn spring-boot:run

# Run test
test-vnpay.bat
```

### Production Testing

Sử dụng **ngrok** để expose local server:

```bash
ngrok http 8085
```

Cập nhật callback URL:
```properties
vnpay.returnUrl=https://your-id.ngrok.io/api/payments/vnpay/return
```

---

## 📊 VNPay Response Codes

| Code | Ý nghĩa |
|------|---------|
| 00 | Thành công ✅ |
| 07 | Trừ tiền thành công nhưng giao dịch nghi ngờ ⚠️ |
| 09 | Chưa đăng ký Internet Banking ❌ |
| 11 | Hết hạn thanh toán ⏰ |
| 24 | Người dùng hủy ❌ |
| 51 | Không đủ số dư 💰 |
| 99 | Lỗi khác ❌ |

---

## 🔧 Integration với Frontend

### React/Next.js Example

```typescript
// Tạo payment
const response = await fetch('/api/payments/vnpay/create?amount=100000', {
  method: 'POST',
  headers: {
    'X-User-Id': userId,
    'X-User-Role': 'ROLE_USER'
  }
});

const data = await response.json();

// Redirect đến VNPay
if (data.success) {
  window.location.href = data.paymentUrl;
}
```

### Return Page

```typescript
// Parse URL params
const params = new URLSearchParams(window.location.search);
const responseCode = params.get('vnp_ResponseCode');

if (responseCode === '00') {
  showSuccess('Thanh toán thành công!');
} else {
  showError('Thanh toán thất bại!');
}
```

---

## 🐛 Troubleshooting

### Lỗi: Invalid Signature
```
→ Kiểm tra hashSecret
→ Kiểm tra encoding UTF-8
→ Kiểm tra thứ tự parameters
```

### IPN không được gọi
```
→ Sử dụng ngrok
→ Kiểm tra firewall
→ VNPay sandbox có thể không call IPN
```

### Payment không được tạo
```
→ Kiểm tra database connection
→ Xem logs: mvn spring-boot:run
→ Kiểm tra authentication headers
```

---

## 📝 Files Created

```
services/payment-service/
├── src/main/java/.../vnpay/
│   └── VNPayService.java              ← VNPay integration
├── src/main/java/.../controller/
│   └── PaymentController.java         ← Updated với VNPay endpoints
├── src/main/resources/
│   └── application.properties         ← VNPay config
├── VNPAY_GUIDE.md                     ← Detailed guide
└── test-vnpay.bat                     ← Test script
```

---

## ✅ Checklist

- [x] VNPayService implementation
- [x] Payment endpoints (create, callback, return, query)
- [x] Security configuration
- [x] HMAC SHA512 signature
- [x] Response validation
- [x] Test script
- [x] Documentation
- [ ] Configure real VNPay credentials
- [ ] Setup ngrok for local testing
- [ ] Test with real card
- [ ] Frontend integration

---

## 🔗 Next Steps

1. **Đăng ký VNPay:**
   - Tạo tài khoản tại https://sandbox.vnpayment.vn/
   - Lấy TMN Code và Hash Secret

2. **Test Local:**
   - Chạy `test-vnpay.bat`
   - Test với VNPay test card

3. **Frontend Integration:**
   - Tích hợp vào checkout flow
   - Handle return URL
   - Show payment status

4. **Production:**
   - Đăng ký VNPay production account
   - Cấu hình production credentials
   - Deploy với HTTPS
   - Monitor transactions

---

**VNPay Integration hoàn tất! 🎉**

Để test ngay: `cd services/payment-service && test-vnpay.bat`
