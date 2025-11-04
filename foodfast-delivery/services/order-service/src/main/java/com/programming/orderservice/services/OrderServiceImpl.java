package com.programming.orderservice.services;

import com.programming.orderservice.dtos.*;
import com.programming.orderservice.enums.EOrderPaymentStatus;
import com.programming.orderservice.enums.EOrderStatus;
import com.programming.orderservice.exceptions.ResourceNotFoundException;
import com.programming.orderservice.exceptions.ServiceLogicException;
import com.programming.orderservice.feigns.UserService;
import com.programming.orderservice.model.Order;
import com.programming.orderservice.model.OrderItems;
import com.programming.orderservice.repositories.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired(required = false)
    private UserService userService;

    // 🟩 Tạo đơn hàng mới
    @Override
    public ResponseEntity<ApiResponseDto<?>> createOrder(String token, OrderRequestDto request)
            throws ResourceNotFoundException, ServiceLogicException {
        try {
            if (request.getOrderItems() == null || request.getOrderItems().isEmpty()) {
                throw new ResourceNotFoundException("Không có sản phẩm trong đơn hàng!");
            }

            // (Tuỳ chọn) kiểm tra người dùng từ UserService
            if (userService != null) {
                UserDto user = userService.getUserById(request.getUserId()).getBody().getResponse();
                if (user == null) throw new ResourceNotFoundException("Không tìm thấy người dùng!");
            }

            Order order = orderRequestDtoToOrder(request);
            order = orderRepository.save(order);

            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Đặt hàng thành công!")
                            .response(order)
                            .build()
            );

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Lỗi khi tạo đơn hàng: {}", e.getMessage());
            throw new ServiceLogicException("Không thể tạo đơn hàng!");
        }
    }

    // 🟦 Lấy danh sách đơn hàng của người dùng - ✅ SỬA: List thay vì Set
    @Override
    public ResponseEntity<ApiResponseDto<?>> getOrdersByUser(String userId)
            throws ResourceNotFoundException, ServiceLogicException {
        try {
            // ✅ SỬA: Dùng List (khớp với Repository)
            List<Order> orders = orderRepository.findByUserIdOrderByIdDesc(userId);
            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message(orders.size() + " đơn hàng được tìm thấy")
                            .response(orders)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Lỗi khi lấy đơn hàng: {}", e.getMessage());
            throw new ServiceLogicException("Không thể lấy danh sách đơn hàng!");
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
                            .message(orders.size() + " đơn hàng được tìm thấy")
                            .response(orders)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Lỗi khi lấy tất cả đơn hàng: {}", e.getMessage());
            throw new ServiceLogicException("Không thể lấy danh sách đơn hàng!");
        }
    }

    // 🟥 Hủy đơn hàng
    @Override
    public ResponseEntity<ApiResponseDto<?>> cancelOrder(Long orderId)
            throws ServiceLogicException, ResourceNotFoundException {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với id: " + orderId));

            order.setOrderStatus(EOrderStatus.CANCELLED);
            orderRepository.save(order);

            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Hủy đơn hàng thành công!")
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Lỗi khi hủy đơn hàng: {}", e.getMessage());
            throw new ServiceLogicException("Không thể hủy đơn hàng!");
        }
    }

    // 🧩 Chuyển DTO → Entity
    private Order orderRequestDtoToOrder(OrderRequestDto request) {
        return Order.builder()
                .userId(request.getUserId())
                .addressShip(request.getAddressShip())
                .placedOn(LocalDateTime.now())
                .orderStatus(EOrderStatus.PENDING)
                .paymentStatus(EOrderPaymentStatus.UNPAID)
                .orderAmt(request.getOrderAmt())
                .orderItems(request.getOrderItems())
                .build();
    }
}