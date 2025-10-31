package com.programming.orderservice.repositories;

import com.programming.orderservice.modals.Order;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Set;

public interface OrderRepository extends MongoRepository<Order,String> {

    Set<Order> findByUserIdOrderByIdDesc(String userId);


}