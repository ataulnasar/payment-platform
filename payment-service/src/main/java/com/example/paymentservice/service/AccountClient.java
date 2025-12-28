package com.example.paymentservice.service;

import com.example.paymentservice.api.dto.MoneyRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class AccountClient {

    private final RestClient restClient;

    public AccountClient(@Value("${account-service.base-url}") String baseUrl) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();

        JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(httpClient);
        rf.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(rf)
                .build();
    }

    public void debit(MoneyRequest req) {
        restClient.post()
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
