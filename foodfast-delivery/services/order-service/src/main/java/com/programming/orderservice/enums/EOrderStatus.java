package com.programming.orderservice.enums;


public enum EOrderStatus {
    PENDING,     // Đang chờ xử lý
    CONFIRMED,   // Đã xác nhận
    PROCESSING,  // Đang xử lý
    SHIPPED,     // Đã giao hàng
    DELIVERED,   // Đã nhận hàng
    CANCELLED,   // Đã hủy
    REFUNDED,    // ✅ Đã hoàn tiền
    COMPLETED    // Hoàn thành
}