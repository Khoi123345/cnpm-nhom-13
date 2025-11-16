package com.programming.droneservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO để drone gửi GPS update qua WebSocket
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DroneGpsUpdateDto {
    
    @NotNull
    private Long droneId;
    
    @NotNull
    private Double lat;
    
    @NotNull
    private Double lng;
    
    private Double batteryPercent;
    private Double speedKmh;
    private Double altitudeMeters; // Độ cao
}
