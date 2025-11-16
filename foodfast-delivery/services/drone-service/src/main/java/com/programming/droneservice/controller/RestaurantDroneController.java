package com.programming.droneservice.controller;

import com.programming.droneservice.dto.ApiResponseDto;
import com.programming.droneservice.dto.DroneRegistrationRequestDto;
import com.programming.droneservice.model.Drone;
import com.programming.droneservice.model.DroneRegistrationRequest;
import com.programming.droneservice.security.JwtUtil;
import com.programming.droneservice.service.DroneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho Restaurant (ROLE_RESTAURANT)
 * Quản lý drone của nhà hàng mình
 */
@RestController
@RequestMapping("/api/v1/drones")
@RequiredArgsConstructor
@Slf4j
public class RestaurantDroneController {
    
    private final DroneService droneService;
    private final JwtUtil jwtUtil;
    
    /**
     * Lấy tất cả drone của nhà hàng mình
     */
    @GetMapping("/my-restaurant")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<ApiResponseDto<List<Drone>>> getMyDrones(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Authentication required. Please login as RESTAURANT.");
        }
        String ownerId = auth.getName(); // userId từ JWT
        List<Drone> drones = droneService.getMyDrones(ownerId);
        return ResponseEntity.ok(ApiResponseDto.success("Drones retrieved successfully", drones));
    }
    
    /**
     * Lấy drone available để giao hàng
     * Dùng khi nhà hàng muốn chọn drone cho đơn hàng
     */
    @GetMapping("/my-restaurant/available")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<ApiResponseDto<List<Drone>>> getAvailableDrones(
            @RequestParam String restaurantId,
            @RequestParam(required = false, defaultValue = "80.0") Double minBattery,
            Authentication auth
    ) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Authentication required. Please login as RESTAURANT.");
        }
        String ownerId = auth.getName();
        
        // Kiểm tra xem restaurantId có phải của ownerId này không
        List<Drone> myDrones = droneService.getMyDrones(ownerId);
        boolean ownsRestaurant = myDrones.stream()
                .anyMatch(d -> d.getRestaurantId().equals(restaurantId));
        
        if (!ownsRestaurant) {
            return ResponseEntity.status(403)
                    .body(ApiResponseDto.error("You don't own this restaurant"));
        }
        
        List<Drone> availableDrones = droneService.getAvailableDrones(restaurantId, minBattery);
        return ResponseEntity.ok(ApiResponseDto.success("Available drones retrieved", availableDrones));
    }
    
    /**
     * Đánh dấu drone đang bảo trì
     */
    @PutMapping("/{droneId}/maintenance")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<ApiResponseDto<Drone>> markDroneAsMaintenance(
            @PathVariable Long droneId,
            Authentication auth
    ) {
        String ownerId = auth.getName();
        Drone drone = droneService.markDroneAsMaintenance(droneId, ownerId);
        return ResponseEntity.ok(ApiResponseDto.success("Drone marked as maintenance", drone));
    }
    
    /**
     * Gửi request đăng ký drone mới
     */
    @PostMapping("/registration-requests")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<ApiResponseDto<DroneRegistrationRequest>> submitRegistrationRequest(
            @Valid @RequestBody DroneRegistrationRequestDto dto,
            Authentication auth
    ) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Authentication required. Please login as RESTAURANT.");
        }
        String ownerId = auth.getName();
        // Restaurant ID và owner ID là cùng một giá trị (user UUID)
        String restaurantId = ownerId;
        // Restaurant name sẽ lấy từ user service hoặc để null (không bắt buộc)
        String restaurantName = null; // TODO: Fetch from user service if needed
        DroneRegistrationRequest request = droneService.submitRegistrationRequest(
                ownerId, restaurantId, restaurantName, dto
        );
        return ResponseEntity.ok(ApiResponseDto.success("Registration request submitted", request));
    }
    
    /**
     * Gửi request xóa drone
     */
    @DeleteMapping("/{droneId}/request-delete")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<ApiResponseDto<DroneRegistrationRequest>> submitDeleteRequest(
            @PathVariable Long droneId,
            @RequestParam String reason,
            Authentication auth
    ) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Authentication required. Please login as RESTAURANT.");
        }
        String ownerId = auth.getName();
        DroneRegistrationRequest request = droneService.submitDeleteRequest(droneId, ownerId, reason);
        return ResponseEntity.ok(ApiResponseDto.success("Delete request submitted", request));
    }
    
    /**
     * Xem lịch sử request của nhà hàng
     */
    @GetMapping("/registration-requests/my-restaurant")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<ApiResponseDto<List<DroneRegistrationRequest>>> getMyRequests(
            @RequestParam String restaurantId,
            Authentication auth
    ) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Authentication required. Please login as RESTAURANT.");
        }
        String ownerId = auth.getName();
        
        // Verify ownership
        List<Drone> myDrones = droneService.getMyDrones(ownerId);
        boolean ownsRestaurant = myDrones.stream()
                .anyMatch(d -> d.getRestaurantId().equals(restaurantId));
        
        if (!ownsRestaurant && !myDrones.isEmpty()) {
            return ResponseEntity.status(403)
                    .body(ApiResponseDto.error("You don't own this restaurant"));
        }
        
        List<DroneRegistrationRequest> requests = droneService.getMyRequests(restaurantId);
        return ResponseEntity.ok(ApiResponseDto.success("Requests retrieved", requests));
    }
}
