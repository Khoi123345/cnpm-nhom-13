package com.programming.orderservice.services;

import com.programming.orderservice.dtos.ApiResponseDto;
import com.programming.orderservice.dtos.OrderRequestDto;
import com.programming.orderservice.enums.EOrderPaymentStatus;
import com.programming.orderservice.enums.EOrderStatus;
import com.programming.orderservice.exceptions.ResourceNotFoundException;
import com.programming.orderservice.exceptions.ServiceLogicException;
import com.programming.orderservice.feigns.UserService;
import com.programming.orderservice.model.Order;
import com.programming.orderservice.model.OrderItems;
import com.programming.orderservice.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    //private final UserService userService; // ✅ Sử dụng Feign Client

    // 🟩 Tạo đơn hàng mới - ĐÃ SỬA
    @Override
    public ResponseEntity<ApiResponseDto<?>> createOrder(String userId, OrderRequestDto request)
            throws ResourceNotFoundException, ServiceLogicException {
        try {
            // 1. Validate user exists - Gọi User Service
            //Boolean userExists = userService.validateUserExists(userId).hasBody();
            //if (userExists == null || !userExists) {
            // throw new ResourceNotFoundException("User not found: " + userId);
           // }
            log.info("🟢 Creating order for user: {}", userId);

            // 2. Create order từ request
            Order order = orderRequestDtoToOrder(request, userId);

            // 3. Save order
            Order savedOrder = orderRepository.save(order);

            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Order created successfully")
                            .response(savedOrder)
                            .build()
            );

//        } catch (ResourceNotFoundException e) {
//            throw e;
        } catch (Exception e) {
            log.error("❌ Error creating order: {}", e.getMessage());
            throw new ServiceLogicException("Cannot create order: " + e.getMessage());
        }
    }

    // 🟦 Lấy danh sách đơn hàng của người dùng
    @Override
    public ResponseEntity<ApiResponseDto<?>> getOrdersByUser(String userId)
            throws ResourceNotFoundException, ServiceLogicException {
        try {
            List<Order> orders = orderRepository.findByUserId(userId);

            if (orders.isEmpty()) {
                throw new ResourceNotFoundException("No orders found for user: " + userId);
            }

            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message(orders.size() + " orders found")
                            .response(orders)
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Error getting user orders: {}", e.getMessage());
            throw new ServiceLogicException("Cannot get user orders!");
        }
    }

    // 🟨 Lấy tất cả đơn hàng (admin)
    @Override
    public ResponseEntity<ApiResponseDto<?>> getAllOrders() throws ServiceLogicException {
        try {
            List<Order> orders = orderRepository.findAll();
            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message(orders.size() + " orders found")
                            .response(orders)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Error getting all orders: {}", e.getMessage());
            throw new ServiceLogicException("Cannot get all orders!");
        }
    }

    // 🟥 Hủy đơn hàng - ĐÃ SỬA (String orderId)
    @Override
    public ResponseEntity<ApiResponseDto<?>> cancelOrder(Long orderId)
            throws ServiceLogicException, ResourceNotFoundException {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

            // Chỉ cho phép hủy orders có status PENDING
            if (order.getOrderStatus() != EOrderStatus.PENDING) {
                throw new ServiceLogicException("Only pending orders can be cancelled");
            }

            order.setOrderStatus(EOrderStatus.CANCELLED);
            orderRepository.save(order);

            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Order cancelled successfully!")
                            .build()
            );
        } catch (ResourceNotFoundException | ServiceLogicException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Error cancelling order: {}", e.getMessage());
            throw new ServiceLogicException("Cannot cancel order!");
        }
    }

    // 🏪 Lấy orders theo restaurant
    @Override
    public ResponseEntity<ApiResponseDto<?>> getOrdersByRestaurant(String restaurantId)
            throws ResourceNotFoundException, ServiceLogicException {
        try {
            List<Order> orders = orderRepository.findByRestaurantId(restaurantId);

            if (orders.isEmpty()) {
                throw new ResourceNotFoundException("No orders found for restaurant: " + restaurantId);
            }

            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Orders retrieved successfully for restaurant: " + restaurantId)
                            .response(orders)
                            .build()
            );

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new ServiceLogicException("Error while fetching restaurant orders: " + e.getMessage());
        }
    }

    // 🧩 Chuyển DTO → Entity - ĐÃ SỬA
    private Order orderRequestDtoToOrder(OrderRequestDto request, String userId) {
        return Order.builder()
                .userId(userId) // ✅ Dùng userId từ parameter
                .addressShip(request.getAddressShip())
                .orderAmt(request.getOrderAmt())
                .orderItems(request.getOrderItems())
                .placedOn(LocalDateTime.now())
                .orderStatus(EOrderStatus.PENDING)
                .paymentStatus(EOrderPaymentStatus.UNPAID)
                .build();
    }
}