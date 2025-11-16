package com.programming.droneservice.model;

public enum DeliveryStatus {
    PREPARING,      // Đang chuẩn bị (drone chưa cất cánh)
    IN_FLIGHT,      // Đang bay
    ARRIVED,        // Đã đến nơi
    COMPLETED,      // Hoàn thành (khách đã nhận)
    FAILED,         // Thất bại (pin hết, lỗi kỹ thuật)
    CANCELLED       // Bị hủy
}
