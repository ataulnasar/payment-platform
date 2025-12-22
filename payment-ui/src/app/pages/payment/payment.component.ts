import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PaymentApiService, Payment } from '../../api/payment-api.service';
import { AccountApiService, Account } from '../../api/account-api.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent {
  // demo defaults (your known UUIDs)
  fromAccountId = '11111111-1111-1111-1111-111111111111';
  toAccountId = '22222222-2222-2222-2222-222222222222';
  amount = 10;

  idempotencyKey = `ui-${crypto.randomUUID?.() ?? Date.now()}`;
  correlationId = `cid-${Date.now()}`;

  loading = false;
  error: string | null = null;

  payment: Payment | null = null;
  responseCorrelationId: string | null = null;

  fromAccount: Account | null = null;
  toAccount: Account | null = null;
  recentPayments: Payment[] = [];
  historyLoading = false;

  constructor(
    private paymentApi: PaymentApiService,
    private accountApi: AccountApiService
  ) {
    this.refreshBalances();
    this.loadRecentPayments();
  }

  refreshBalances() {
    this.error = null;
    this.accountApi.getAccount(this.fromAccountId).subscribe({
      next: (a) => (this.fromAccount = a),
      error: (e) => (this.error = `Failed to load sender account: ${e?.message ?? e}`),
    });

    this.accountApi.getAccount(this.toAccountId).subscribe({
      next: (a) => (this.toAccount = a),
      error: (e) => (this.error = `Failed to load receiver account: ${e?.message ?? e}`),
    });
  }

  submitPayment() {
    this.loading = true;
    this.error = null;
    this.payment = null;
    this.responseCorrelationId = null;

    this.paymentApi
      .createPayment(
        {
          fromAccountId: this.fromAccountId,
          toAccountId: this.toAccountId,
          amount: Number(this.amount),
        },
        this.idempotencyKey,
        this.correlationId
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (resp) => {
          this.payment = resp.body ?? null;
          this.responseCorrelationId = resp.headers.get('X-Correlation-Id');
          this.refreshBalances();
          this.loadRecentPayments();
        },
        error: (err) => {
          const msg =
            err?.error?.message ??
            (typeof err?.error === 'string' ? err.error : null) ??
            err?.message ??
            'Unknown error';
          this.error = `Payment failed: ${msg}`;
        },
      });
  }

  newIdempotencyKey() {
    this.idempotencyKey = `ui-${crypto.randomUUID?.() ?? Date.now()}`;
  }

  newCorrelationId() {
    this.correlationId = `cid-${Date.now()}`;
  }

  loadRecentPayments() {
    this.historyLoading = true;
    this.paymentApi
      .getRecentPayments()
      .pipe(finalize(() => (this.historyLoading = false)))
      .subscribe({
        next: (list) => (this.recentPayments = list),
        error: (e) =>
          (this.error = `Failed to load payment history: ${e?.message ?? e}`),
      });
  }
}
