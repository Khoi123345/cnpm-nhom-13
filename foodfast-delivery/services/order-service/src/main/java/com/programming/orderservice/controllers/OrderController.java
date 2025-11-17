package com.programming.orderservice.controllers;

import com.programming.orderservice.dtos.ApiResponseDto;
import com.programming.orderservice.dtos.OrderRequestDto;
import com.programming.orderservice.enums.EOrderStatus; // ⭐️ THÊM IMPORT NÀY
import com.programming.orderservice.exceptions.ResourceNotFoundException;
import com.programming.orderservice.exceptions.ServiceLogicException;
import com.programming.orderservice.model.OrderItems;
import com.programming.orderservice.security.UserDetails; // ⭐️ THÊM IMPORT NÀY
import com.programming.orderservice.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication; // ⭐️ THÊM IMPORT NÀY
import org.springframework.security.core.context.SecurityContextHolder; // ⭐️ THÊM IMPORT NÀY
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // 🔐 API CÓ MOCK AUTHENTICATION
    @PostMapping("/create")
    public ResponseEntity<ApiResponseDto<?>> createOrder(
            // ⭐️ BỎ DÒNG NÀY: @RequestParam(required = false) String mockUserId,
            @RequestBody OrderRequestDto request)
            throws ResourceNotFoundException, ServiceLogicException {

        // ⭐️ SỬA LẠI LOGIC LẤY ID:
        String userId = request.getUserId(); // Lấy từ request body
        if (userId == null || userId.isEmpty()) {
            throw new ServiceLogicException("User ID is missing from the request body.");
        }
        
        // ⭐️ SỬA LẠI LỜI GỌI SERVICE:
        return orderService.createOrder(request);
    }

    @GetMapping("/get/byUser")
    public ResponseEntity<ApiResponseDto<?>> getOrdersByUser(
            @RequestParam(required = false) String mockUserId)
            throws ResourceNotFoundException, ServiceLogicException {

        String userId = mockUserId != null ? mockUserId : "default-user-id";
        return orderService.getOrdersByUser(userId);
    }

    @GetMapping("/get/byRestaurant")
    public ResponseEntity<ApiResponseDto<?>> getOrdersByRestaurant(
            @RequestParam(required = false) String restaurantId)
            throws ResourceNotFoundException, ServiceLogicException {

        String resId = restaurantId != null ? restaurantId : "default-restaurant-id";
        return orderService.getOrdersByRestaurant(resId);
    }

    @GetMapping("/get/byId")
    public ResponseEntity<ApiResponseDto<?>> getOrderById(@RequestParam Long id)
            throws ResourceNotFoundException, ServiceLogicException {
        return orderService.getOrderById(id);
    }

    @GetMapping("/get/all")
    public ResponseEntity<ApiResponseDto<?>> getAllOrders()
            throws ResourceNotFoundException, ServiceLogicException {
        return orderService.getAllOrders();
    }

    @PatchMapping("/cancel")
    public ResponseEntity<ApiResponseDto<?>> cancelOrder(@RequestParam Long orderId)
            throws ResourceNotFoundException, ServiceLogicException {
        return orderService.cancelOrder(orderId);
    }
    
    // ⭐️ BẮT ĐẦU THÊM MỚI
    @PutMapping("/{orderId}/status")
    public ResponseEntity<ApiResponseDto<?>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status) // Gửi status mới qua query param
            throws ResourceNotFoundException, ServiceLogicException {

        // ⭐️ SỬA ĐỔI: Lấy thông tin người dùng từ Security Context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userId = userDetails.getUserId();
        String userRole = userDetails.getAuthorities().get(0); // Giả định user chỉ có 1 role
        // ⭐️ KẾT THÚC SỬA ĐỔI
        
        try {
            EOrderStatus newStatus = EOrderStatus.valueOf(status.toUpperCase());
            // ⭐️ SỬA ĐỔI: Truyền thêm userId và userRole xuống service
            return orderService.updateOrderStatus(orderId, newStatus, userId, userRole);
        } catch (IllegalArgumentException e) {
            throw new ServiceLogicException("Invalid status value: " + status);
        }
    }
    // ⭐️ KẾT THÚC THÊM MỚI

    // 🟢 TEST ENDPOINTS - RÕ RÀNG
    @PostMapping("/test/user/create")
    public ResponseEntity<ApiResponseDto<?>> createUserOrder(@RequestBody OrderRequestDto request) {
        try {
            // ⭐️ SỬA ĐỔI: Gán mock ID vào request body,
            // vì service không còn nhận userId làm tham số
            request.setUserId("user_002"); 
            
            // ⭐️ SỬA ĐỔI: Gọi hàm createOrder với 1 tham số
            return orderService.createOrder(request);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponseDto.builder()
                            .isSuccess(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }

    @PostMapping("/test/restaurant/create")
    public ResponseEntity<ApiResponseDto<?>> createRestaurantOrder(@RequestBody OrderRequestDto request) {
        try {
            // ⭐️ SỬA ĐỔI: Gán mock ID vào request body
            request.setUserId("restaurant-456");
            
            // ⭐️ SỬA ĐỔI: Gọi hàm createOrder với 1 tham số
            return orderService.createOrder(request);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponseDto.builder()
                            .isSuccess(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }

    @GetMapping("/test/user/orders")
    public ResponseEntity<ApiResponseDto<?>> getUserOrders() {
        try {
            return orderService.getOrdersByUser("user-123");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponseDto.builder()
                            .isSuccess(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }

    @GetMapping("/test/restaurant/orders")
    public ResponseEntity<ApiResponseDto<?>> getRestaurantOrders() {
        try {
            return orderService.getOrdersByRestaurant("restaurant-456");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponseDto.builder()
                            .isSuccess(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }

    //  ENDPOINT CẬP NHẬT PAYMENT STATUS
    @PutMapping("/{orderId}/payment-status")
    public ResponseEntity<ApiResponseDto<?>> updatePaymentStatus(@PathVariable Long orderId, @RequestBody Map<String, String> request) throws ResourceNotFoundException, ServiceLogicException {
        String paymentStatus = request.get("paymentStatus");
        return orderService.updatePaymentStatus(orderId, paymentStatus);
    }
    
    // ⭐️ ENDPOINT MỚI: Gửi lệnh xuất phát (gán drone)
    @PostMapping("/{orderId}/ship")
    public ResponseEntity<ApiResponseDto<?>> shipOrder(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> request
    ) throws ResourceNotFoundException, ServiceLogicException {
        Long droneId = Long.valueOf(request.get("droneId").toString());
        return orderService.shipOrderWithDrone(orderId, droneId);
    }
}


