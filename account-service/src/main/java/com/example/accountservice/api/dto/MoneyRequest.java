package com.example.accountservice.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;

public record MoneyRequest(
        @NotNull UUID accountId,
        @NotNull @Positive BigDecimal amount
) {}
