package com.nhom13.paymentservice.service;

import com.nhom13.paymentservice.model.Payment;
import com.nhom13.paymentservice.repositories.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Payment createPayment(Long userId, Double amount, String currency) {
        Payment p = new Payment();
        p.setUserId(userId);
        p.setAmount(amount);
        p.setCurrency(currency);
        p.setStatus("COMPLETED");
        p.setCreatedAt(Instant.now());
        return paymentRepository.save(p);
    }

    public Payment createPendingPayment(Long userId, Double amount, String currency) {
        Payment p = new Payment();
        p.setUserId(userId);
        p.setAmount(amount);
        p.setCurrency(currency);
        p.setStatus("PENDING");
        p.setCreatedAt(Instant.now());
        return paymentRepository.save(p);
    }

    public Payment createPendingPaymentWithOrder(Long userId, Long orderId, Double amount, String currency) {
        Payment p = new Payment();
        p.setUserId(userId);
        p.setOrderId(orderId);
        p.setAmount(amount);
        p.setCurrency(currency);
        p.setStatus("PENDING");
        p.setCreatedAt(Instant.now());
        return paymentRepository.save(p);
    }

    public Payment findById(Long id) {
        Optional<Payment> opt = paymentRepository.findById(id);
        return opt.orElse(null);
    }

    public List<Payment> findAll() {
        return paymentRepository.findAll();
    }

    public List<Payment> findByUserId(Long userId) {
        return paymentRepository.findByUserId(userId);
    }

    public void updateStatus(Long id, String status) {
        System.out.println("📌 updateStatus called: paymentId=" + id + ", status=" + status);
        Optional<Payment> opt = paymentRepository.findById(id);
        if (opt.isPresent()) {
            Payment p = opt.get();
            p.setStatus(status);
            paymentRepository.save(p);
            System.out.println("💾 Payment " + id + " saved with status: " + status);
            
            // ⭐️ Nếu payment thành công và có orderId, cập nhật order
            if ("COMPLETED".equals(status) && p.getOrderId() != null) {
                System.out.println("🚀 Payment COMPLETED! Calling updateOrderPaymentStatus for orderId: " + p.getOrderId());
                updateOrderPaymentStatus(p.getOrderId(), "PAID");
            }
        } else {
            System.out.println("⚠️ Payment not found: " + id);
        }
    }

    public void setProviderInfo(Long id, String provider, String providerPaymentId) {
        Optional<Payment> opt = paymentRepository.findById(id);
        if (opt.isPresent()) {
            Payment p = opt.get();
            p.setProvider(provider);
            p.setProviderPaymentId(providerPaymentId);
            paymentRepository.save(p);
        }
    }

    public Payment findByProviderPaymentId(String providerPaymentId) {
        return paymentRepository.findByProviderPaymentId(providerPaymentId);
    }

    /**
     * ⭐️ Gọi Order Service để cập nhật payment status
     */
    private void updateOrderPaymentStatus(Long orderId, String paymentStatus) {
        try {
            String orderServiceUrl = "http://order-service:8082/order/" + orderId + "/payment-status";
            
            Map<String, String> request = new HashMap<>();
            request.put("paymentStatus", paymentStatus);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);
            
            restTemplate.exchange(orderServiceUrl, HttpMethod.PUT, entity, String.class);
            
            System.out.println("✅ Updated order " + orderId + " payment status to " + paymentStatus);
        } catch (Exception e) {
            System.err.println("❌ Failed to update order payment status: " + e.getMessage());
        }
    }
}
