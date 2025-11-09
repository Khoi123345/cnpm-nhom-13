// ff/services/order-service/src/main/java/com/programming/orderservice/feigns/ProductService.java
package com.programming.orderservice.feigns;

import com.programming.orderservice.dtos.ApiResponseDto;
import com.programming.orderservice.dtos.StockCheckRequestDto; // ⭐️ THÊM IMPORT
import com.programming.orderservice.dtos.StockCheckResponseDto; // ⭐️ THÊM IMPORT
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping; // ⭐️ THÊM IMPORT
import org.springframework.web.bind.annotation.RequestBody; // ⭐️ THÊM IMPORT
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "PRODUCT-SERVICE", url = "${feign.client.product-service-url}")
public interface ProductService {

    @GetMapping("/product/get/byId")
    ResponseEntity<ApiResponseDto<Object>> getUserById(@RequestParam String id);

    @PostMapping("/api/v1/products/check-stock")
    ResponseEntity<ApiResponseDto<StockCheckResponseDto>> checkStock(
            @RequestBody StockCheckRequestDto request
    );
}