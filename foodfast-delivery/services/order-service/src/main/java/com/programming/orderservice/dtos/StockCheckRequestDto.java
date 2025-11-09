package com.programming.orderservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockCheckRequestDto {
    // Tên "items" phải khớp chính xác với những gì productController (Node.js) mong đợi
    // Product-service mong đợi: { items: [{ productId: "...", quantity: 2 }, ...] }
    private List<StockCheckItemDto> items;
}