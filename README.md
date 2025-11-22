# 🍔 FoodFast - Drone Delivery System

Hệ thống đặt đồ ăn trực tuyến với giao hàng bằng drone, được xây dựng trên kiến trúc **Microservices**.

---

## 🧾 Thông Tin Chung

- **🎓 Tên đề tài:** Fast Food Delivery By Drone  
- **👨‍💻 Thành viên nhóm:**  
  - Hồ Quốc Khôi – 3122411099  
  - Lê Duy Huy – 3122411064  
- **👨‍🏫 Giảng viên hướng dẫn:** Nguyễn Quốc Huy  
- **📌 Trạng thái dự án:** ✅ Hoàn thành (Sẵn sàng để demo!)

---

## 🛠️ Tech Stack

| Thành phần | Công nghệ | Mô tả |
|-----------|-----------|-------|
| **Frontend** | Next.js, React, TypeScript | Giao diện web cho Customer / Restaurant / Admin |
| **User Service** | Node.js, Express | Quản lý người dùng & xác thực |
| **Product Service** | Node.js, Express | Quản lý cửa hàng & món ăn |
| **Order Service** | Java 17, Spring Boot | Xử lý đơn hàng và trạng thái |
| **Payment Service** | Java 17, Spring Boot | Thanh toán VNPay |
| **Drone Service** | Java17, Spring Boot | Quản lý drone đi giao hàng |
| **Databases** | PostgreSQL, MongoDB | PostgreSQL: User & Order; MongoDB: Product |
| **Gateway** | Nginx | API Gateway |
| **DevOps** | Docker, Docker Compose | Container hóa và điều phối các service, tạo môi trường (local) để giao tiếp |

---

## 📂 Cấu Trúc Repository

```
foodfast-delivery/
├── api-gateway/
│   └── nginx.conf
├── frontend/
├── services/
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   ├── payment-service/
|   └── drone-service/
├── docker-compose.yml
├── PRD_FoodFastDelivery.docx
└── README.md
```

---

## 🚀 Quick Start

### 1️⃣ Yêu cầu
- Docker  
- Docker Compose  

---

### 2️⃣ Cấu hình môi trường

#### **Node.js Services (User & Product)**  
Tạo file `.env` trong từng service:

```env
PORT=xxxx
DATABASE_URL=xxxx
JWT_SECRET=xxxx
```

#### **Spring Boot Services (Order & Payment)**  
Cấu hình trong:

```
src/main/resources/application.yml
```

**Cấu hình VNPay trong Payment Service:**

```yaml
vnpay:
  tmnCode: YOUR_TMN_CODE
  hashSecret: YOUR_HASH_SECRET
  url: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

---

### 3️⃣ Khởi chạy hệ thống

```bash
docker-compose up -d --build
```

---

### 4️⃣ Truy cập ứng dụng

- 🌐 Frontend: [http://localhost:3000 ](http://ec2-52-195-195-198.ap-northeast-1.compute.amazonaws.com:3000/) 
- 🚪 API Gateway: [http://localhost:8080  ](http://ec2-52-195-195-198.ap-northeast-1.compute.amazonaws.com:8080/)

---

## 🎯 Flow Hoạt Động Chính

### **1. Khách hàng đặt hàng**
Trang chủ → Chọn cửa hàng → Chọn món → Giỏ hàng → Thanh toán (VNPay / COD)

### **2. Nhà hàng xử lý**
Dashboard → Nhận đơn → Chuẩn bị món → Giao cho drone

### **3. Drone giao hàng**
Drone Service → Gán drone → Drone cất cánh → Theo dõi GPS → Giao thành công

---

## 🔄 Order Status Flow

```
PENDING
→ PAID / WAITING_FOR_DELIVERY
→ PREPARING
→ READY_FOR_DELIVERY
→ IN_DELIVERY
→ DELIVERED
```

---

## 🌟 Tính Năng

### 👤 Khách hàng
- Đăng ký / Đăng nhập  
- Quản lý hồ sơ & địa chỉ  
- Xem cửa hàng / món ăn  
- Giỏ hàng & đặt hàng  
- Thanh toán VNPay hoặc COD  
- Theo dõi drone realtime  

### 🍽️ Cửa hàng
- Quản lý menu  
- Quản lý kho  
- Nhận & xử lý đơn hàng  
- Chỉ định drone giao hàng  
- Theo dõi tiến trình drone  
- Quản lý đội drone  

### 🛠️ Admin
- Dashboard toàn hệ thống  
- Quản lý người dùng  
- Quản lý nhà hàng  
- Drone overview  
- Logs hệ thống  
- Báo cáo & thống kê  

---

## 🧪 Testing

### 🧾 VNPay Sandbox

| Trường | Giá trị |
|--------|---------|
| Bank | NCB |
| Card | 9704198526191432198 |
| Name | NGUYEN VAN A |
| Date | 07/15 |
| OTP | 123456 |

---

## 📝 Configuration

### **Node.js Services**
- Cần `.env`  
- Bao gồm: PORT, DATABASE_URL, JWT_SECRET  

### **Spring Boot Services**
- Cần file `application.yml`  
- Payment Service cần cấu hình VNPay:

```yaml
vnpay:
  tmnCode: YOUR_TMN_CODE
  hashSecret: YOUR_HASH_SECRET
  url: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

---

## 📧 Liên hệ

**FoodFast Drone Delivery – CNPM HKI 4 – 2025**

---

