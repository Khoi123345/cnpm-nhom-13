package com.programming.droneservice.config;

import com.programming.droneservice.listener.DroneEventListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
public class RedisConfig {
    
    @Bean
    public RedisMessageListenerContainer container(
            RedisConnectionFactory connectionFactory,
            DroneEventListener droneEventListener
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        
        // ⭐️ Lắng nghe channel "drone.events"
        container.addMessageListener(droneEventListener, new PatternTopic("drone.events"));
        
        return container;
    }
}
