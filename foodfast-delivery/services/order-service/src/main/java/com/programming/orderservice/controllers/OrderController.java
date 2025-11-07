package com.programming.orderservice.controllers;

import com.programming.orderservice.dtos.ApiResponseDto;
import com.programming.orderservice.dtos.OrderRequestDto;
import com.programming.orderservice.exceptions.ResourceNotFoundException;
import com.programming.orderservice.exceptions.ServiceLogicException;
import com.programming.orderservice.model.OrderItems;
import com.programming.orderservice.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // 🔐 API CÓ MOCK AUTHENTICATION
    @PostMapping("/create")
    public ResponseEntity<ApiResponseDto<?>> createOrder(
            @RequestParam(required = false) String mockUserId,
            @RequestBody OrderRequestDto request)
            throws ResourceNotFoundException, ServiceLogicException {

        String userId = mockUserId != null ? mockUserId : "default-user-id";
        return orderService.createOrder(userId, request);
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

    // 🟢 TEST ENDPOINTS - RÕ RÀNG
    @PostMapping("/test/user/create")
    public ResponseEntity<ApiResponseDto<?>> createUserOrder(@RequestBody OrderRequestDto request) {
        try {
            return orderService.createOrder("user_002", request);
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
            return orderService.createOrder("restaurant-456", request);
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
}