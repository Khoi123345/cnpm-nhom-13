package com.programming.droneservice.service;

import com.programming.droneservice.dto.AssignOrderRequestDto;
import com.programming.droneservice.dto.DroneGpsUpdateDto;
import com.programming.droneservice.dto.DroneRegistrationRequestDto;
import com.programming.droneservice.exception.BadRequestException;
import com.programming.droneservice.exception.ResourceNotFoundException;
import com.programming.droneservice.model.*;
import com.programming.droneservice.repository.DeliveryLogRepository;
import com.programming.droneservice.repository.DroneRegistrationRequestRepository;
import com.programming.droneservice.repository.DroneRepository;
import com.programming.droneservice.util.GpsUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DroneServiceImpl implements DroneService {
    
    private final DroneRepository droneRepository;
    private final DeliveryLogRepository deliveryLogRepository;
    private final DroneRegistrationRequestRepository requestRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    @Value("${delivery.max-distance-km}")
    private Double maxDistanceKm;
    
    @Value("${delivery.battery-consumption-per-km}")
    private Double batteryConsumptionPerKm;
    
    @Value("${delivery.speed-kmh}")
    private Double speedKmh;
    
    // ========== RESTAURANT APIs ==========
    
    @Override
    public List<Drone> getMyDrones(String ownerId) {
        return droneRepository.findByOwnerIdAndIsActiveTrue(ownerId);
    }
    
    @Override
    public List<Drone> getAvailableDrones(String restaurantId, Double minBattery) {
        if (minBattery == null) {
            minBattery = 80.0; // Mặc định yêu cầu ít nhất 80% pin
        }
        return droneRepository.findAvailableDrones(restaurantId, minBattery);
    }
    
    @Override
    @Transactional
    public DroneRegistrationRequest submitRegistrationRequest(
            String ownerId,
            String restaurantId,
            String restaurantName,
            DroneRegistrationRequestDto dto
    ) {
        DroneRegistrationRequest request = DroneRegistrationRequest.builder()
                .restaurantId(restaurantId)
                .ownerId(ownerId)
                .restaurantName(restaurantName)
                .requestType(RequestType.REGISTER_NEW)
                .status(RequestStatus.PENDING)
                .droneName(dto.getDroneName())
                .droneModel(dto.getDroneModel())
                .maxPayloadKg(dto.getMaxPayloadKg())
                .maxSpeedKmh(dto.getMaxSpeedKmh())
                .homeLat(dto.getHomeLat())
                .homeLng(dto.getHomeLng())
                .reason(dto.getReason())
                .build();
        
        return requestRepository.save(request);
    }
    
    @Override
    @Transactional
    public Drone markDroneAsMaintenance(Long droneId, String ownerId) {
        Drone drone = droneRepository.findById(droneId)
                .orElseThrow(() -> new ResourceNotFoundException("Drone not found"));
        
        if (!drone.getOwnerId().equals(ownerId)) {
            throw new BadRequestException("You don't own this drone");
        }
        
        if (drone.getStatus() == DroneStatus.DELIVERING) {
            throw new BadRequestException("Cannot mark drone as maintenance while delivering");
        }
        
        drone.setStatus(DroneStatus.MAINTENANCE);
        return droneRepository.save(drone);
    }
    
    @Override
    @Transactional
    public Drone markDroneReady(Long droneId, String ownerId) {
        Drone drone = droneRepository.findById(droneId)
                .orElseThrow(() -> new ResourceNotFoundException("Drone not found"));
        
        if (!drone.getOwnerId().equals(ownerId)) {
            throw new BadRequestException("You don't own this drone");
        }
        
        if (drone.getStatus() != DroneStatus.MAINTENANCE) {
            throw new BadRequestException("Drone is not in maintenance mode");
        }
        
        drone.setStatus(DroneStatus.IDLE);
        drone.setCurrentOrderId(null);
        return droneRepository.save(drone);
    }
    
    @Override
    @Transactional
    public DroneRegistrationRequest submitDeleteRequest(Long droneId, String ownerId, String reason) {
        Drone drone = droneRepository.findById(droneId)
                .orElseThrow(() -> new ResourceNotFoundException("Drone not found"));
        
        if (!drone.getOwnerId().equals(ownerId)) {
            throw new BadRequestException("You don't own this drone");
        }
        
        if (drone.getStatus() == DroneStatus.DELIVERING) {
            throw new BadRequestException("Cannot delete drone while delivering");
        }
        
        DroneRegistrationRequest request = DroneRegistrationRequest.builder()
                .restaurantId(drone.getRestaurantId())
                .ownerId(ownerId)
                .requestType(RequestType.DELETE_DRONE)
                .status(RequestStatus.PENDING)
                .droneId(droneId)
                .reason(reason)
                .build();
        
        return requestRepository.save(request);
    }
    
    @Override
    public List<DroneRegistrationRequest> getMyRequests(String restaurantId) {
        return requestRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
    }
    
    // ========== ADMIN APIs ==========
    
    @Override
    public List<DroneRegistrationRequest> getPendingRequests() {
        return requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING);
    }
    
    @Override
    @Transactional
    public DroneRegistrationRequest approveRequest(Long requestId, String adminId) {
        DroneRegistrationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request already processed");
        }
        
        if (request.getRequestType() == RequestType.REGISTER_NEW) {
            // Tạo drone mới
            Drone newDrone = Drone.builder()
                    .restaurantId(request.getRestaurantId())
                    .ownerId(request.getOwnerId())
                    .name(request.getDroneName())
                    .status(DroneStatus.IDLE)
                    .batteryPercent(100.0)
                    .homeLat(request.getHomeLat())
                    .homeLng(request.getHomeLng())
                    .currentLat(request.getHomeLat())
                    .currentLng(request.getHomeLng())
                    .maxPayloadKg(request.getMaxPayloadKg())
                    .maxSpeedKmh(request.getMaxSpeedKmh())
                    .isActive(true)
                    .build();
            
            droneRepository.save(newDrone);
            log.info("Admin {} approved drone registration for restaurant {}", adminId, request.getRestaurantId());
            
        } else if (request.getRequestType() == RequestType.DELETE_DRONE) {
            // Xóa drone
            Drone drone = droneRepository.findById(request.getDroneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Drone not found"));
            
            drone.setIsActive(false);
            droneRepository.save(drone);
            log.info("Admin {} approved drone deletion: {}", adminId, request.getDroneId());
        }
        
        request.setStatus(RequestStatus.APPROVED);
        request.setAdminId(adminId);
        request.setProcessedAt(LocalDateTime.now());
        
        return requestRepository.save(request);
    }
    
    @Override
    @Transactional
    public DroneRegistrationRequest rejectRequest(Long requestId, String adminId, String adminNote) {
        DroneRegistrationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request already processed");
        }
        
        request.setStatus(RequestStatus.REJECTED);
        request.setAdminId(adminId);
        request.setAdminNote(adminNote);
        request.setProcessedAt(LocalDateTime.now());
        
        log.info("Admin {} rejected request {}: {}", adminId, requestId, adminNote);
        
        return requestRepository.save(request);
    }
    
    @Override
    public List<Drone> getAllDrones() {
        return droneRepository.findAll();
    }
    
    // ========== INTERNAL APIs ==========
    
    @Override
    @Transactional
    public Drone assignOrder(AssignOrderRequestDto dto) {
        Drone drone = droneRepository.findById(dto.getDroneId())
                .orElseThrow(() -> new ResourceNotFoundException("Drone not found"));
        
        if (drone.getStatus() != DroneStatus.IDLE) {
            throw new BadRequestException("Drone is not available");
        }
        
        // Tính khoảng cách
        double distance = GpsUtil.calculateDistance(
                drone.getCurrentLat(), drone.getCurrentLng(),
                dto.getDestinationLat(), dto.getDestinationLng()
        );
        
        if (distance > maxDistanceKm) {
            throw new BadRequestException("Distance exceeds maximum delivery range: " + distance + " km");
        }
        
        // Kiểm tra pin
        if (!GpsUtil.hasSufficientBattery(drone.getBatteryPercent(), distance, batteryConsumptionPerKm)) {
            throw new BadRequestException("Insufficient battery for this delivery");
        }
        
        // Tính ETA
        int eta = GpsUtil.calculateETA(distance, speedKmh);
        
        // Cập nhật drone
        drone.setStatus(DroneStatus.DELIVERING);
        drone.setCurrentOrderId(dto.getOrderId());
        droneRepository.save(drone);
        
        // Tạo delivery log
        DeliveryLog deliveryLog = DeliveryLog.builder()
                .orderId(dto.getOrderId())
                .drone(drone)
                .destinationLat(dto.getDestinationLat())
                .destinationLng(dto.getDestinationLng())
                .destinationAddress(dto.getDestinationAddress())
                .estimatedDistanceKm(distance)
                .estimatedDurationMinutes(eta)
                .status(DeliveryStatus.PREPARING)
                .routePath(new ArrayList<>())
                .build();
        
        deliveryLogRepository.save(deliveryLog);
        
        log.info("Assigned order {} to drone {}, distance: {} km, ETA: {} minutes",
                dto.getOrderId(), drone.getId(), distance, eta);
        
        return drone;
    }
    
    @Override
    @Transactional
    public void updateDroneGps(DroneGpsUpdateDto dto) {
        Drone drone = droneRepository.findById(dto.getDroneId())
                .orElseThrow(() -> new ResourceNotFoundException("Drone not found"));
        
        drone.setCurrentLat(dto.getLat());
        drone.setCurrentLng(dto.getLng());
        
        if (dto.getBatteryPercent() != null) {
            drone.setBatteryPercent(dto.getBatteryPercent());
        }
        
        droneRepository.save(drone);
        
        // Nếu drone đang giao hàng, lưu vào delivery log
        if (drone.getCurrentOrderId() != null) {
            DeliveryLog deliveryLog = deliveryLogRepository.findByOrderId(drone.getCurrentOrderId())
                    .orElse(null);
            
            if (deliveryLog != null) {
                GpsPoint point = GpsPoint.builder()
                        .lat(dto.getLat())
                        .lng(dto.getLng())
                        .timestamp(LocalDateTime.now())
                        .batteryPercent(dto.getBatteryPercent())
                        .speedKmh(dto.getSpeedKmh())
                        .build();
                
                deliveryLog.getRoutePath().add(point);
                
                if (deliveryLog.getStatus() == DeliveryStatus.PREPARING) {
                    deliveryLog.setStatus(DeliveryStatus.IN_FLIGHT);
                    deliveryLog.setStartTime(LocalDateTime.now());
                }
                
                deliveryLogRepository.save(deliveryLog);
            }
        }
    }
    
    @Override
    @Transactional
    public void markDroneArrived(Long droneId) {
        Drone drone = droneRepository.findById(droneId)
                .orElseThrow(() -> new ResourceNotFoundException("Drone not found"));
        
        if (drone.getCurrentOrderId() == null) {
            throw new BadRequestException("Drone is not delivering any order");
        }
        
        DeliveryLog deliveryLog = deliveryLogRepository.findByOrderId(drone.getCurrentOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Delivery log not found"));
        
        deliveryLog.setStatus(DeliveryStatus.ARRIVED);
        deliveryLog.setArrivalTime(LocalDateTime.now());
        deliveryLogRepository.save(deliveryLog);
        
        // ⭐️ THÊM: Publish event để order-service cập nhật order status thành DELIVERED
        try {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("orderId", drone.getCurrentOrderId());
            eventData.put("droneId", droneId);
            eventData.put("event", "DRONE_ARRIVED");
            eventData.put("timestamp", LocalDateTime.now().toString());
            
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(eventData);
            redisTemplate.convertAndSend("drone.events", json);
            log.info("✅ Published DRONE_ARRIVED event for order {}", drone.getCurrentOrderId());
        } catch (Exception e) {
            log.error("Failed to publish drone arrived event", e);
        }
        
        log.info("Drone {} arrived at destination for order {}", droneId, drone.getCurrentOrderId());
    }
    
    @Override
    @Transactional
    public void completeDelivery(Long droneId, Long orderId) {
        Drone drone = droneRepository.findById(droneId)
                .orElseThrow(() -> new ResourceNotFoundException("Drone not found"));
        
        DeliveryLog deliveryLog = deliveryLogRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery log not found"));
        
        // Tính khoảng cách thực tế đã bay
        double actualDistance = 0.0;
        List<GpsPoint> routePath = deliveryLog.getRoutePath();
        for (int i = 1; i < routePath.size(); i++) {
            GpsPoint prev = routePath.get(i - 1);
            GpsPoint curr = routePath.get(i);
            actualDistance += GpsUtil.calculateDistance(prev.getLat(), prev.getLng(), curr.getLat(), curr.getLng());
        }
        
        double batteryConsumed = GpsUtil.calculateBatteryConsumption(actualDistance, batteryConsumptionPerKm);
        
        deliveryLog.setActualDistanceKm(actualDistance);
        deliveryLog.setBatteryConsumedPercent(batteryConsumed);
        deliveryLog.setStatus(DeliveryStatus.COMPLETED);
        deliveryLog.setEndTime(LocalDateTime.now());
        deliveryLogRepository.save(deliveryLog);
        
        // ⭐️ CẬP NHẬT: Drone tự động quay về IDLE sau khi giao xong
        // (Thay vì RETURNING, ta giả định drone bay về ngay và sẵn sàng nhận đơn mới)
        drone.setStatus(DroneStatus.IDLE);
        drone.setCurrentOrderId(null);
        drone.setTotalDeliveries(drone.getTotalDeliveries() + 1);
        
        // Giảm pin sau khi giao hàng
        double newBattery = Math.max(0, drone.getBatteryPercent() - batteryConsumed);
        drone.setBatteryPercent(newBattery);
        
        droneRepository.save(drone);
        
        // Publish event lên Redis để order-service nhận
        publishDeliveryCompletedEvent(orderId);
        
        log.info("✅ Delivery completed for order {}, drone {} returned to IDLE. Battery: {}% → {}%",
                orderId, droneId, drone.getBatteryPercent() + batteryConsumed, newBattery);
    }
    
    @Override
    @Transactional
    public void markDroneReturnedToBase(Long droneId) {
        Drone drone = droneRepository.findById(droneId)
                .orElseThrow(() -> new ResourceNotFoundException("Drone not found"));
        
        if (drone.getStatus() != DroneStatus.RETURNING) {
            throw new BadRequestException("Drone is not in RETURNING status");
        }
        
        // Reset drone về trạng thái IDLE (sẵn sàng nhận đơn mới)
        drone.setStatus(DroneStatus.IDLE);
        drone.setCurrentOrderId(null);
        droneRepository.save(drone);
        
        log.info("✅ Drone {} returned to base and is now IDLE", droneId);
    }
    
    @Override
    public DeliveryLog getDeliveryLogByOrderId(Long orderId) {
        return deliveryLogRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery log not found"));
    }
    
    // ========== PRIVATE METHODS ==========
    
    private void publishDeliveryCompletedEvent(Long orderId) {
        try {
            String message = String.format("{\"eventType\":\"DeliveryCompleted\",\"orderId\":%d}", orderId);
            redisTemplate.convertAndSend("delivery.events", message);
            log.info("Published delivery completed event for order {}", orderId);
        } catch (Exception e) {
            log.error("Failed to publish delivery completed event", e);
        }
    }
}
