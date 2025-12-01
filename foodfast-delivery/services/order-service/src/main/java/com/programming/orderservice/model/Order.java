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

    private String userId;
    
    private String userName; // ⭐️ Thêm field lưu tên user

    private String addressShip;

    private BigDecimal orderAmt;

    private LocalDateTime placedOn;

    private LocalDateTime deliveredAt; // ⭐️ Thời gian giao hàng thành công

    private String restaurantId;
    
    private String restaurantName; // ⭐️ Thêm field lưu tên restaurant
    
    private Long droneId; // ⭐️ ID của drone giao hàng
    
    private Double destinationLat; // ⭐️ Vĩ độ điểm giao hàng
    
    private Double destinationLng; // ⭐️ Kinh độ điểm giao hàng

    @Enumerated(EnumType.STRING)
    private EOrderStatus orderStatus;

    @Enumerated(EnumType.STRING)
    private EOrderPaymentStatus paymentStatus;

    /**
     * ⭐️ CASCADE.ALL + orphanRemoval: Khi xóa Order thì tự động xóa OrderItems
     * foreignKey constraint: ON DELETE CASCADE ở DB level
     */
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(
        name = "order_id",
        foreignKey = @ForeignKey(
            name = "fk_order_items_order",
            foreignKeyDefinition = "FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE"
        )
    )
    private Set<OrderItems> orderItems;
}
