package com.programming.orderservice.repositories;

import com.programming.orderservice.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByIdDesc(String userId);
}