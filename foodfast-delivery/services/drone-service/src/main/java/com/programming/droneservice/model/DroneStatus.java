package com.programming.droneservice.model;

public enum DroneStatus {
    IDLE,           // Rảnh, đang chờ
    DELIVERING,     // Đang giao hàng
    RETURNING,      // Đang bay về nhà hàng
    CHARGING,       // Đang sạc pin
    MAINTENANCE     // Bảo trì
}
