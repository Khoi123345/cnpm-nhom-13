package com.programming.orderservice.repositories;

import com.programming.orderservice.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Set;

public interface OrderRepository extends JpaRepository<Order, Long> {
}