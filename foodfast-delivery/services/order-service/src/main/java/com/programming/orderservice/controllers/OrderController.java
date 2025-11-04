package com.programming.orderservice.controllers;

import com.programming.orderservice.dtos.ApiResponseDto;
import com.programming.orderservice.dtos.OrderRequestDto;
import com.programming.orderservice.exceptions.ResourceNotFoundException;
import com.programming.orderservice.exceptions.ServiceLogicException;
import com.programming.orderservice.model.OrderItems;
import com.programming.orderservice.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // 🔐 API có xác thực
    @PostMapping("/create")
    @PreAuthorize("hasRole('ROLE_USER')")
    ResponseEntity<ApiResponseDto<?>> createOrder(Authentication authentication, @RequestBody OrderRequestDto request) throws ResourceNotFoundException, ServiceLogicException {
        System.out.println(authentication.getCredentials().toString());
        return orderService.createOrder(authentication.getCredentials().toString(), request);
    }

    @GetMapping("/get/byUser")
    @PreAuthorize("hasRole('ROLE_USER')")
    ResponseEntity<ApiResponseDto<?>> getOrdersByUser(Authentication authentication) throws ResourceNotFoundException, ServiceLogicException {
        return orderService.getOrdersByUser(authentication.getPrincipal().toString());
    }

    @GetMapping("/get/all")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    ResponseEntity<ApiResponseDto<?>> getAllOrders() throws ResourceNotFoundException, ServiceLogicException {
        return orderService.getAllOrders();
    }

    @PatchMapping("/cancel")
    @PreAuthorize("hasRole('ROLE_USER')")
    ResponseEntity<ApiResponseDto<?>> cancelOrder(@RequestParam Long orderId) throws ResourceNotFoundException, ServiceLogicException {
        return orderService.cancelOrder(orderId);
    }

    // 🟢 Test endpoint (không cần xác thực)
    @GetMapping("/test")
    public String test() {
        return "✅ Order Service is running successfully!";
    }

    // 🟢 Tạo order test (không cần xác thực)
    @PostMapping("/test-create")
    public ResponseEntity<ApiResponseDto<?>> createTestOrder() {
        try {
            // Tạo dữ liệu test
            OrderRequestDto request = new OrderRequestDto();
            request.setUserId("user_test_123");
            request.setAddressShip("123 Đường Test, Quận 1, TP.HCM");
            request.setOrderAmt(new BigDecimal("1500000.00"));

            // Tạo order items
            Set<OrderItems> orderItems = new HashSet<>();

            OrderItems item1 = new OrderItems();
            item1.setProductId(1001L);
            item1.setProductName("iPhone 15 Pro Max");
            item1.setQuantity(1);
            item1.setPrice(new BigDecimal("1500000.00"));
            item1.setSubtotal(new BigDecimal("1500000.00"));
            orderItems.add(item1);

            request.setOrderItems(orderItems);

            // Gọi service
            return orderService.createOrder("test-token", request);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponseDto.builder()
                            .isSuccess(false)
                            .message("Lỗi test: " + e.getMessage())
                            .build()
            );
        }
    }

    // 🟢 Lấy orders theo user (test - không cần xác thực)
    @GetMapping("/test/user/{userId}")
    public ResponseEntity<ApiResponseDto<?>> getOrdersByUserTest(@PathVariable String userId) {
        try {
            return orderService.getOrdersByUser(userId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponseDto.builder()
                            .isSuccess(false)
                            .message("Lỗi: " + e.getMessage())
                            .build()
            );
        }
    }

    // 🟢 Lấy tất cả orders (test - không cần xác thực)
    @GetMapping("/test/all")
    public ResponseEntity<ApiResponseDto<?>> getAllOrdersTest() {
        try {
            return orderService.getAllOrders();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponseDto.builder()
                            .isSuccess(false)
                            .message("Lỗi: " + e.getMessage())
                            .build()
            );
        }
    }

}