package com.programming.droneservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration cho real-time GPS tracking
 * 
 * FLOW:
 * 1. Drone (simulator) kết nối WebSocket và gửi GPS updates lên /app/drone/update
 * 2. Server nhận và broadcast lên /topic/order/{orderId}
 * 3. Customer/Restaurant subscribe /topic/order/{orderId} để nhận updates
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kênh broadcast công khai (client subscribe)
        config.enableSimpleBroker("/topic");
        
        // Prefix cho tin nhắn từ client gửi lên server
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint để client kết nối WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow all origins (including Node.js simulator)
                .withSockJS(); // Fallback cho browser không hỗ trợ WebSocket
    }
}
