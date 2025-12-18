package com.example.paymentservice.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "idempotency_records",
        uniqueConstraints = @UniqueConstraint(name = "uk_idempotency_key", columnNames = "idempotencyKey")
)
public class IdempotencyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String idempotencyKey;

    @Column(nullable = false)
    private String requestHash;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = true)
    private java.util.UUID paymentId;

    protected IdempotencyRecord() {}

    public IdempotencyRecord(String idempotencyKey, String requestHash) {
        this.idempotencyKey = idempotencyKey;
        this.requestHash = requestHash;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getRequestHash() { return requestHash; }
    public Instant getCreatedAt() { return createdAt; }
    public java.util.UUID getPaymentId() { return paymentId; }

    public void setPaymentId(java.util.UUID paymentId) {
        this.paymentId = paymentId;
    }
}
