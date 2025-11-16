package com.programming.droneservice.model;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "delivery_logs", indexes = {
    @Index(name = "idx_delivery_order", columnList = "order_id"),
    @Index(name = "idx_delivery_drone", columnList = "drone_id"),
    @Index(name = "idx_delivery_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class DeliveryLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * ID đơn hàng (từ order-service)
     */
    @Column(name = "order_id", nullable = false)
    private Long orderId;
    
    /**
     * Drone thực hiện chuyến bay này
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drone_id", nullable = false)
    private Drone drone;
    
    /**
     * Lộ trình GPS (lưu dưới dạng JSONB)
     * Mỗi phần tử là một điểm GPS với timestamp
     */
    @Type(JsonType.class)
    @Column(name = "route_path", columnDefinition = "jsonb")
    @Builder.Default
    private List<GpsPoint> routePath = new ArrayList<>();
    
    /**
     * Vĩ độ điểm đến (địa chỉ khách hàng)
     */
    @Column(name = "destination_lat", nullable = false)
    private Double destinationLat;
    
    /**
     * Kinh độ điểm đến
     */
    @Column(name = "destination_lng", nullable = false)
    private Double destinationLng;
    
    /**
     * Địa chỉ text (để hiển thị)
     */
    @Column(name = "destination_address", length = 500)
    private String destinationAddress;
    
    /**
     * Khoảng cách dự kiến (km)
     */
    @Column(name = "estimated_distance_km")
    private Double estimatedDistanceKm;
    
    /**
     * Thời gian dự kiến (phút)
     */
    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;
    
    /**
     * Khoảng cách thực tế đã bay (km)
     */
    @Column(name = "actual_distance_km")
    private Double actualDistanceKm;
    
    /**
     * Pin tiêu hao (%)
     */
    @Column(name = "battery_consumed_percent")
    private Double batteryConsumedPercent;
    
    /**
     * Trạng thái chuyến bay
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DeliveryStatus status = DeliveryStatus.PREPARING;
    
    /**
     * Thời gian bắt đầu (drone cất cánh)
     */
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    /**
     * Thời gian đến nơi
     */
    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime;
    
    /**
     * Thời gian hoàn thành (khách nhận hàng)
     */
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    /**
     * Ghi chú (lỗi, lý do hủy, v.v.)
     */
    @Column(length = 1000)
    private String notes;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
