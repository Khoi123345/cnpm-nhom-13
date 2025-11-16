package com.programming.droneservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "drones", indexes = {
    @Index(name = "idx_drone_restaurant", columnList = "restaurant_id"),
    @Index(name = "idx_drone_owner", columnList = "owner_id"),
    @Index(name = "idx_drone_status", columnList = "status"),
    @Index(name = "idx_drone_order", columnList = "current_order_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Drone {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * ID của nhà hàng (từ product-service MongoDB)
     * Mỗi drone được gán cho một nhà hàng cụ thể
     */
    @Column(name = "restaurant_id", nullable = false, length = 50)
    private String restaurantId;
    
    /**
     * ID của chủ nhà hàng (từ user-service PostgreSQL)
     * Dùng để phân quyền: chỉ chủ nhà hàng mới xem được drone của mình
     */
    @Column(name = "owner_id", nullable = false, length = 50)
    private String ownerId;
    
    /**
     * Tên định danh của drone (ví dụ: "Drone 01", "Falcon X")
     */
    @Column(nullable = false, length = 100)
    private String name;
    
    /**
     * Trạng thái hiện tại của drone
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DroneStatus status = DroneStatus.IDLE;
    
    /**
     * ID đơn hàng đang giao (từ order-service)
     * NULL nếu drone đang rảnh
     */
    @Column(name = "current_order_id")
    private Long currentOrderId;
    
    /**
     * Pin hiện tại (%)
     * Range: 0.0 - 100.0
     */
    @Column(name = "battery_percent")
    @Builder.Default
    private Double batteryPercent = 100.0;
    
    /**
     * Vĩ độ hiện tại
     */
    @Column(name = "current_lat")
    private Double currentLat;
    
    /**
     * Kinh độ hiện tại
     */
    @Column(name = "current_lng")
    private Double currentLng;
    
    /**
     * Vĩ độ điểm "home" (nhà hàng)
     * Drone sẽ bay về đây sau khi giao hàng
     */
    @Column(name = "home_lat")
    private Double homeLat;
    
    /**
     * Kinh độ điểm "home"
     */
    @Column(name = "home_lng")
    private Double homeLng;
    
    /**
     * Tải trọng tối đa (kg)
     */
    @Column(name = "max_payload_kg")
    @Builder.Default
    private Double maxPayloadKg = 2.0;
    
    /**
     * Tốc độ tối đa (km/h)
     */
    @Column(name = "max_speed_kmh")
    @Builder.Default
    private Double maxSpeedKmh = 30.0;
    
    /**
     * Số chuyến đã giao (thống kê)
     */
    @Column(name = "total_deliveries")
    @Builder.Default
    private Integer totalDeliveries = 0;
    
    /**
     * Trạng thái hoạt động (có thể bị vô hiệu hóa bởi admin)
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
