package com.programming.orderservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

// DTO này để hứng dữ liệu trả về từ /check-stock
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockCheckResponseDto {
    private boolean sufficient;
    private List<StockCheckDetail> details;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockCheckDetail {
        private String productId;
        private String status;
        private int available;
    }
}