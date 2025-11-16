package com.programming.droneservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho admin xử lý request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessRequestDto {
    
    @NotBlank(message = "Action is required (APPROVE or REJECT)")
    private String action; // APPROVE hoặc REJECT
    
    private String adminNote; // Ghi chú (bắt buộc nếu REJECT)
}
