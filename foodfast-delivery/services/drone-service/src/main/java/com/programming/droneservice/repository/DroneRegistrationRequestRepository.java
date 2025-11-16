package com.programming.droneservice.repository;

import com.programming.droneservice.model.DroneRegistrationRequest;
import com.programming.droneservice.model.RequestStatus;
import com.programming.droneservice.model.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DroneRegistrationRequestRepository extends JpaRepository<DroneRegistrationRequest, Long> {
    
    /**
     * Tìm tất cả request pending (cho admin)
     */
    List<DroneRegistrationRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);
    
    /**
     * Tìm tất cả request của một nhà hàng
     */
    List<DroneRegistrationRequest> findByRestaurantIdOrderByCreatedAtDesc(String restaurantId);
    
    /**
     * Tìm request theo type và status
     */
    List<DroneRegistrationRequest> findByRequestTypeAndStatus(RequestType requestType, RequestStatus status);
}
