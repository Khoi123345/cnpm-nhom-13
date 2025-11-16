package com.programming.droneservice.repository;

import com.programming.droneservice.model.Drone;
import com.programming.droneservice.model.DroneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DroneRepository extends JpaRepository<Drone, Long> {
    
    /**
     * Tìm tất cả drone của một nhà hàng
     */
    List<Drone> findByRestaurantIdAndIsActiveTrue(String restaurantId);
    
    /**
     * Tìm tất cả drone của một chủ nhà hàng (ownerId)
     */
    List<Drone> findByOwnerIdAndIsActiveTrue(String ownerId);
    
    /**
     * Tìm drone available (IDLE, pin đầy, active)
     * Để gợi ý cho nhà hàng khi có đơn hàng mới
     */
    @Query("SELECT d FROM Drone d WHERE d.restaurantId = :restaurantId " +
           "AND d.status = 'IDLE' " +
           "AND d.batteryPercent >= :minBattery " +
           "AND d.isActive = true " +
           "ORDER BY d.batteryPercent DESC")
    List<Drone> findAvailableDrones(
        @Param("restaurantId") String restaurantId,
        @Param("minBattery") Double minBattery
    );
    
    /**
     * Tìm drone theo status và restaurantId
     */
    List<Drone> findByRestaurantIdAndStatus(String restaurantId, DroneStatus status);
    
    /**
     * Tìm drone đang giao đơn hàng cụ thể
     */
    Optional<Drone> findByCurrentOrderId(Long orderId);
    
    /**
     * Đếm số drone của nhà hàng
     */
    long countByRestaurantIdAndIsActiveTrue(String restaurantId);
}
