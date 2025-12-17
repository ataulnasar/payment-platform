package com.example.accountservice.api;

import com.example.accountservice.api.dto.MoneyRequest;
import com.example.accountservice.domain.Account;
import com.example.accountservice.repo.AccountRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/accounts")
public class AccountController {

    private final AccountRepository repo;

    public AccountController(AccountRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/create")
    public ResponseEntity<Account> create(@RequestParam UUID accountId, @RequestParam BigDecimal initialBalance) {
        var acc = new Account(accountId, initialBalance);
        return ResponseEntity.ok(repo.save(acc));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> get(@PathVariable UUID id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/debit")
    public ResponseEntity<?> debit(@Valid @RequestBody MoneyRequest req) {
        var acc = repo.findById(req.accountId()).orElse(null);
        if (acc == null) return ResponseEntity.notFound().build();

        if (acc.getBalance().compareTo(req.amount()) < 0) {
            return ResponseEntity.badRequest().body("INSUFFICIENT_FUNDS");
        }

        acc.setBalance(acc.getBalance().subtract(req.amount()));
        repo.save(acc);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/credit")
    public ResponseEntity<?> credit(@Valid @RequestBody MoneyRequest req) {
        var acc = repo.findById(req.accountId()).orElse(null);
        if (acc == null) return ResponseEntity.notFound().build();

        acc.setBalance(acc.getBalance().add(req.amount()));
        repo.save(acc);
        return ResponseEntity.ok().build();
    }
}
