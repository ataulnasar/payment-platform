package com.example.paymentservice.repo;

import com.example.paymentservice.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findTop10ByOrderByCreatedAtDesc();
}
