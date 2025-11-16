package com.nhom13.paymentservice.repositories;

import com.nhom13.paymentservice.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserId(Long userId);
    Payment findByProviderPaymentId(String providerPaymentId);
}
