package com.programming.orderservice.model;

import com.programming.orderservice.enums.EOrderPaymentStatus;
import com.programming.orderservice.enums.EOrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String firstName;
    private String lastName;

    private String addressLine1;
    private String addressLine2;
    private String phoneNo;

    private BigDecimal orderAmt;

    private LocalDateTime placedOn;

    @Enumerated(EnumType.STRING)
    private EOrderStatus orderStatus;

    @Enumerated(EnumType.STRING)
    private EOrderPaymentStatus paymentStatus;

    // Liên kết 1-nhiều với OrderItem
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "order_id")
    private Set<OrderItems> orderItems;
}
