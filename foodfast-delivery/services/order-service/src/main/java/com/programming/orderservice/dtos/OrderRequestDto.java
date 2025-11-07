package com.programming.orderservice.dtos;

import com.programming.orderservice.model.OrderItems;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequestDto {

    private String userId;
    private String addressShip;
    private BigDecimal orderAmt;

    private Set<OrderItems> orderItems;
}
