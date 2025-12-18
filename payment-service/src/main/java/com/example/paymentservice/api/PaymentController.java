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
    private final IdempotencyService idempotencyService;

    public PaymentController(PaymentRepository repo, IdempotencyService idempotencyService) {
        this.repo = repo;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader(name = "Idempotency-Key", required = true) String idempotencyKey,
            @Valid @RequestBody CreatePaymentRequest req
    ) {
        if (idempotencyKey.isBlank() || idempotencyKey.length() > 128) {
            return ResponseEntity.badRequest().body("INVALID_IDEMPOTENCY_KEY");
        }

        try {
            var paymentId = idempotencyService.getOrCreatePaymentId(idempotencyKey, req);
            var payment = idempotencyService.fetchPayment(paymentId);
            return ResponseEntity.ok(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> get(@PathVariable UUID id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
