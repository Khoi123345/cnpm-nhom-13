package com.programming.orderservice.feign;

import com.programming.orderservice.dtos.ApiResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Feign Client để gọi drone-service
 * Gọi khi nhà hàng nhấn "Gửi lệnh xuất phát"
 */
@FeignClient(
    name = "drone-service",
    url = "${drone-service.url:http://drone-service:8086}"
)
public interface DroneServiceClient {
    
    /**
     * Gán đơn hàng cho drone
     * POST /api/v1/drones/internal/assign-order
     */
    @PostMapping("/api/v1/drones/internal/assign-order")
    ResponseEntity<ApiResponseDto<Map<String, Object>>> assignOrderToDrone(
        @RequestBody AssignOrderRequest request
    );
    
    // DTO cho request
    record AssignOrderRequest(
        Long droneId,
        Long orderId,
        Double destinationLat,
        Double destinationLng,
        String destinationAddress
    ) {}
}
