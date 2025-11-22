package com.programming.droneservice.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.programming.droneservice.model.Drone;
import com.programming.droneservice.model.DroneStatus;
import com.programming.droneservice.service.DroneService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DroneEventListener implements MessageListener {
    private final DroneService droneService;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String messageBody = new String(message.getBody());
            log.info("📡 Drone received event: {}", messageBody);

            Map<String, Object> eventData = objectMapper.readValue(messageBody, Map.class);
            String eventType = (String) eventData.get("eventType");

            // ⭐️ LẮNG NGHE: DroneReturnToBase - Drone bay về nhà hàng
            if ("DroneReturnToBase".equals(eventType)) {
                Long droneId = Long.parseLong(eventData.get("droneId").toString());
                Long orderId = Long.parseLong(eventData.get("orderId").toString());

                log.info("🏠 Drone {} is returning to base for order {}", droneId, orderId);

                // ⭐️ CẬP NHẬT DRONE: DELIVERING → IDLE
                // Giả lập drone bay về mất 10 giây
                Thread.sleep(10000);

                droneService.markDroneReturnedToBase(droneId);
                log.info("✅ Drone {} is now IDLE and ready for next delivery", droneId);
            }
        } catch (Exception e) {
            log.error("❌ Error processing drone event: {}", e.getMessage());
        }
    }
}