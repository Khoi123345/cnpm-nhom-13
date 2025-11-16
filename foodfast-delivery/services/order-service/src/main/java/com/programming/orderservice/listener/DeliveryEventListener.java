package com.programming.orderservice.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.programming.orderservice.enums.EOrderStatus;
import com.programming.orderservice.model.Order;
import com.programming.orderservice.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * ⭐️ Lắng nghe Redis channel "delivery.events" từ drone-service
 * Khi drone giao hàng xong, cập nhật order status sang DELIVERED
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DeliveryEventListener implements MessageListener {

    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String messageBody = new String(message.getBody());
            log.info("📡 Received delivery event: {}", messageBody);

            // Parse JSON message
            Map<String, Object> eventData = objectMapper.readValue(messageBody, Map.class);
            String eventType = (String) eventData.get("eventType");

            if ("DeliveryCompleted".equals(eventType)) {
                Long orderId = ((Number) eventData.get("orderId")).longValue();
                log.info("🚁 Delivery completed for order: {}", orderId);

                // Cập nhật order status
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null) {
                    order.setOrderStatus(EOrderStatus.DELIVERED);
                    orderRepository.save(order);
                    log.info("✅ Order {} status updated to DELIVERED", orderId);
                } else {
                    log.warn("⚠️ Order {} not found in database", orderId);
                }
            }

        } catch (Exception e) {
            log.error("❌ Error processing delivery event: {}", e.getMessage(), e);
        }
    }
}
