package com.programming.droneservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO để lưu trong cột JSONB của DeliveryLog
 * Đại diện cho một điểm GPS trong lộ trình
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GpsPoint {
    private Double lat;
    private Double lng;
    private LocalDateTime timestamp;
    private Double batteryPercent;  // Pin tại thời điểm này
    private Double speedKmh;        // Tốc độ tại thời điểm này
}
