# Test CASCADE DELETE Constraints

## 🔹 MongoDB (Product Service)

### Test xóa Restaurant → Tự động xóa Products

```bash
# Kết nối MongoDB
docker exec -it <product-service-container> mongosh mongodb://localhost:27017/productdb

# 1. Tạo Restaurant test
db.restaurants.insertOne({
  restaurantId: "test-cascade-001",
  owner_id: "owner123",
  name: "Test Cascade Restaurant",
  address: "123 Test St",
  phone: "0123456789",
  isActive: true,
  isOnline: true
})

# Lấy _id của restaurant vừa tạo
const restaurantId = db.restaurants.findOne({restaurantId: "test-cascade-001"})._id

# 2. Tạo Products thuộc Restaurant này
db.products.insertMany([
  {
    name: "Test Product 1",
    description: "Product for cascade test",
    price: 100000,
    imageurl: "http://example.com/image1.jpg",
    quantity: 10,
    restaurant: restaurantId
  },
  {
    name: "Test Product 2",
    description: "Another product",
    price: 150000,
    imageurl: "http://example.com/image2.jpg",
    quantity: 5,
    restaurant: restaurantId
  }
])

# 3. Kiểm tra products đã tạo
db.products.countDocuments({ restaurant: restaurantId })  // Kết quả: 2

# 4. ⭐ XÓA RESTAURANT (trigger cascade delete qua middleware)
db.restaurants.deleteOne({ _id: restaurantId })

# 5. Kiểm tra products đã bị xóa theo
db.products.countDocuments({ restaurant: restaurantId })  // Kết quả: 0 ✅
```

**Lưu ý:** Mongoose middleware chỉ chạy khi xóa qua code (`Restaurant.findByIdAndDelete()`). 
Nếu xóa trực tiếp bằng `db.restaurants.deleteOne()`, middleware **KHÔNG** chạy.

---

## 🔹 PostgreSQL - Order Service

### Test xóa Order → Tự động xóa OrderItems

```bash
# Kết nối PostgreSQL
docker exec -it <order-service-container> psql -U postgres -d orderdb

# 1. Tạo Order test
INSERT INTO orders (user_id, user_name, address_ship, order_amt, placed_on, restaurant_id, restaurant_name, order_status, payment_status)
VALUES ('user123', 'Test User', '123 Test Address', 500000, NOW(), 'rest123', 'Test Restaurant', 'PENDING', 'PENDING');

-- Lấy order_id vừa tạo
SELECT id FROM orders WHERE user_id = 'user123' ORDER BY id DESC LIMIT 1;
-- Giả sử order_id = 999

# 2. Tạo OrderItems
INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal, restaurant_id, restaurant_name)
VALUES 
  (999, 'prod1', 'Pizza', 2, 100000, 200000, 'rest123', 'Test Restaurant'),
  (999, 'prod2', 'Burger', 3, 80000, 240000, 'rest123', 'Test Restaurant');

# 3. Kiểm tra order_items
SELECT COUNT(*) FROM order_items WHERE order_id = 999;  -- Kết quả: 2

# 4. ⭐ XÓA ORDER (trigger ON DELETE CASCADE)
DELETE FROM orders WHERE id = 999;

# 5. Kiểm tra order_items đã bị xóa theo
SELECT COUNT(*) FROM order_items WHERE order_id = 999;  -- Kết quả: 0 ✅

# Xem constraint đã được tạo
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'order_items';
-- Kết quả: fk_order_items_order | DELETE RULE: CASCADE ✅
```

---

## 🔹 PostgreSQL - Drone Service

### Test xóa Drone → DeliveryLog.drone_id = NULL (giữ audit trail)

```bash
# Kết nối PostgreSQL
docker exec -it <drone-service-container> psql -U postgres -d dronedb

# 1. Tạo Drone test
INSERT INTO drones (drone_id, model, status, battery_level, current_lat, current_lng, owner_id, owner_name)
VALUES ('DRONE-TEST-999', 'DJI Phantom', 'AVAILABLE', 100, 10.762622, 106.660172, 'owner123', 'Test Owner');

-- Lấy drone id
SELECT id FROM drones WHERE drone_id = 'DRONE-TEST-999';
-- Giả sử id = 888

# 2. Tạo DeliveryLog
INSERT INTO delivery_logs (order_id, drone_id, destination_lat, destination_lng, status, created_at)
VALUES (12345, 888, 10.772622, 106.670172, 'COMPLETED', NOW());

# 3. Kiểm tra delivery_log
SELECT id, order_id, drone_id, status FROM delivery_logs WHERE drone_id = 888;
-- Kết quả: 1 row với drone_id = 888

# 4. ⭐ XÓA DRONE (trigger ON DELETE SET NULL)
DELETE FROM drones WHERE id = 888;

# 5. Kiểm tra delivery_log vẫn còn nhưng drone_id = NULL
SELECT id, order_id, drone_id, status FROM delivery_logs WHERE order_id = 12345;
-- Kết quả: drone_id = NULL ✅ (giữ lại lịch sử nhưng không reference đến drone đã xóa)

# Xem constraint
SELECT
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'delivery_logs';
-- Kết quả: fk_delivery_log_drone | DELETE RULE: SET NULL ✅
```

---

## 📋 Tóm tắt Constraints

| Service | Relationship | Constraint | Hành vi |
|---------|-------------|-----------|---------|
| **Product Service** | Restaurant → Product | Mongoose middleware | Xóa Restaurant → xóa tất cả Products |
| **Order Service** | Order → OrderItems | `ON DELETE CASCADE` | Xóa Order → xóa tất cả OrderItems |
| **Drone Service** | Drone → DeliveryLog | `ON DELETE SET NULL` | Xóa Drone → giữ DeliveryLog nhưng set drone_id = NULL |

---

## ⚠️ Lưu ý quan trọng

### MongoDB (Mongoose)
- ✅ Middleware chỉ chạy khi xóa qua **code** (`Model.deleteOne()`, `findByIdAndDelete()`)
- ❌ **KHÔNG** chạy khi xóa trực tiếp bằng `db.collection.deleteOne()` trong mongosh
- 🔧 Để test middleware: phải xóa qua API endpoint hoặc service layer

### PostgreSQL (JPA/Hibernate)
- ✅ Foreign key constraints chạy ở **DB level** → xóa bằng SQL cũng trigger cascade
- ✅ `foreignKeyDefinition` trong `@ForeignKey` tạo constraint khi chạy `spring.jpa.hibernate.ddl-auto=update`
- 🔧 Cần restart service để Hibernate apply constraint vào DB

### Best Practice
1. **Xóa qua API/Service** thay vì SQL trực tiếp → đảm bảo business logic chạy
2. **Backup trước khi test** cascade delete trên production
3. **Soft delete** (`deleted_at`) cho dữ liệu quan trọng thay vì hard delete
4. **Audit trail**: Dùng `ON DELETE SET NULL` cho relationship với log/history tables
