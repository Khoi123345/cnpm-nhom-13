package com.programming.orderservice.feigns;

import com.programming.orderservice.dtos.ApiResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient("PRODUCT-SERVICE")
public interface ProductService {

    @GetMapping("/product/get/byId")
    ResponseEntity<ApiResponseDto<Object>> getUserById(@RequestParam String id);

}