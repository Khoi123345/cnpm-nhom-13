package com.programming.droneservice.controller;

import com.programming.droneservice.dto.DroneGpsUpdateDto;
import com.programming.droneservice.service.DroneService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket Controller để nhận GPS updates từ drone
 * và broadcast lên topic cho client subscribe
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class DroneWebSocketController {
    
    private final DroneService droneService;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * Nhận GPS update từ drone
     * Endpoint: /app/drone/update
     * 
     * Drone gửi: { droneId, lat, lng, batteryPercent, speedKmh }
     */
    @MessageMapping("/drone/update")
    public void handleDroneGpsUpdate(@Payload DroneGpsUpdateDto dto) {
        try {
            log.debug("Received GPS update from drone {}: lat={}, lng={}, battery={}%",
                    dto.getDroneId(), dto.getLat(), dto.getLng(), dto.getBatteryPercent());
            
            // Lưu vào database
            droneService.updateDroneGps(dto);
            
            // Lấy orderId để biết gửi lên topic nào
            // (Giả sử drone đang giao đơn hàng, ta cần query orderId)
            // Để đơn giản, broadcast lên topic chung của drone
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("droneId", dto.getDroneId());
            payload.put("lat", dto.getLat());
            payload.put("lng", dto.getLng());
            payload.put("batteryPercent", dto.getBatteryPercent());
            payload.put("speedKmh", dto.getSpeedKmh());
            payload.put("timestamp", System.currentTimeMillis());
            
            // Broadcast lên topic /topic/drone/{droneId}
            messagingTemplate.convertAndSend("/topic/drone/" + dto.getDroneId(), payload);
            
            log.debug("Broadcasted GPS update to /topic/drone/{}", dto.getDroneId());
            
        } catch (Exception e) {
            log.error("Error handling GPS update from drone {}: {}", dto.getDroneId(), e.getMessage());
        }
    }
    
    /**
     * Drone báo đã đến nơi
     * Endpoint: /app/drone/arrived
     */
    @MessageMapping("/drone/arrived")
    public void handleDroneArrived(@Payload Map<String, Object> payload) {
        try {
            Long droneId = Long.valueOf(payload.get("droneId").toString());
            
            droneService.markDroneArrived(droneId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ARRIVED");
            response.put("droneId", droneId);
            response.put("message", "Drone has arrived at destination");
            
            messagingTemplate.convertAndSend("/topic/drone/" + droneId, response);
            
            log.info("Drone {} marked as arrived", droneId);
            
        } catch (Exception e) {
            log.error("Error handling drone arrived event: {}", e.getMessage());
        }
    }
    
    /**
     * Hoàn thành giao hàng
     * Endpoint: /app/drone/delivered
     */
    @MessageMapping("/drone/delivered")
    public void handleDeliveryCompleted(@Payload Map<String, Object> payload) {
        try {
            Long droneId = Long.valueOf(payload.get("droneId").toString());
            Long orderId = Long.valueOf(payload.get("orderId").toString());
            
            droneService.completeDelivery(droneId, orderId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "COMPLETED");
            response.put("droneId", droneId);
            response.put("orderId", orderId);
            response.put("message", "Delivery completed successfully");
            
            messagingTemplate.convertAndSend("/topic/drone/" + droneId, response);
            messagingTemplate.convertAndSend("/topic/order/" + orderId, response);
            
            log.info("Delivery completed: droneId={}, orderId={}", droneId, orderId);
            
        } catch (Exception e) {
            log.error("Error handling delivery completed event: {}", e.getMessage());
        }
    }
}
