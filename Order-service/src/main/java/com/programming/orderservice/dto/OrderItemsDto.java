package com.programming.orderservice.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class OrderItemsDto {
    private Long id;
    private String name;
    private BigDecimal price;
    private Integer quantity;
}
