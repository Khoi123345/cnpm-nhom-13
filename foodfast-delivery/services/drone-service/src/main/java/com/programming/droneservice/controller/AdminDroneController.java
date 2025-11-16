package com.programming.droneservice.controller;

import com.programming.droneservice.dto.ApiResponseDto;
import com.programming.droneservice.dto.ProcessRequestDto;
import com.programming.droneservice.model.Drone;
import com.programming.droneservice.model.DroneRegistrationRequest;
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
 * Controller cho Admin (ROLE_ADMIN)
 * Duyệt request đăng ký drone, quản lý toàn bộ drone
 */
@RestController
@RequestMapping("/api/v1/admin/drones")
@RequiredArgsConstructor
@Slf4j
public class AdminDroneController {
    
    private final DroneService droneService;
    
    /**
     * Lấy tất cả request pending
     */
    @GetMapping("/requests/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDto<List<DroneRegistrationRequest>>> getPendingRequests() {
        List<DroneRegistrationRequest> requests = droneService.getPendingRequests();
        return ResponseEntity.ok(ApiResponseDto.success("Pending requests retrieved", requests));
    }
    
    /**
     * Duyệt request
     */
    @PutMapping("/requests/{requestId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDto<DroneRegistrationRequest>> approveRequest(
            @PathVariable Long requestId,
            Authentication auth
    ) {
        String adminId = auth.getName();
        DroneRegistrationRequest request = droneService.approveRequest(requestId, adminId);
        return ResponseEntity.ok(ApiResponseDto.success("Request approved", request));
    }
    
    /**
     * Từ chối request
     */
    @PutMapping("/requests/{requestId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDto<DroneRegistrationRequest>> rejectRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody ProcessRequestDto dto,
            Authentication auth
    ) {
        String adminId = auth.getName();
        
        if (dto.getAdminNote() == null || dto.getAdminNote().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponseDto.error("Admin note is required when rejecting"));
        }
        
        DroneRegistrationRequest request = droneService.rejectRequest(requestId, adminId, dto.getAdminNote());
        return ResponseEntity.ok(ApiResponseDto.success("Request rejected", request));
    }
    
    /**
     * Xem tất cả drone trong hệ thống
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDto<List<Drone>>> getAllDrones() {
        List<Drone> drones = droneService.getAllDrones();
        return ResponseEntity.ok(ApiResponseDto.success("All drones retrieved", drones));
    }
}
