package com.programming.droneservice.service;

import com.programming.droneservice.dto.AssignOrderRequestDto;
import com.programming.droneservice.dto.DroneGpsUpdateDto;
import com.programming.droneservice.dto.DroneRegistrationRequestDto;
import com.programming.droneservice.model.*;

import java.util.List;

public interface DroneService {
    
    // ========== RESTAURANT APIs ==========
    
    /**
     * Lấy tất cả drone của nhà hàng (theo ownerId từ JWT)
     */
    List<Drone> getMyDrones(String ownerId);
    
    /**
     * Lấy danh sách drone available để giao đơn hàng
     */
    List<Drone> getAvailableDrones(String restaurantId, Double minBattery);
    
    /**
     * Gửi request đăng ký drone mới
     */
    DroneRegistrationRequest submitRegistrationRequest(
        String ownerId, 
        String restaurantId,
        String restaurantName,
        DroneRegistrationRequestDto dto
    );
    
    /**
     * Đánh dấu drone đang bảo trì
     */
    Drone markDroneAsMaintenance(Long droneId, String ownerId);
    
    /**
     * Kết thúc bảo trì và cho drone hoạt động trở lại (về trạng thái IDLE)
     */
    Drone markDroneReady(Long droneId, String ownerId);
    
    /**
     * Gửi request xóa drone
     */
    DroneRegistrationRequest submitDeleteRequest(Long droneId, String ownerId, String reason);
    
    /**
     * Xem lịch sử request của nhà hàng
     */
    List<DroneRegistrationRequest> getMyRequests(String restaurantId);
    
    // ========== ADMIN APIs ==========
    
    /**
     * Lấy tất cả request pending
     */
    List<DroneRegistrationRequest> getPendingRequests();
    
    /**
     * Duyệt request (tạo drone mới hoặc xóa drone)
     */
    DroneRegistrationRequest approveRequest(Long requestId, String adminId);
    
    /**
     * Từ chối request
     */
    DroneRegistrationRequest rejectRequest(Long requestId, String adminId, String adminNote);
    
    /**
     * Xem tất cả drone trong hệ thống
     */
    List<Drone> getAllDrones();
    
    // ========== INTERNAL APIs (gọi từ order-service) ==========
    
    /**
     * Gán đơn hàng cho drone
     */
    Drone assignOrder(AssignOrderRequestDto dto);
    
    /**
     * Cập nhật GPS của drone (từ WebSocket)
     */
    void updateDroneGps(DroneGpsUpdateDto dto);
    
    /**
     * Đánh dấu drone đã đến nơi
     */
    void markDroneArrived(Long droneId);
    
    /**
     * Hoàn thành giao hàng
     */
    void completeDelivery(Long droneId, Long orderId);
    
    /**
     * Đánh dấu drone đã quay về restaurant (chuyển về IDLE)
     */
    void markDroneReturnedToBase(Long droneId);
    
    /**
     * Lấy delivery log theo orderId
     */
    DeliveryLog getDeliveryLogByOrderId(Long orderId);
}
