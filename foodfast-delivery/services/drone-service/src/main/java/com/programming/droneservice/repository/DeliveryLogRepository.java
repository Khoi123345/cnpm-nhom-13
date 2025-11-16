package com.programming.droneservice.repository;

import com.programming.droneservice.model.DeliveryLog;
import com.programming.droneservice.model.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryLogRepository extends JpaRepository<DeliveryLog, Long> {
    
    /**
     * Tìm log theo orderId
     */
    Optional<DeliveryLog> findByOrderId(Long orderId);
    
    /**
     * Tìm tất cả log của một drone
     */
    List<DeliveryLog> findByDroneIdOrderByCreatedAtDesc(Long droneId);
    
    /**
     * Tìm log theo status
     */
    List<DeliveryLog> findByStatus(DeliveryStatus status);
    
    /**
     * Tìm các chuyến bay đang diễn ra (IN_FLIGHT)
     */
    List<DeliveryLog> findByStatusIn(List<DeliveryStatus> statuses);
}
