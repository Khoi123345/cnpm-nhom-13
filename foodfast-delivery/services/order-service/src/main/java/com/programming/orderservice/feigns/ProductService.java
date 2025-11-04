package com.programming.orderservice.feigns;

import com.programming.orderservice.dtos.ApiResponseDto;
import com.programming.orderservice.dtos.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient("PRODUCT-SERVICE")
public interface ProductService {

    @GetMapping("/product/get/byId")
    ResponseEntity<ApiResponseDto<ProductDto>> getCartById(@RequestParam String id, @RequestHeader("Authorization") String token);

}