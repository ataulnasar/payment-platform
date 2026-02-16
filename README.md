# 💳 Payment Platform (Mini-Swish)

A **bank-grade, full-stack payment platform** inspired by Swish-style retail payments, built to demonstrate **microservices architecture, OAuth2/JWT security, idempotent payment processing, and modern Angular frontend practices**.

This project focuses on **financial correctness, security, and scalability**, rather than simple CRUD functionality.

---
## 👨‍💻 For Clients

This project demonstrates how I design and build production-ready backend systems with:

- Clean architecture
- Secure authentication
- Scalable APIs
- Dockerized deployment
- Database migrations

I can build similar systems tailored to your product needs.

---

## 🎯 Why this project

This application is intentionally designed around **real-world banking and fintech concerns**, such as:

- Preventing duplicate payments
- Stateless authentication across microservices
- Secure frontend → backend communication
- Clear service boundaries
- Observability and traceability

It mirrors patterns used in **Swedish banking environments** (e.g. Swedbank / Swish integrations), while remaining fully runnable locally.

---

## 🏗️ Architecture Overview

### High-level system architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Angular UI                           │
│  - OAuth2 Authorization Code + PKCE                       │
│  - JWT stored in memory                                   │
│  - OnPush + RxJS async pipe                               │
└───────────────┬──────────────────────────────────────────┘
                │ Authorization: Bearer <JWT>
                ▼
┌──────────────────────────────────────────────────────────┐
│                    Payment Service                        │
│  - Spring Boot 3                                          │
│  - OAuth2 Resource Server                                 │
│  - Idempotent payment processing                          │
│  - Correlation ID propagation                             │
└───────────────┬──────────────────────────────────────────┘
                │ Authorization: Bearer <JWT>
                ▼
┌──────────────────────────────────────────────────────────┐
│                    Account Service                        │
│  - Spring Boot 3                                          │
│  - OAuth2 Resource Server                                 │
│  - Balance validation                                     │
│  - Debit / credit logic                                   │
└───────────────┬──────────────────────────────────────────┘
                │
                ▼
        ┌────────────────────┐
        │   PostgreSQL DB     │
        └────────────────────┘
```

---

## 🔐 Authentication & Security

- **OAuth2 / OpenID Connect** using **Keycloak**
- Authorization Code Flow + PKCE (Angular)
- JWT-based stateless authentication
- Spring Boot OAuth2 Resource Server
- CORS & preflight support
- Auth-aware frontend (login / logout)

---

## 💰 Payment Processing & Idempotency

Payments are **not naturally idempotent**, so explicit safeguards are implemented.

### Idempotency guarantees
- Client sends `Idempotency-Key`
- Server processes the request **once**
- Repeated requests with the same key return the **same result**
- Prevents double charging due to retries or double clicks

---

## ▶️ Running the Application Locally

### Prerequisites
- Java 17+
- Node.js 18+
- Docker & Docker Compose

### Start infrastructure
```bash
cd infra
docker compose up -d
```

Keycloak Admin Console:
- http://localhost:8080/admin
- admin / admin

### Start backend services
```bash
cd account-service && ./mvnw spring-boot:run
cd payment-service && ./mvnw spring-boot:run
```

### Start Angular UI
```bash
cd payment-ui
npm install
ng serve
```

Open http://localhost:4200

---

## 🎬 Demo Script

1. Login via Keycloak
2. Create demo accounts
3. Submit payment with idempotency key
4. Retry same request safely
5. View payment history

---
