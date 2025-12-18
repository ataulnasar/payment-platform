package com.example.paymentservice.service;

import com.example.paymentservice.api.dto.CreatePaymentRequest;
import com.example.paymentservice.api.dto.MoneyRequest;
import com.example.paymentservice.domain.Payment;
import com.example.paymentservice.domain.PaymentStatus;
import com.example.paymentservice.repo.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PaymentOrchestrator {

    private final PaymentRepository paymentRepository;
    private final AccountClient accountClient;

    public PaymentOrchestrator(PaymentRepository paymentRepository, AccountClient accountClient) {
        this.paymentRepository = paymentRepository;
        this.accountClient = accountClient;
    }

    @Transactional
    public Payment createAndExecute(CreatePaymentRequest req) {
        Payment payment = new Payment(UUID.randomUUID(), req.fromAccountId(), req.toAccountId(), req.amount());
        paymentRepository.save(payment);

        try {
            accountClient.debit(new MoneyRequest(req.fromAccountId(), req.amount()));
            accountClient.credit(new MoneyRequest(req.toAccountId(), req.amount()));
            payment.setStatus(PaymentStatus.COMPLETED);
        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
        }

        return paymentRepository.save(payment);
    }
}
