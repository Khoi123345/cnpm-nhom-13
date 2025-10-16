package com.programming.orderservice.service;

import com.programming.orderservice.dto.OrderItemsDto;
import com.programming.orderservice.dto.OrderRequest;
import com.programming.orderservice.model.Order;
import com.programming.orderservice.model.OrderItems;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
public class OrderService {

    public void placeOrder(OrderRequest orderRequest) {
        Order newOrder = new Order();
        newOrder.setOrderNumber(UUID.randomUUID().toString());


        List<OrderItems> orderItemsList = orderRequest.getOrderItemsDtoList()
                .stream()
                .map(this::mapToEntity)
                .collect(Collectors.toList());

        newOrder.setOrderItemsList(orderItemsList);

    }

    private OrderItems mapToEntity(OrderItemsDto dto) {
        OrderItems item = new OrderItems();
        item.setName(dto.getName());
        item.setPrice(dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO);
        item.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 0);
        return item;
    }
}
