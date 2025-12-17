package com.example.accountservice.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    private UUID id;

    @Column(nullable = false)
    private BigDecimal balance;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Account() {}

    public Account(UUID id, BigDecimal balance) {
        this.id = id;
        this.balance = balance;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public BigDecimal getBalance() { return balance; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
        this.updatedAt = Instant.now();
    }
}
