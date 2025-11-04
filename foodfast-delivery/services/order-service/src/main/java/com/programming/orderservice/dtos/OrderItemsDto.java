package com.programming.orderservice.dtos;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemsDto {
    private String productId;
    private int quantity;
    private double pricePurchase;
}
