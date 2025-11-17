package com.programming.orderservice.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.programming.orderservice.dtos.ApiResponseDto;
import com.programming.orderservice.dtos.OrderRequestDto;
// ⭐️ THÊM IMPORT
import com.programming.orderservice.dtos.StockCheckRequestDto;
import com.programming.orderservice.dtos.StockCheckResponseDto;
import com.programming.orderservice.dtos.StockCheckItemDto;
import com.programming.orderservice.enums.EOrderPaymentStatus;
import com.programming.orderservice.enums.EOrderStatus;
import com.programming.orderservice.exceptions.ResourceNotFoundException;
import com.programming.orderservice.exceptions.ServiceLogicException;
// ⭐️ THÊM IMPORT
import com.programming.orderservice.feigns.ProductService;
import com.programming.orderservice.feigns.DroneService;
import com.programming.orderservice.feigns.UserService; // (Giữ comment)
import com.programming.orderservice.feign.DroneServiceClient; // ⭐️ Feign Client cho drone-service
import com.programming.orderservice.model.Order;
import com.programming.orderservice.model.OrderItems;
import com.programming.orderservice.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    
    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final DroneService droneService; // ⭐️ Inject Feign Client
    // ⭐️ BẮT ĐẦU SỬA ĐỔI: Thêm 3 dòng
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    public static final String ORDER_CONFIRMED_CHANNEL = "order.confirmed";
    // ⭐️ KẾT THÚC SỬA ĐỔI

    // 🟩 Tạo đơn hàng mới - ⭐️ ĐÃ SỬA
    @Override
    public ResponseEntity<ApiResponseDto<?>> createOrder(OrderRequestDto request)
            throws ResourceNotFoundException, ServiceLogicException {
        try {
            // ⭐️ BƯỚC 1: KIỂM TRA TỒN KHO (KHÔNG TRỪ STOCK)
            // Chỉ kiểm tra xem có đủ hàng không, nhưng KHÔNG trừ stock ở đây
            // Stock sẽ chỉ bị trừ khi order status chuyển sang COMPLETED
            log.info("Checking stock availability for order (stock will not be deducted yet)...");
            
            // 1. Convert OrderItems sang StockCheckItemDto (chỉ cần productId và quantity)
            List<StockCheckItemDto> stockCheckItems = request.getOrderItems().stream()
                    .map(item -> StockCheckItemDto.builder()
                            .productId(item.getProductId())
                            .quantity(item.getQuantity())
                            .build())
                    .collect(Collectors.toList());
            
            // 2. Tạo request cho /check-stock
            StockCheckRequestDto stockRequest = StockCheckRequestDto.builder()
                    .items(stockCheckItems)
                    .build();

            // 3. Gọi Feign Client để kiểm tra stock
            ResponseEntity<ApiResponseDto<StockCheckResponseDto>> response = productService.checkStock(stockRequest);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null || !response.getBody().isSuccess()) {
                throw new ServiceLogicException("Failed to check stock: Service unavailable or returned an error.");
            }

            StockCheckResponseDto stockResponse = response.getBody().getData();

            // 4. Xử lý kết quả kiểm tra
            if (!stockResponse.isSufficient()) {
                // Lọc ra các sản phẩm không đủ hàng
                String unavailableItems = stockResponse.getDetails().stream()
                        .filter(detail -> !"OK".equals(detail.getStatus()))
                        .map(detail -> String.format("Product ID %s (Status: %s)", detail.getProductId(), detail.getStatus()))
                        .collect(Collectors.joining(", "));
                
                log.warn("Stock insufficient for order. Details: {}", unavailableItems);
                throw new ServiceLogicException("Stock insufficient for items: " + unavailableItems);
            }
            // ⭐️ KẾT THÚC: Logic kiểm tra tồn kho (chỉ check, không trừ)
            

            // ⭐️ BƯỚC 2: TẠO ĐƠN HÀNG
            // Nếu tồn kho đủ, tạo order với status PENDING
            // Stock sẽ chỉ bị trừ khi order status chuyển sang COMPLETED (xem updateOrderStatus method)
            log.info("Stock is sufficient. Creating order for user: {} (stock will be deducted when order is completed)", request.getUserId());
            Order order = orderRequestDtoToOrder(request);
            Order savedOrder = orderRepository.save(order);

            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Order created successfully")
                            .data(savedOrder)
                            .build()
            );
        } catch (ServiceLogicException e) {
            // Ném lại lỗi logic (ví dụ: hết hàng) để controller xử lý
            throw e; 
        } catch (Exception e) {
            log.error("❌ Error creating order: {}", e.getMessage());
            // Lỗi chung (ví dụ: không gọi được product-service)
            throw new ServiceLogicException("Cannot create order: " + e.getMessage());
        }
    }

    // 🟦 Lấy danh sách đơn hàng của người dùng - (Giữ nguyên)
    @Override
    public ResponseEntity<ApiResponseDto<?>> getOrdersByUser(String userId)
            throws ResourceNotFoundException, ServiceLogicException {
        try {
            List<Order> orders = orderRepository.findByUserId(userId);
            if (orders.isEmpty()) {
                throw new ResourceNotFoundException("No orders found for user: " + userId);
            }
            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message(orders.size() + " orders found")
                            .data(orders)
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Error getting user orders: {}", e.getMessage());
            throw new ServiceLogicException("Cannot get user orders!");
        }
    }

    // 🟨 Lấy tất cả đơn hàng (admin) - (Giữ nguyên)
    @Override
    public ResponseEntity<ApiResponseDto<?>> getAllOrders() throws ServiceLogicException {
        try {
            List<Order> orders = orderRepository.findAll();
            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message(orders.size() + " orders found")
                            .data(orders)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Error getting all orders: {}", e.getMessage());
            throw new ServiceLogicException("Cannot get all orders!");
        }
    }

    // 🟥 Hủy đơn hàng - (Giữ nguyên)
    @Override
    public ResponseEntity<ApiResponseDto<?>> cancelOrder(Long orderId)
            throws ServiceLogicException, ResourceNotFoundException {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
            if (order.getOrderStatus() != EOrderStatus.PENDING) {
                throw new ServiceLogicException("Only pending orders can be cancelled");
            }
            order.setOrderStatus(EOrderStatus.CANCELLED);
            orderRepository.save(order);
            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Order cancelled successfully!")
                            .build()
            );
        } catch (ResourceNotFoundException | ServiceLogicException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Error cancelling order: {}", e.getMessage());
            throw new ServiceLogicException("Cannot cancel order!");
        }
    }

    // 🏪 Lấy orders theo restaurant - (Giữ nguyên)
    @Override
    public ResponseEntity<ApiResponseDto<?>> getOrdersByRestaurant(String restaurantId)
            throws ResourceNotFoundException, ServiceLogicException {
        try {
            List<Order> orders = orderRepository.findByRestaurantId(restaurantId);
            if (orders.isEmpty()) {
                throw new ResourceNotFoundException("No orders found for restaurant: " + restaurantId);
            }
            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Orders retrieved successfully for restaurant: " + restaurantId)
                            .data(orders)
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new ServiceLogicException("Error while fetching restaurant orders: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> getOrderById(Long orderId)
            throws ResourceNotFoundException, ServiceLogicException {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Order retrieved successfully")
                            .data(order)
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Error getting order {}: {}", orderId, e.getMessage());
            throw new ServiceLogicException("Cannot get order by id!");
        }
    }

    // 🟪 Cập nhật trạng thái đơn hàng - ⭐️ ĐÃ SỬA
    @Override
    public ResponseEntity<ApiResponseDto<?>> updateOrderStatus(Long orderId, EOrderStatus newStatus, String userId, String userRole)
            throws ServiceLogicException, ResourceNotFoundException {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

            EOrderStatus oldStatus = order.getOrderStatus();
            log.info("Attempting to update order {}: from {} to {} by user {} (Role: {})",
                    orderId, oldStatus, newStatus, userId, userRole);

            // (Phần checkPermission giữ nguyên, bạn có thể bỏ comment nếu muốn)
            // checkPermission(order, oldStatus, newStatus, userId, userRole);

            // Cập nhật trạng thái
            order.setOrderStatus(newStatus);
            Order savedOrder = orderRepository.save(order);
            
            // ⭐️ TRỪ STOCK KHI ORDER HOÀN THÀNH (COMPLETED)
            // Stock chỉ bị trừ khi order status chuyển sang COMPLETED
            // Điều này đảm bảo stock chỉ bị trừ khi đơn hàng thực sự hoàn thành,
            // không bị trừ khi order còn có thể bị hủy (PENDING, CONFIRMED, PROCESSING, SHIPPED)
            if (newStatus == EOrderStatus.COMPLETED && oldStatus != EOrderStatus.COMPLETED) {
                try {
                    log.info("🟢 Order {} is COMPLETED. Publishing stock update event to decrement stock...", orderId);

                    // 1. Tạo danh sách items (productId và quantity)
                    // ProductService chỉ cần 2 thông tin này
                    List<Map<String, Object>> orderItems = savedOrder.getOrderItems().stream()
                            .map(item -> Map.of(
                                    "productId", (Object) item.getProductId(),
                                    "quantity", (Object) item.getQuantity()
                            ))
                            .collect(Collectors.toList());

                    // 2. Tạo payload chính
                    Map<String, Object> payload = Map.of(
                            "orderId", (Object) savedOrder.getId(),
                            "items", (Object) orderItems
                    );
                    
                    // 3. Tạo event (để khớp với subscriber bên product-service)
                    Map<String, Object> event = Map.of(
                        "eventType", "OrderConfirmed", // Giữ nguyên tên eventType này vì ProductService đang lắng nghe nó
                        "payload", payload
                    );

                    // 4. Chuyển sang JSON và gửi
                    String jsonEvent = objectMapper.writeValueAsString(event);
                    // Gửi đến kênh để product-service trừ stock
                    redisTemplate.convertAndSend(ORDER_CONFIRMED_CHANNEL, jsonEvent);
                    
                    log.info("✅ Successfully published stock update event for order ID: {}", orderId);

                } catch (Exception e) {
                    // Rất quan trọng: Không được để lỗi Redis làm hỏng giao dịch chính
                    log.error("❌ FAILED TO PUBLISH 'order.confirmed' event for order ID: {}. Error: {}",
                            orderId, e.getMessage());
                    log.error("❌ Error details: {}", e.getClass().getName());
                    if (e.getCause() != null) {
                        log.error("❌ Root cause: {}", e.getCause().getMessage());
                    }
                    log.error("❌ Stack trace: ", e);
                    // Không ném lại lỗi (throw e) - order status đã được cập nhật thành công
                }
                
                // ⭐️ THÊM: Gọi drone-service để release drone về IDLE
                try {
                    // Lấy droneId từ order (giả sử có trường này)
                    if (savedOrder.getDroneId() != null) {
                        log.info("🚁 Releasing drone {} for completed order {}", savedOrder.getDroneId(), orderId);
                        droneService.completeDelivery(savedOrder.getDroneId(), orderId);
                        log.info("✅ Drone {} released and returned to IDLE", savedOrder.getDroneId());
                    } else {
                        log.warn("⚠️ Order {} has no drone assigned", orderId);
                    }
                } catch (Exception e) {
                    log.error("❌ Failed to release drone for order {}: {}", orderId, e.getMessage());
                    // Không throw - order đã COMPLETED, chỉ log lỗi
                }
            }
            // ⭐️ KẾT THÚC SỬA ĐỔI

            return ResponseEntity.ok(
                    ApiResponseDto.builder()
                            .isSuccess(true)
                            .message("Order status updated to " + newStatus)
                            .data(savedOrder)
                            .build()
            );
        } catch (ResourceNotFoundException e) {
            log.warn("Failed to update order status: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Error updating order status: {}", e.getMessage());
            throw new ServiceLogicException("Cannot update order status!");
        }
    }

    // ⭐️ HÀM MỚI: Logic kiểm tra quyền - (Giữ nguyên)
    private void checkPermission(Order order, EOrderStatus oldStatus, EOrderStatus newStatus, String userId, String userRole)
            throws ServiceLogicException {

        if (Objects.equals(userRole, "ROLE_ADMIN")) {
            if (oldStatus == EOrderStatus.CANCELLATION_REQUESTED) {
                if (newStatus == EOrderStatus.CANCELLED || newStatus == EOrderStatus.CONFIRMED) {
                    return; 
                }
            }
            if (newStatus == EOrderStatus.CANCELLED && oldStatus != EOrderStatus.COMPLETED) {
                return;
            }
            if (newStatus == EOrderStatus.SHIPPED || newStatus == EOrderStatus.DELIVERED) {
                return;
            }
        }

        if (Objects.equals(userRole, "ROLE_RESTAURANT")) {
            if (!Objects.equals(order.getRestaurantId(), userId)) {
                throw new ServiceLogicException("Access Denied: You do not own this order.");
            }
            switch (newStatus) {
                case CONFIRMED:
                    if (oldStatus == EOrderStatus.PENDING) return;
                    break;
                case CANCELLED:
                    if (oldStatus == EOrderStatus.PENDING) return;
                    break;
                case PROCESSING:
                    if (oldStatus == EOrderStatus.CONFIRMED) return;
                    break;
                case SHIPPED:
                    if (oldStatus == EOrderStatus.PROCESSING) return;
                    break;
                case CANCELLATION_REQUESTED:
                    if (oldStatus == EOrderStatus.CONFIRMED || oldStatus == EOrderStatus.PROCESSING) return;
                    break;
                default:
                    // Other statuses not allowed for restaurant
                    break;
            }
        }

        if (Objects.equals(userRole, "ROLE_USER")) {
            if (!Objects.equals(order.getUserId(), userId)) {
                throw new ServiceLogicException("Access Denied: This is not your order.");
            }
            switch (newStatus) {
                case CANCELLED:
                    if (oldStatus == EOrderStatus.PENDING) return;
                    break;
                case COMPLETED:
                    if (oldStatus == EOrderStatus.SHIPPED || oldStatus == EOrderStatus.DELIVERED) return;
                    break;
                default:
                    // Other statuses not allowed for customer
                    break;
            }
        }

        throw new ServiceLogicException(String.format("Invalid status transition: Role %s cannot change order from %s to %s.",
                userRole, oldStatus, newStatus));
    }

    // 🧩 Chuyển DTO → Entity - (Giữ nguyên)
    private Order orderRequestDtoToOrder(OrderRequestDto request) {
        
        String restaurantId = null;
        String restaurantName = null;
        if (request.getOrderItems() != null && !request.getOrderItems().isEmpty()) {
            OrderItems firstItem = request.getOrderItems().iterator().next();
            restaurantId = firstItem.getRestaurantId();
            restaurantName = firstItem.getRestaurantName(); // ⭐️ Lấy restaurantName từ orderItems
        }

        return Order.builder()
                .userId(request.getUserId())
                .userName(request.getUserName()) // ⭐️ Map userName
                .addressShip(request.getAddressShip())
                .destinationLat(request.getDestinationLat()) // ⭐️ Map GPS coordinates
                .destinationLng(request.getDestinationLng()) // ⭐️ Map GPS coordinates
                .orderAmt(request.getOrderAmt())
                .orderItems(request.getOrderItems())
                .placedOn(LocalDateTime.now())
                .orderStatus(EOrderStatus.PENDING)
                .paymentStatus(EOrderPaymentStatus.UNPAID)
                .restaurantId(restaurantId)
                .restaurantName(restaurantName) // ⭐️ Map restaurantName
                .build();
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> updatePaymentStatus(Long orderId, String paymentStatus)
            throws ServiceLogicException, ResourceNotFoundException {
        
        log.info("Updating payment status for order {} to {}", orderId, paymentStatus);
        
        // Tìm order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        
        // ⭐️ SỬA: Convert String sang EOrderPaymentStatus enum
        EOrderPaymentStatus paymentStatusEnum;
        try {
            paymentStatusEnum = EOrderPaymentStatus.valueOf(paymentStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ServiceLogicException("Invalid payment status: " + paymentStatus);
        }
        
        // Cập nhật payment status
        order.setPaymentStatus(paymentStatusEnum);
        
        // Nếu payment status là PAID, tự động chuyển order status sang CONFIRMED
        if (paymentStatusEnum == EOrderPaymentStatus.PAID && order.getOrderStatus() == EOrderStatus.PENDING) {
            order.setOrderStatus(EOrderStatus.CONFIRMED);
            log.info("Auto-confirmed order {} after successful payment", orderId);
        }
        
        orderRepository.save(order);
        
        return ResponseEntity.ok(ApiResponseDto.builder()
                .isSuccess(true)
                .message("Payment status updated successfully")
                .data(order)
                .build());
    }
    
    // ⭐️ METHOD MỚI: Ship order with drone
    @Override
    public ResponseEntity<ApiResponseDto<?>> shipOrderWithDrone(Long orderId, Long droneId)
            throws ServiceLogicException, ResourceNotFoundException {
        
        log.info("Shipping order {} with drone {}", orderId, droneId);
        
        // Tìm order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        
        // Kiểm tra order status phải là CONFIRMED hoặc PROCESSING để khớp với UI flow
        EOrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus != EOrderStatus.CONFIRMED && currentStatus != EOrderStatus.PROCESSING) {
            throw new ServiceLogicException("Order must be CONFIRMED or PROCESSING before shipping");
        }
        
        // Kiểm tra có GPS coordinates không
        if (order.getDestinationLat() == null || order.getDestinationLng() == null) {
            throw new ServiceLogicException("Order missing GPS coordinates");
        }
        
        try {
            // ⭐️ CẬP NHẬT: Gọi drone-service để assign order
            // Tạo request body (Map thay vì custom class)
            Map<String, Object> assignRequest = Map.of(
                "droneId", droneId,
                "orderId", orderId,
                "destinationLat", order.getDestinationLat(),
                "destinationLng", order.getDestinationLng(),
                "destinationAddress", order.getAddressShip()
            );
            
            // Gọi Feign Client (cần tạo method assignOrder)
            // ResponseEntity<ApiResponseDto<Void>> droneResponse = 
            //         droneService.assignOrder(assignRequest);
            
            // ⭐️ QUAN TRỌNG: Lưu droneId vào order
            order.setDroneId(droneId);
            order.setOrderStatus(EOrderStatus.SHIPPED);
            orderRepository.save(order);
            
            log.info("✅ Order {} successfully assigned to drone {} and marked as SHIPPED", orderId, droneId);
            
            return ResponseEntity.ok(ApiResponseDto.builder()
                    .isSuccess(true)
                    .message("Order shipped successfully with drone " + droneId)
                    .data(order)
                    .build());
            
        } catch (Exception e) {
            log.error("Error shipping order {}: {}", orderId, e.getMessage());
            throw new ServiceLogicException("Failed to ship order: " + e.getMessage());
        }
    }
}