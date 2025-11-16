# 🧪 End-to-End Testing Flow - Drone Delivery System

## ✅ Completed Steps

### 1. Backend APIs Testing
- ✓ JWT Authentication working (user-service ↔ drone-service)
- ✓ GET `/api/drones/my-restaurant` - Returns 5 drones for sgu@gmail.com
- ✓ POST `/api/drones/internal/assign-order` - Successfully assigns drone to order
- ✓ Drone status changes: IDLE → DELIVERING
- ✓ Database verified: restaurant_id matches user UUID

### 2. Frontend Components Integration
- ✓ `RestaurantDroneManager` integrated in `/restaurant/dashboard`
- ✓ `AdminDroneApproval` integrated in `/admin/dashboard`
- ✓ `AddressMapPicker` integrated in `/customer/checkout`
- ✓ `DroneTrackingMap` integrated in `/customer/orders/[id]`
- ✓ Frontend running at http://localhost:3000

---

## 🎯 Manual Testing Steps

### Step 1: Login as Restaurant (sgu@gmail.com)
1. Navigate to http://localhost:3000/login
2. Login với:
   - Email: `sgu@gmail.com`
   - Password: `123456`
3. Verify redirect to `/restaurant/dashboard`

### Step 2: View Restaurant Drones
1. Tại dashboard, scroll xuống phần "🚁 Quản lý Drone"
2. Verify hiển thị 5 drones:
   - SGU-Drone-01 to SGU-Drone-05
   - Status: IDLE
   - Battery: 88-100%
3. Click "Làm mới" để reload danh sách

### Step 3: Register New Drone (Optional)
1. Click "Đăng ký Drone mới"
2. Điền thông tin:
   - Name: `SGU-Drone-Test`
   - Model: `DJI-M300`
   - Max Payload: `8` kg
   - Max Speed: `40` km/h
   - Home Location: Dùng tọa độ mặc định hoặc chọn trên map
3. Click "Gửi yêu cầu"
4. Verify request được tạo với status PENDING

### Step 4: Login as Admin (admin@gmail.com)
1. Logout khỏi tài khoản restaurant
2. Login với:
   - Email: `admin@gmail.com`
   - Password: `123456`
3. Navigate to `/admin/dashboard`

### Step 5: Approve Drone Registration
1. Tại admin dashboard, scroll xuống "✅ Phê duyệt Drone"
2. Verify hiển thị registration request từ Step 3
3. Click "Duyệt" để approve
4. Verify:
   - Request biến mất khỏi danh sách
   - Status changed to APPROVED

### Step 6: Login as Customer
1. Logout khỏi admin
2. Register tài khoản customer mới hoặc login:
   - Email: `customer@gmail.com`
   - Password: `123456`

### Step 7: Create Order with GPS Location
1. Navigate to `/customer/checkout`
2. Chọn nhà hàng: `sgu@gmail.com`
3. Thêm sản phẩm vào cart
4. **Quan trọng:** Sử dụng map picker để chọn địa chỉ giao hàng
   - Click vào bản đồ để chọn location
   - Verify `destinationLat` và `destinationLng` được set
5. Điền thông tin:
   - Phone: `0901234567`
   - Address: (sẽ tự động fill từ map)
6. Click "Đặt hàng"
7. Lưu lại `orderId` từ response

### Step 8: Restaurant Confirms Order
1. Logout customer, login lại với `sgu@gmail.com`
2. Navigate to `/restaurant/dashboard` → Tab "Đơn hàng"
3. Tìm order vừa tạo (status: PENDING)
4. Click "Xác nhận đơn hàng"
5. Verify status: PENDING → CONFIRMED

### Step 9: Assign Drone to Order
1. Vẫn ở restaurant dashboard
2. Với order đã CONFIRMED, click "Giao hàng"
3. Chọn drone từ dropdown (ví dụ: SGU-Drone-01)
4. Click "Gửi lệnh xuất phát"
5. Verify:
   - Order status: CONFIRMED → SHIPPED
   - Drone status: IDLE → DELIVERING
   - Có droneId được gán

### Step 10: Run Drone Simulator
1. Mở terminal mới
2. Get tọa độ từ database hoặc dùng mặc định:
   ```powershell
   cd C:\CNPM\Nhom13\foodfast-delivery
   node drone-simulator.js 1 <orderId> 10.762622 106.660172 10.776889 106.700806
   ```
   - `1`: droneId
   - `<orderId>`: ID từ Step 7
   - Restaurant: (10.762622, 106.660172)
   - Destination: (10.776889, 106.700806)

3. Verify terminal output:
   ```
   🚁 Drone GPS Simulator Started
   Connected to WebSocket
   ✈️ GPS Update: lat=10.762622, lng=106.660172, battery=100%
   ✈️ GPS Update: lat=10.762822, lng=106.660372, battery=99.5%
   ...
   🎯 Drone arrived at destination!
   📦 Delivery completed!
   ```

### Step 11: Customer Tracks Delivery in Real-time
1. Login lại với customer account
2. Navigate to `/customer/orders`
3. Click vào order đang giao
4. Verify order detail page hiển thị:
   - **Drone Tracking Map** với drone marker di chuyển real-time
   - Battery percentage giảm dần
   - Estimated time to arrival
   - Current GPS coordinates

5. Observe:
   - Drone marker di chuyển từ restaurant → destination
   - WebSocket updates mỗi 2-3 giây
   - Line trail hiển thị đường đi

### Step 12: Confirm Delivery
1. Sau khi simulator báo "Delivery completed"
2. Verify order status tự động: SHIPPED → DELIVERED
3. Click "Xác nhận đã nhận hàng" (nếu cần)
4. Verify:
   - Order status: DELIVERED
   - Drone status: IDLE (đã về nhà)
   - Delivery log có timestamp hoàn thành

---

## 🔍 WebSocket Testing

### Open Browser DevTools
1. F12 → Console tab
2. Navigate to order tracking page
3. Verify console logs:
   ```
   WebSocket connected
   Subscribed to /topic/drone/1
   Subscribed to /topic/delivery/<orderId>
   GPS Update: {lat: 10.762622, lng: 106.660172, battery: 100}
   ```

### Network Tab
1. F12 → Network → WS (WebSocket)
2. Verify connection: `ws://localhost:8080/ws`
3. Click vào connection để xem messages:
   - CONNECT frame
   - SUBSCRIBE frames
   - MESSAGE frames với GPS data

---

## 📊 Expected Results Summary

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Restaurant login | Redirect to dashboard, show drones tab |
| 2 | View drones | Display 5 drones with IDLE status |
| 3 | Register drone | Request created with PENDING status |
| 4 | Admin login | Access to drone approval page |
| 5 | Approve drone | Request approved, new drone created |
| 6 | Customer login | Access to checkout page |
| 7 | Create order | Order created with GPS coordinates |
| 8 | Confirm order | Status: PENDING → CONFIRMED |
| 9 | Assign drone | Status: CONFIRMED → SHIPPED, drone assigned |
| 10 | Run simulator | GPS updates published via WebSocket |
| 11 | Track delivery | Real-time map updates, drone moves |
| 12 | Confirm delivery | Status: SHIPPED → DELIVERED, drone returns |

---

## 🐛 Common Issues & Fixes

### Issue: Map không hiển thị
- **Fix:** Kiểm tra Leaflet CSS đã import trong `layout.tsx`
- **Fix:** Verify dynamic import với `ssr: false`

### Issue: WebSocket không connect
- **Fix:** Kiểm tra Nginx config có proxy `/ws` đúng không
- **Fix:** Verify Redis container đang chạy

### Issue: Drone không di chuyển trên map
- **Fix:** Kiểm tra simulator đã connect WebSocket thành công
- **Fix:** Verify orderId và droneId đúng

### Issue: JWT token expired
- **Fix:** Login lại để lấy token mới
- **Fix:** Token có thời hạn 24h (exp claim)

### Issue: CORS errors
- **Fix:** Verify Nginx đã thêm CORS headers
- **Fix:** Kiểm tra `allowedOrigins` trong SecurityConfig

---

## 🎉 Success Criteria

✅ Restaurant có thể xem và quản lý drones  
✅ Admin có thể duyệt yêu cầu đăng ký drone  
✅ Customer có thể chọn địa chỉ trên map khi checkout  
✅ Order được gán drone và tracking real-time  
✅ Drone simulator publish GPS updates qua WebSocket  
✅ Frontend nhận và hiển thị drone movement trên map  
✅ Order status tự động cập nhật: PENDING → CONFIRMED → SHIPPED → DELIVERED  
✅ Drone status thay đổi: IDLE → DELIVERING → IDLE

---

## 📝 Next Steps

1. **Performance Testing:**
   - Test với nhiều drones cùng lúc
   - Load test WebSocket với 100+ concurrent connections

2. **Edge Cases:**
   - Drone hết pin giữa chừng
   - Customer cancel order khi đang giao
   - Network disconnect/reconnect

3. **UI/UX Improvements:**
   - Add loading states
   - Better error messages
   - Notification toast khi drone arrived

4. **Production Readiness:**
   - Environment variables cho API URLs
   - Error logging với Sentry
   - Monitoring với Prometheus/Grafana
