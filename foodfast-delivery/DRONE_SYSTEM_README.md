# 🚁 Drone Delivery System - Quick Start Guide

## ✅ Đã hoàn thành

### Backend Services (Java 21 + Spring Boot 3.2.0)
- ✅ **drone-service** (Port 8086): WebSocket + GPS tracking + Redis pub/sub
- ✅ **order-service** (Port 8082): Feign client + shipOrderWithDrone() + Redis listener
- ✅ **payment-service** (Port 8085): VNPay integration
- ✅ **user-service** (Port 3000): Authentication
- ✅ **product-service** (Port 3002): Products + MongoDB

### Frontend Components (Next.js + React)
- ✅ `AddressMapPicker`: Leaflet map + Nominatim geocoding (chọn địa điểm giao hàng)
- ✅ `DroneTrackingMap`: Real-time GPS tracking với WebSocket
- ✅ `RestaurantDroneManager`: Quản lý drone fleet + assign order
- ✅ `AdminDroneApproval`: Approve/reject drone registration requests

### Simulator
- ✅ `drone-simulator.js`: Mô phỏng chuyến bay drone với GPS updates

---

## 🚀 Cách chạy

### 1. Start All Services với Docker

```bash
cd C:\CNPM\Nhom13\foodfast-delivery
docker-compose up -d --build
```

Kiểm tra containers:
```bash
docker ps
```

### 2. Test Backend APIs

**Healthcheck:**
```bash
curl http://localhost:8080/api/drones/internal/health
curl http://localhost:8080/api/orders
```

**Get available drones (Restaurant):**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8080/api/drones
```

**Ship order with drone:**
```bash
curl -X POST http://localhost:8080/api/orders/123/ship \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"droneId": 1}'
```

### 3. Run Drone Simulator

Install dependencies:
```bash
npm install
```

Start simulator:
```bash
node drone-simulator.js <droneId> <orderId> <restaurantLat> <restaurantLng> <destLat> <destLng>

# Example:
node drone-simulator.js 1 123 10.762622 106.660172 10.772622 106.670172
```

### 4. Test Frontend

Start Next.js dev server:
```bash
cd frontend
npm run dev
```

Open: http://localhost:3000

**Test pages:**
- 🏠 Customer: `/customer/checkout` - Chọn địa điểm giao hàng
- 📍 Customer: `/customer/orders/123` - Theo dõi drone real-time
- 🚁 Restaurant: `/restaurant/drones` - Quản lý drone fleet
- ✅ Admin: `/admin/drones/approval` - Duyệt đơn đăng ký drone

---

## 🧪 Test Flow End-to-End

1. **Admin**: Approve drone registration request
2. **Restaurant**: View available drones
3. **Customer**: Create order with GPS coordinates
4. **Restaurant**: Assign drone to confirmed order
5. **Run Simulator**: Simulate drone flight
6. **Customer**: Track drone real-time on map
7. **Verify**: Order status changes to DELIVERED

---

## 📊 Database Schema

**Drone Service (PostgreSQL - Port 5432):**
- `drones`: id, name, status, battery, current_lat/lng, home_lat/lng
- `delivery_logs`: id, drone_id, route_path (JSONB), distance, battery_consumed
- `drone_registration_requests`: id, restaurant_id, status, admin_note

**Order Service (PostgreSQL - Port 5432):**
- `orders`: Added `destination_lat`, `destination_lng` columns

---

## 🔌 WebSocket Endpoints

**Connect:** `ws://localhost:8080/ws` (SockJS)

**Subscribe:**
- `/topic/drone/{droneId}` - GPS updates
- `/topic/delivery/{orderId}` - Delivery status

**Publish:**
- `/app/drone/update` - Send GPS update
- `/app/drone/arrived` - Drone arrived
- `/app/drone/delivered` - Delivery completed

---

## 🛠️ Tech Stack

- **Backend**: Java 21, Spring Boot 3.2.0, WebSocket (STOMP), Redis, PostgreSQL, Feign
- **Frontend**: Next.js 14, React, TypeScript, Leaflet, ShadcN UI
- **Simulator**: Node.js, SockJS, STOMP
- **DevOps**: Docker, Docker Compose, Nginx (API Gateway)

---

## 📝 Notes

- JWT Secret: `your-super-secret-jwt-key-change-this-in-production-12345`
- Max delivery distance: 10 km
- Battery consumption: 5% per km
- Drone speed: 30 km/h
- Minimum battery reserve: 20%
