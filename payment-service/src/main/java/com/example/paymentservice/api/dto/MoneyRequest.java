package com.example.paymentservice.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MoneyRequest(UUID accountId, BigDecimal amount) {}
