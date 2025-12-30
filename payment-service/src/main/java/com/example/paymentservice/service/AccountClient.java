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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;


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
        String authHeader = bearerToken();
        var reqSpec = restClient.post()
                .uri("/accounts/debit")
                .body(req);
        if (authHeader != null) {
            reqSpec = reqSpec.header("Authorization", authHeader);
        }

        reqSpec.retrieve().toBodilessEntity();
    }

    public void credit(MoneyRequest req) {
        String authHeader = bearerToken();
        var reqSpec = restClient.post()
                .uri("/accounts/credit")
                .body(req);
        if (authHeader != null) {
            reqSpec = reqSpec.header("Authorization", authHeader);
        }

        reqSpec.retrieve().toBodilessEntity();
    }

    private String bearerToken() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return "Bearer " + jwtAuth.getToken().getTokenValue();
        }
        return null;
    }
}
