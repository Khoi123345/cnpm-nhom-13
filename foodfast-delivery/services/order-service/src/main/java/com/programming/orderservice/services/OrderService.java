package com.programming.orderservice.services;

import com.programming.orderservice.dtos.ApiResponseDto;
import com.programming.orderservice.dtos.OrderRequestDto;
import com.programming.orderservice.enums.EOrderStatus;
import com.programming.orderservice.exceptions.ResourceNotFoundException;
import com.programming.orderservice.exceptions.ServiceLogicException;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public interface OrderService {
    ResponseEntity<ApiResponseDto<?>> createOrder(OrderRequestDto request)
            throws ResourceNotFoundException, ServiceLogicException;

    ResponseEntity<ApiResponseDto<?>> getOrdersByUser(String userId)
            throws ResourceNotFoundException, ServiceLogicException;

    ResponseEntity<ApiResponseDto<?>> getOrdersByRestaurant(String restaurantId)
            throws ResourceNotFoundException, ServiceLogicException;

    ResponseEntity<ApiResponseDto<?>> cancelOrder(Long orderId)
            throws ServiceLogicException, ResourceNotFoundException;

    ResponseEntity<ApiResponseDto<?>> getAllOrders()
            throws ServiceLogicException;

    ResponseEntity<ApiResponseDto<?>> updateOrderStatus(Long orderId, EOrderStatus newStatus, String userId, String userRole)
            throws ServiceLogicException, ResourceNotFoundException;

}