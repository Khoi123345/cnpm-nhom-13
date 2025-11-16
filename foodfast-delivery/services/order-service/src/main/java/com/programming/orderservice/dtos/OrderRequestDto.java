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
    private String userName; // ⭐️ Thêm field
    private String addressShip;
    private Double destinationLat; // ⭐️ GPS coordinates
    private Double destinationLng; // ⭐️ GPS coordinates
    private BigDecimal orderAmt;

    private Set<OrderItems> orderItems;
}
