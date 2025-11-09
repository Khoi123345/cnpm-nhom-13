package com.programming.orderservice.enums;


public enum EOrderStatus {
    PENDING,     // Đang chờ xử lý
    CONFIRMED,   // Đã xác nhận
    PROCESSING,  // Đang xử lý
    SHIPPED,     // Đã giao hàng
    DELIVERED,   // Đã nhận hàng
    CANCELLATION_REQUESTED, // ⭐️ THÊM: Nhà hàng yêu cầu hủy
    CANCELLED,   // Đã hủy
    REFUNDED,
    COMPLETED    // Hoàn thành
}