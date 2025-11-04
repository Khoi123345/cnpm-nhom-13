package com.programming.orderservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponseDto {
    private String orderId;
    private String userId;
    private String userName;
    private List<OrderItemsDto> items;
    private Double totalPrice;
    private String status;
}
