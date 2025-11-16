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
@Table(name = "drone_registration_requests", indexes = {
    @Index(name = "idx_request_restaurant", columnList = "restaurant_id"),
    @Index(name = "idx_request_status", columnList = "status"),
    @Index(name = "idx_request_type", columnList = "request_type")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class DroneRegistrationRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * ID nhà hàng gửi request
     */
    @Column(name = "restaurant_id", nullable = false, length = 50)
    private String restaurantId;
    
    /**
     * ID chủ nhà hàng (để phân quyền)
     */
    @Column(name = "owner_id", nullable = false, length = 50)
    private String ownerId;
    
    /**
     * Tên nhà hàng (hiển thị cho admin)
     */
    @Column(name = "restaurant_name", length = 200)
    private String restaurantName;
    
    /**
     * Loại request: REGISTER_NEW hoặc DELETE_DRONE
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 20)
    private RequestType requestType;
    
    /**
     * Trạng thái request
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;
    
    // --- Thông tin cho REGISTER_NEW ---
    
    /**
     * Tên drone muốn đăng ký
     */
    @Column(name = "drone_name", length = 100)
    private String droneName;
    
    /**
     * Model/hãng drone
     */
    @Column(name = "drone_model", length = 100)
    private String droneModel;
    
    /**
     * Tải trọng tối đa (kg)
     */
    @Column(name = "max_payload_kg")
    private Double maxPayloadKg;
    
    /**
     * Tốc độ tối đa (km/h)
     */
    @Column(name = "max_speed_kmh")
    private Double maxSpeedKmh;
    
    /**
     * Vĩ độ điểm home (nhà hàng)
     */
    @Column(name = "home_lat")
    private Double homeLat;
    
    /**
     * Kinh độ điểm home
     */
    @Column(name = "home_lng")
    private Double homeLng;
    
    // --- Thông tin cho DELETE_DRONE ---
    
    /**
     * ID drone muốn xóa (nếu requestType = DELETE_DRONE)
     */
    @Column(name = "drone_id")
    private Long droneId;
    
    /**
     * Lý do xóa/đăng ký
     */
    @Column(length = 500)
    private String reason;
    
    // --- Admin response ---
    
    /**
     * ID admin duyệt/từ chối
     */
    @Column(name = "admin_id", length = 50)
    private String adminId;
    
    /**
     * Ghi chú của admin (lý do từ chối)
     */
    @Column(name = "admin_note", length = 500)
    private String adminNote;
    
    /**
     * Thời gian admin xử lý
     */
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
