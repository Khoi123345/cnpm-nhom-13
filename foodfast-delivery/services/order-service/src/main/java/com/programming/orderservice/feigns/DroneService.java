package com.programming.orderservice.feigns;

import com.programming.orderservice.dtos.ApiResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "DRONE-SERVICE", url = "${feign.client.drone-service-url}")
public interface DroneService {

    /**
     * Hoàn thành giao hàng - Drone tự động quay về IDLE
     */
    @PostMapping("/api/v1/drones/internal/drones/{droneId}/complete-delivery")
    ResponseEntity<ApiResponseDto<Void>> completeDelivery(
            @PathVariable("droneId") Long droneId,
            @RequestParam("orderId") Long orderId
    );
}
