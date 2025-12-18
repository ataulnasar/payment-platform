package com.example.paymentservice.service;

import com.example.paymentservice.api.dto.CreatePaymentRequest;
import com.example.paymentservice.domain.IdempotencyRecord;
import com.example.paymentservice.repo.IdempotencyRecordRepository;
import com.example.paymentservice.repo.PaymentRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class IdempotencyService {

    private final IdempotencyRecordRepository idempotencyRepo;
    private final PaymentRepository paymentRepo;
    private final PaymentOrchestrator orchestrator;

    public IdempotencyService(IdempotencyRecordRepository idempotencyRepo,
                              PaymentRepository paymentRepo,
                              PaymentOrchestrator orchestrator) {
        this.idempotencyRepo = idempotencyRepo;
        this.paymentRepo = paymentRepo;
        this.orchestrator = orchestrator;
    }

    @Transactional
    public UUID getOrCreatePaymentId(String key, CreatePaymentRequest req) {
        String requestHash = hash(req);

        // 1) Try existing
        Optional<IdempotencyRecord> existing = idempotencyRepo.findByIdempotencyKey(key);
        if (existing.isPresent()) {
            IdempotencyRecord rec = existing.get();
            if (!rec.getRequestHash().equals(requestHash)) {
                // Same key used with different payload -> reject
                throw new IllegalArgumentException("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST");
            }
            if (rec.getPaymentId() == null) {
                // Edge case: record exists but paymentId not set (very rare in our simple version)
                throw new IllegalStateException("IDEMPOTENCY_RECORD_INCOMPLETE");
            }
            return rec.getPaymentId();
        }

        // 2) Create record (race-safe)
        IdempotencyRecord record = new IdempotencyRecord(key, requestHash);
        try {
            record = idempotencyRepo.save(record);
        } catch (DataIntegrityViolationException e) {
            // Another request inserted it first
            IdempotencyRecord rec = idempotencyRepo.findByIdempotencyKey(key).orElseThrow();
            if (!rec.getRequestHash().equals(requestHash)) {
                throw new IllegalArgumentException("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST");
            }
            return rec.getPaymentId();
        }

        // 3) Execute payment ONCE and bind paymentId
        UUID paymentId = orchestrator.createAndExecute(req).getId();
        record.setPaymentId(paymentId);
        idempotencyRepo.save(record);
        return paymentId;
    }

    public com.example.paymentservice.domain.Payment fetchPayment(UUID paymentId) {
        return paymentRepo.findById(paymentId).orElseThrow();
    }

    private String hash(CreatePaymentRequest req) {
        // stable string: order matters
        String input = req.fromAccountId() + "|" + req.toAccountId() + "|" + req.amount();
        return RequestHash.sha256Base64(input);
    }
}
