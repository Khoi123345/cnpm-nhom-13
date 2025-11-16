package com.programming.droneservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO để gán đơn hàng cho drone
 * Gọi từ order-service qua Feign Client
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignOrderRequestDto {
    
    @NotNull(message = "Drone ID is required")
    private Long droneId;
    
    @NotNull(message = "Order ID is required")
    private Long orderId;
    
    @NotNull(message = "Destination latitude is required")
    private Double destinationLat;
    
    @NotNull(message = "Destination longitude is required")
    private Double destinationLng;
    
    private String destinationAddress;
}
