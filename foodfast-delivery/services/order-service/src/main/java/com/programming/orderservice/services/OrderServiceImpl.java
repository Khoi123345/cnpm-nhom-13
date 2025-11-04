package com.programming.orderservice.services;

import com.programming.orderservice.dtos.*;
import com.programming.orderservice.enums.EOrderPaymentStatus;
import com.programming.orderservice.enums.EOrderStatus;
import com.programming.orderservice.exceptions.ResourceNotFoundException;
import com.programming.orderservice.exceptions.ServiceLogicException;
import com.programming.orderservice.feigns.ProductService;
import com.programming.orderservice.feigns.UserService;
import com.programming.orderservice.model.Order;
import com.programming.orderservice.repositories.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Component
@Slf4j
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ProductService cartService;

    @Autowired
    private UserService userService;


    public ResponseEntity<ApiResponseDto<?>> createOrder(String token, OrderRequestDto request) throws ResourceNotFoundException, ServiceLogicException {

        try {

            ProductDto cart = cartService.getCartById(request.getCartId(), token).getBody().getResponse();
            UserDto user = userService.getUserById(cart.getUserId()).getBody().getResponse();

            if (user==null || cart == null || cart.getCartItems().isEmpty()) {
                throw new ResourceNotFoundException("No items in the cart!");
            }

            Order order = orderRequestDtoToOrder(request, cart);
            order = orderRepository.insert(order);
            try {
                if (order.getId() != null && clearCart(cart, token) && sendConfirmationEmail(user, order)) {
                    return ResponseEntity.ok(
                            ApiResponseDto.builder()
                                    .isSuccess(true)
                                    .message("Order has been successfully placed!")
                                    .build()
                    );
                }
                throw new ServiceLogicException("Unable to proceed order!");
            }catch (Exception e) {
                orderRepository.deleteById(order.getId());
                throw new ServiceLogicException(e.getMessage());
            }

        }catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException(e.getMessage());
        }catch (Exception e) {
            log.error("Failed to create order: " + e.getMessage());
            throw new ServiceLogicException("Unable to proceed order!");
        }
    }

    public ResponseEntity<ApiResponseDto<?>> getOrdersByUser(String userId) throws ServiceLogicException {
        try {
            Set<Order> orders = orderRepository.findByUserIdOrderByIdDesc(userId);
            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message(orders.size() + " orders found!")
                            .response(orders)
                            .build()
            );
        }catch (Exception e) {
            log.error("Failed to create order: " + e.getMessage());
            throw new ServiceLogicException("Unable to find orders!");
        }
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> getAllOrders() throws ServiceLogicException {
        try {
            List<Order> orders = orderRepository.findAll();
            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message(orders.size() + " orders found!")
                            .response(orders)
                            .build()
            );
        }catch (Exception e) {
            log.error("Failed to create order: " + e.getMessage());
            throw new ServiceLogicException("Unable to find orders!");
        }
    }


    @Override
    public ResponseEntity<ApiResponseDto<?>> cancelOrder(String orderId) throws ServiceLogicException, ResourceNotFoundException {
        try {
            if(orderRepository.existsById(orderId)) {
                Order order = orderRepository.findById(orderId).orElse(null);
                order.setOrderStatus(EOrderStatus.CANCELLED);
                orderRepository.save(order);
                return ResponseEntity.ok(
                        ApiResponseDto.builder()
                                .isSuccess(true)
                                .message("Order successfully cancelled")
                                .build()
                );
            }
        }catch (Exception e) {
            log.error("Failed to create order: " + e.getMessage());
            throw new ServiceLogicException("Unable to find orders!");
        }
        throw new ResourceNotFoundException("Order not found with id " + orderId);
    }

    private boolean clearCart(ProductDto cart, String token) {
        return Objects.requireNonNull(cartService.clearCartById(cart.getCartId(), token).getBody()).isSuccess();
    }


    private Order orderRequestDtoToOrder(OrderRequestDto request, ProductDto cart) {
        return Order.builder()
                .userId(cart.getUserId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .phoneNo(request.getPhoneNo())
                .placedOn(LocalDateTime.now())
                .orderStatus(EOrderStatus.PENDING)
                .paymentStatus(EOrderPaymentStatus.UNPAID)
                .orderAmt(cart.getSubtotal())
                .orderItems(cart.getCartItems())
                .build();
    }

}