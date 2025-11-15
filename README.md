# 🍔 FoodFast - Drone Delivery System

Hệ thống đặt đồ ăn trực tuyến với giao hàng bằng drone, được xây dựng trên kiến trúc Microservices.

## 🚀 Trạng Thái Dự Án

✅ **Hoàn thành** (Sẵn sàng để demo!)

-   Backend APIs (Microservices): Hoàn thành
-   Frontend UI (Next.js): Hoàn thành
-   Quản lý Cửa hàng: Hoàn thành
-   Quản lý Drone: Hoàn thành
-   Tích hợp Thanh toán (VNPay): Hoàn thành
-   [cite_start]Tài liệu (PRD): Cập nhật [cite: 1]

---

## 🛠️ Tech Stack (Công nghệ sử dụng)

Dự án này sử dụng kiến trúc Microservices được quản lý qua Docker Compose.

| Thành phần | Công nghệ | Mục đích |
| :--- | :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/) | Giao diện người dùng (Khách hàng, Nhà hàng, Admin) |
| **Backend** | | |
| 🔹 **User Service** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/) | Quản lý xác thực và thông tin người dùng |
| 🔹 **Product Service** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/) | [cite_start]Quản lý nhà hàng và sản phẩm (món ăn) [cite: 40] |
| 🔹 **Order Service** | [Java 17](https://www.oracle.com/java/), [Spring Boot](https://spring.io/projects/spring-boot) | [cite_start]Xử lý logic đặt hàng và trạng thái đơn hàng [cite: 41] |
| 🔹 **Payment Service** | [Java 17](https://www.oracle.com/java/), [Spring Boot](https://spring.io/projects/spring-boot) | [cite_start]Xử lý thanh toán qua VNPay [cite: 42] |
| 🔹 **Drone Service** | (Đang phát triển) | [cite_start]Điều phối và theo dõi drone (theo PRD [cite: 43]) |
| **Databases** | [PostgreSQL](https://www.postgresql.org/), [MongoDB](https://www.mongodb.com/) | PostgreSQL cho dữ liệu giao dịch (User, Order); [cite_start]MongoDB cho dữ liệu sản phẩm (Product) [cite: 44] |
| **Gateway** | [Nginx](https://www.nginx.com/) | [cite_start]API Gateway, điều hướng request đến các microservices [cite: 37] |
| **DevOps** | [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/) | Container hóa và điều phối toàn bộ hệ thống |

---

## 🗂️ Kiến Trúc Hệ Thống

Hệ thống bao gồm 3 Client App (Customer, Restaurant, Admin) giao tiếp với các Microservices ở backend thông qua một API Gateway (Nginx). Dữ liệu được phân chia vào 2 cơ sở dữ liệu là PostgreSQL và MongoDB.

[cite_start]*(Hình ảnh dựa trên sơ đồ "Solution Alignment" [cite: 31] và "Deployment Diagram"  trong PRD)*

[Client] [Client] [Client] Web Customer Web Restaurant Web Admin (Next.js) (Next.js) (Next.js) | | | +--------------+----------------+ | [API Gateway] (Nginx) | +---------------+---------------+ | | | [Service] [Service] [Service] User Product Order (Node.js) (Node.js) (Spring Boot) | | | [Database] [Database] [Database] (PostgreSQL) (MongoDB) (PostgreSQL)


---

## 📂 Cấu Trúc Thư Mục (Repository)

foodfast-delivery/ ├── api-gateway/ # Cấu hình Nginx API Gateway ├── frontend/ # Giao diện Next.js (Client Apps) ├── services/ # Các microservices backend │ ├── order-service/ # Spring Boot - Quản lý Đơn hàng │ ├── payment-service/ # Spring Boot - Quản lý Thanh toán │ ├── product-service/ # Node.js - Quản lý Sản phẩm/Nhà hàng │ └── user-service/ # Node.js - Quản lý Người dùng ├── docker-compose.yml # Tệp điều phối khởi chạy hệ thống ├── PRD_FoodFastDelivery.docx # Tài liệu Đặc tả Yêu cầu Sản phẩm └── README.md


---

## 🚀 Quick Start (Khởi chạy với Docker)

### 1. Yêu cầu
-   [Docker](https://www.docker.com/get-started)
-   [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Cấu hình Môi trường
Trước khi chạy, bạn cần thiết lập các tệp môi trường (`.env`) cho các service trong thư mục `services/`.
-   `services/user-service/.env`
-   `services/product-service/.env`
-   Cấu hình `application.yml` cho `order-service` và `payment-service`.

Đặc biệt, cần cập nhật thông tin VNPay (lấy từ file `README.md` mẫu) trong service thanh toán (Payment Service).

### 3. Khởi chạy Hệ thống
Mở terminal tại thư mục gốc của dự án và chạy:

```bash
# Xây dựng (build) và khởi chạy tất cả các services ở chế độ nền
docker-compose up -d --build
4. Truy cập Ứng dụng
Web UI (Frontend): http://localhost:3000 (Port 3000 là port mặc định cho Next.js, vui lòng kiểm tra frontend/Dockerfile hoặc docker-compose.yml nếu khác)

API Gateway: http://localhost:8080 (Đây là điểm vào (entry point) cho tất cả các API, theo cấu hình api-gateway/nginx.conf)

📖 Tài Liệu Dự Án
README.md (File này): Hướng dẫn chung và cài đặt.


PRD_FoodFastDelivery.docx: Tài liệu đặc tả yêu cầu sản phẩm chi tiết, bao gồm tất cả các flow và sơ đồ kiến trúc (Use Case , ERD , Component , Deployment...).




🎯 Flow Hoạt Động
1. Khách hàng đặt hàng

Trang chủ → Chọn cửa hàng → Thêm món → Giỏ hàng → Thanh toán (VNPay/COD) 

2. Cửa hàng xử lý

Dashboard (Nhà hàng) → Chấp nhận đơn → Chuẩn bị món → Sẵn sàng giao → Giao cho drone 

3. Drone giao hàng

Hệ thống (Drone Service) → Chọn drone khả dụng → Gán đơn hàng → Drone cất cánh → Theo dõi GPS → Giao thành công → Drone quay về 

Status Flow (Trạng thái đơn hàng)

PENDING → PAID (Nếu Online) / WAITING_FOR_DELIVERY (Nếu COD) → PREPARING (Nhà hàng xác nhận) → READY_FOR_DELIVERY → IN_DELIVERY (Drone cất cánh) → DELIVERED 



🌟 Features (Chức năng)
(Dựa trên PRD )

Khách hàng
✅ Đăng ký/Đăng nhập (Email hoặc Google) 

✅ Quản lý hồ sơ và địa chỉ (hỗ trợ GPS) 

✅ Xem danh sách cửa hàng & món ăn 

✅ Thêm vào giỏ hàng, đặt hàng 

✅ Thanh toán VNPay hoặc COD 

✅ Xem lịch sử đơn hàng

✅ Theo dõi vị trí drone thời gian thực trên bản đồ 

Cửa hàng (Web Restaurant)
✅ Quản lý thông tin nhà hàng 

✅ Quản lý thực đơn (Thêm/Sửa/Xóa/Ẩn món, quản lý danh mục) 

✅ Nhận và quản lý đơn hàng (Chấp nhận/Từ chối) 

✅ Chỉ định drone và theo dõi drone (vị trí, pin, trạng thái) 

✅ Quản lý đội drone của nhà hàng (Thêm/Xóa/Bảo trì) 

Quản trị (Web Admin)
✅ Dashboard giám sát toàn bộ hệ thống (doanh thu, tổng đơn, drone hoạt động) 

✅ Quản lý Người dùng (Khóa/Mở tài khoản) 

✅ Quản lý Nhà hàng (Duyệt đăng ký, Tạm ngưng) 

✅ Giám sát nhật ký hệ thống (logs lỗi, giao dịch, hoạt động drone) 

✅ Tạo báo cáo và thống kê (Tài chính, Hoạt động) 

🧪 Testing
Test Data (Dữ liệu test)
Default Users (Kiểm tra User Service):

Username: danh11 / Password: 123456 (Từ README.md mẫu)

VNPay Sandbox (Dùng cho Payment Service): (Từ README.md mẫu)

Bank: NCB

Card: 9704198526191432198

Name: NGUYEN VAN A

Date: 07/15

OTP: 123456

📝 Configuration (Cấu hình)
Cấu hình chung
Mỗi microservice trong services/ đều yêu cầu tệp cấu hình riêng:

Node.js (User, Product): Cần tệp .env.

Spring Boot (Order, Payment): Cấu hình trong src/main/resources/application.yml.

Cấu hình VNPay (Quan trọng)
Để thanh toán hoạt động, bạn cần cấu hình vnpay.tmnCode và vnpay.hashSecret trong application.yml của Payment Service (thông tin lấy từ README.md mẫu):

YAML

# services/payment-service/src/main/resources/application.yml
vnpay:
  tmnCode: YOUR_TMN_CODE
  hashSecret: YOUR_HASH_SECRET
  url: [https://sandbox.vnpayment.vn/paymentv2/vpcpay.html](https://sandbox.vnpayment.vn/paymentv2/vpcpay.html)
🐛 Troubleshooting (Gỡ lỗi)
(Dựa trên README.md mẫu)

1. Không thấy đơn hàng trong trang quản lý của nhà hàng?

Check: User nhà hàng đã login chưa?

Check: Đơn hàng đã được thanh toán (PAID) hoặc là COD (WAITING_FOR_DELIVERY) chưa?

2. Bị logout sau khi thanh toán VNPay?

Check: Bạn có đang chạy qua localhost không? VNPay sandbox callback yêu cầu một URL công khai.

Solution: Sử dụng Ngrok để expose localhost của bạn và cập nhật URL callback trong cấu hình VNPay.

3. Drone không khả dụng?

Check: Database (PostgreSQL/MongoDB) đã có dữ liệu drone với status AVAILABLE chưa?

Solution: Chạy script SQL/Mongo để thêm dữ liệu drone test.

📧 Contact
Project: FoodFast Drone Delivery

Team: CNPM - HKI 4

Year: 2025


Thành viên: Hồ Quốc Khôi (3122411099), Lê Duy Huy (3122411064) 


Giảng viên: Nguyễn Quốc Huy
