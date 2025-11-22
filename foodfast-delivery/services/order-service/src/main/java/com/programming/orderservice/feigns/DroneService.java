package com.programming.orderservice.feigns;

import com.programming.orderservice.dtos.ApiResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@FeignClient(name = "DRONE-SERVICE", url = "${feign.client.drone-service-url}")
public interface DroneService {

    /**
     * Assign drone to order - Tạo delivery log và bắt đầu giao hàng
     */
    @PostMapping("/api/v1/drones/internal/assign-order")
    ResponseEntity<ApiResponseDto<Object>> assignOrder(@RequestBody Map<String, Object> request);

    /**
     * Hoàn thành giao hàng - Drone tự động quay về IDLE
     */
    @PostMapping("/api/v1/drones/internal/drones/{droneId}/complete-delivery")
    ResponseEntity<ApiResponseDto<Void>> completeDelivery(
            @PathVariable("droneId") Long droneId,
            @RequestParam("orderId") Long orderId
    );
}
