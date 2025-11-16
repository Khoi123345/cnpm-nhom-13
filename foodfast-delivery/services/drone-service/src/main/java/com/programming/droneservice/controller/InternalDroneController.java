package com.programming.droneservice.controller;

import com.programming.droneservice.dto.ApiResponseDto;
import com.programming.droneservice.dto.AssignOrderRequestDto;
import com.programming.droneservice.model.DeliveryLog;
import com.programming.droneservice.model.Drone;
import com.programming.droneservice.service.DroneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cho Internal APIs
 * Không cần authentication (gọi từ order-service qua Feign)
 */
@RestController
@RequestMapping("/api/v1/drones/internal")
@RequiredArgsConstructor
@Slf4j
public class InternalDroneController {
    
    private final DroneService droneService;
    
    /**
     * Gán đơn hàng cho drone
     * Gọi từ order-service khi nhà hàng nhấn "Gửi lệnh xuất phát"
     */
    @PostMapping("/assign-order")
    public ResponseEntity<ApiResponseDto<Drone>> assignOrder(@Valid @RequestBody AssignOrderRequestDto dto) {
        log.info("Received assign order request: droneId={}, orderId={}", dto.getDroneId(), dto.getOrderId());
        Drone drone = droneService.assignOrder(dto);
        return ResponseEntity.ok(ApiResponseDto.success("Order assigned to drone", drone));
    }
    
    /**
     * Lấy delivery log theo orderId
     * Để customer/restaurant theo dõi tiến trình
     */
    @GetMapping("/delivery-logs/order/{orderId}")
    public ResponseEntity<ApiResponseDto<DeliveryLog>> getDeliveryLog(@PathVariable Long orderId) {
        DeliveryLog log = droneService.getDeliveryLogByOrderId(orderId);
        return ResponseEntity.ok(ApiResponseDto.success("Delivery log retrieved", log));
    }
    
    /**
     * Đánh dấu drone đã đến nơi
     */
    @PostMapping("/drones/{droneId}/arrived")
    public ResponseEntity<ApiResponseDto<Void>> markDroneArrived(@PathVariable Long droneId) {
        droneService.markDroneArrived(droneId);
        return ResponseEntity.ok(ApiResponseDto.success("Drone marked as arrived", null));
    }
    
    /**
     * Hoàn thành giao hàng
     * Gọi khi customer nhấn "Đã nhận hàng"
     */
    @PostMapping("/drones/{droneId}/complete-delivery")
    public ResponseEntity<ApiResponseDto<Void>> completeDelivery(
            @PathVariable Long droneId,
            @RequestParam Long orderId
    ) {
        droneService.completeDelivery(droneId, orderId);
        return ResponseEntity.ok(ApiResponseDto.success("Delivery completed", null));
    }
    
    /**
     * Đánh dấu drone đã quay về restaurant (chuyển về IDLE)
     * Gọi khi drone simulator đã bay về vị trí ban đầu
     */
    @PostMapping("/drones/{droneId}/returned-to-base")
    public ResponseEntity<ApiResponseDto<Void>> markDroneReturnedToBase(@PathVariable Long droneId) {
        droneService.markDroneReturnedToBase(droneId);
        return ResponseEntity.ok(ApiResponseDto.success("Drone returned to base and is now IDLE", null));
    }
}
