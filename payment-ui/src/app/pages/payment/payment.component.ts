import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

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
  creatingDemoAccounts = false;

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
  private accountApi: AccountApiService,
  private cdr: ChangeDetectorRef
) {}

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
      .subscribe({
        next: (resp) => {
          console.log('Payment success', resp);
          this.loading = false;
          this.cdr.detectChanges(); // 👈 force UI update

          this.payment = resp.body ?? null;
          this.responseCorrelationId = resp.headers.get('X-Correlation-Id');

          this.refreshBalances();
          this.loadRecentPayments();
        },
          error: (e: HttpErrorResponse) => {
            this.loading = false;
            this.cdr.detectChanges(); // 👈 force UI update
            this.error = this.humanizeHttpError(e, 'Payment failed');
          }
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

    createDemoAccounts() {
      this.creatingDemoAccounts = true;
      this.error = null;

      const senderId = this.fromAccountId;
      const receiverId = this.toAccountId;

      // Create sender then receiver (simple sequence)
      this.accountApi.createAccount(senderId, 1000).subscribe({
        next: () => {
          this.accountApi.createAccount(receiverId, 100).subscribe({
            next: () => {
              this.creatingDemoAccounts = false;
              this.refreshBalances();
              this.loadRecentPayments();
            },
            error: (e: HttpErrorResponse) => {
              this.creatingDemoAccounts = false;
              this.error = this.humanizeHttpError(e, `Failed to create receiver account`);
            },
          });
        },
        error: (e: HttpErrorResponse) => {
          this.creatingDemoAccounts = false;
          this.error = this.humanizeHttpError(e, `Failed to create sender account`);
        },
      });
    }

  private humanizeHttpError(err: HttpErrorResponse, prefix: string): string {
    const status = err?.status;
    const body = typeof err?.error === 'string' ? err.error : JSON.stringify(err?.error ?? '');
    const msg = err?.message ?? 'Unknown error';
    return `${prefix}. status=${status}, message=${msg}, body=${body}`;
  }

}
