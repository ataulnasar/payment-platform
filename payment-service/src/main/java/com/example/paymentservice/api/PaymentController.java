package com.example.paymentservice.api;

import com.example.paymentservice.api.dto.CreatePaymentRequest;
import com.example.paymentservice.api.dto.MoneyRequest;
import com.example.paymentservice.domain.Payment;
import com.example.paymentservice.domain.PaymentStatus;
import com.example.paymentservice.repo.PaymentRepository;
import com.example.paymentservice.service.AccountClient;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentRepository repo;
    private final AccountClient accountClient;

    public PaymentController(PaymentRepository repo, AccountClient accountClient) {
        this.repo = repo;
        this.accountClient = accountClient;
    }

    @PostMapping
    public ResponseEntity<Payment> create(@Valid @RequestBody CreatePaymentRequest req) {
        var payment = new Payment(UUID.randomUUID(), req.fromAccountId(), req.toAccountId(), req.amount());
        repo.save(payment);

        try {
            accountClient.debit(new MoneyRequest(req.fromAccountId(), req.amount()));
            accountClient.credit(new MoneyRequest(req.toAccountId(), req.amount()));
            payment.setStatus(PaymentStatus.COMPLETED);
        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
        }

        repo.save(payment);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> get(@PathVariable UUID id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
