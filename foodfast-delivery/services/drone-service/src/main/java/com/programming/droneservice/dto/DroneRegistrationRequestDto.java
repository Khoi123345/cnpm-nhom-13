package com.programming.droneservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO để nhà hàng gửi request đăng ký drone mới
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DroneRegistrationRequestDto {
    
    @NotBlank(message = "Drone name is required")
    private String droneName;
    
    @NotBlank(message = "Drone model is required")
    private String droneModel;
    
    @NotNull(message = "Max payload is required")
    @Positive(message = "Max payload must be positive")
    private Double maxPayloadKg;
    
    @NotNull(message = "Max speed is required")
    @Positive(message = "Max speed must be positive")
    private Double maxSpeedKmh;
    
    @NotNull(message = "Home latitude is required")
    private Double homeLat;
    
    @NotNull(message = "Home longitude is required")
    private Double homeLng;
    
    private String reason; // Lý do đăng ký
}
