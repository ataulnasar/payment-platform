package com.example.accountservice.repo;

import com.example.accountservice.domain.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {}
