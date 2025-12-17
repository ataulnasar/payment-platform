package com.example.paymentservice.service;

import com.example.paymentservice.api.dto.MoneyRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AccountClient {

    private final RestClient restClient;

    public AccountClient(@Value("${account-service.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public void debit(MoneyRequest req) {
        restClient.method(HttpMethod.POST)
                .uri("/accounts/debit")
                .body(req)
                .retrieve()
                .toBodilessEntity();
    }

    public void credit(MoneyRequest req) {
        restClient.method(HttpMethod.POST)
                .uri("/accounts/credit")
                .body(req)
                .retrieve()
                .toBodilessEntity();
    }
}
