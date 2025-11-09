package com.programming.orderservice.security;

import com.programming.orderservice.dtos.ApiResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MockAuthService {

    public ResponseEntity<ApiResponseDto<UserDetails>> validateToken(String token) {
        // ✅ MOCK DATA - Giả lập validate token
        if (token == null || token.isEmpty()) {
            throw new RuntimeException("Invalid token");
        }

        // 🔥 MOCK 3 LOẠI USER DỰA TRÊN TOKEN
        UserDetails userDetails;

        if (token.contains("admin")) {
            userDetails = new UserDetails("admin-123", List.of("ROLE_ADMIN"));
        } else if (token.contains("restaurant")) {
            userDetails = new UserDetails("restaurant-456", List.of("ROLE_RESTAURANT"));
        } else {
            userDetails = new UserDetails("user_002", List.of("ROLE_USER"));
        }

        ApiResponseDto<UserDetails> response = ApiResponseDto.<UserDetails>builder()
                .isSuccess(true)
                .message("Token is valid")
                .data(userDetails)
                .build();

        return ResponseEntity.ok(response);
    }
}