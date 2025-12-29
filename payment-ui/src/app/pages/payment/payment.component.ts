import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { PaymentApiService, Payment } from '../../api/payment-api.service';
import { AccountApiService, Account } from '../../api/account-api.service';
import { ToastService } from '../../api/ui/toast/toast.service';
import { ToastsComponent } from '../../api/ui/toast/toasts.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastsComponent],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentComponent {
  // form fields (ngModel is fine with OnPush)
  fromAccountId = '11111111-1111-1111-1111-111111111111';
  toAccountId = '22222222-2222-2222-2222-222222222222';
  amount = 10;

  idempotencyKey = `ui-${crypto.randomUUID?.() ?? Date.now()}`;
  correlationId = `cid-${Date.now()}`;

  // Observable UI state
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  private readonly paymentSubject = new BehaviorSubject<Payment | null>(null);
  payment$ = this.paymentSubject.asObservable();

  private readonly responseCorrelationIdSubject = new BehaviorSubject<string | null>(null);
  responseCorrelationId$ = this.responseCorrelationIdSubject.asObservable();

  private readonly fromAccountSubject = new BehaviorSubject<Account | null>(null);
  fromAccount$ = this.fromAccountSubject.asObservable();

  private readonly toAccountSubject = new BehaviorSubject<Account | null>(null);
  toAccount$ = this.toAccountSubject.asObservable();

  private readonly recentPaymentsSubject = new BehaviorSubject<Payment[]>([]);
  recentPayments$ = this.recentPaymentsSubject.asObservable();

  private readonly historyLoadingSubject = new BehaviorSubject<boolean>(false);
  historyLoading$ = this.historyLoadingSubject.asObservable();

  private readonly creatingDemoAccountsSubject = new BehaviorSubject<boolean>(false);
  creatingDemoAccounts$ = this.creatingDemoAccountsSubject.asObservable();

  constructor(
    private paymentApi: PaymentApiService,
    private accountApi: AccountApiService,
    private toast: ToastService
  ) {
    this.refreshBalances();
    this.loadRecentPayments();
  }

  submitPayment() {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.paymentSubject.next(null);
    this.responseCorrelationIdSubject.next(null);

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
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: (resp) => {
          const payment = resp.body ?? null;
          this.paymentSubject.next(payment);
          this.responseCorrelationIdSubject.next(resp.headers.get('X-Correlation-Id'));

          if (payment?.status === 'COMPLETED') {
            this.toast.success(`Payment completed ✅  ID: ${payment.id}`);
          } else {
            this.toast.error(`Payment status: ${payment?.status ?? 'UNKNOWN'}`);
          }

          this.refreshBalances();
          this.loadRecentPayments();
        },
        error: (e: HttpErrorResponse) => {
          const msg = this.humanizeHttpError(e, 'Payment failed');
          this.errorSubject.next(msg);
          this.toast.error(msg);
        },
      });
  }

  refreshBalances() {
    this.accountApi.getAccount(this.fromAccountId).subscribe({
      next: (a) => this.fromAccountSubject.next(a),
      error: (e: HttpErrorResponse) => {
        const msg = this.humanizeHttpError(e, 'Failed to load sender account');
        this.errorSubject.next(msg);
        this.toast.error(msg);
      },
    });

    this.accountApi.getAccount(this.toAccountId).subscribe({
      next: (a) => this.toAccountSubject.next(a),
      error: (e: HttpErrorResponse) => {
        const msg = this.humanizeHttpError(e, 'Failed to load receiver account');
        this.errorSubject.next(msg);
        this.toast.error(msg);
      },
    });
  }

  loadRecentPayments() {
    this.historyLoadingSubject.next(true);
    this.paymentApi.getRecentPayments()
      .pipe(finalize(() => this.historyLoadingSubject.next(false)))
      .subscribe({
        next: (list) => this.recentPaymentsSubject.next(list),
        error: (e: HttpErrorResponse) => {
          const msg = this.humanizeHttpError(e, 'Failed to load payment history');
          this.errorSubject.next(msg);
          this.toast.error(msg);
        },
      });
  }

  createDemoAccounts() {
    this.creatingDemoAccountsSubject.next(true);
    this.errorSubject.next(null);

    const senderId = this.fromAccountId;
    const receiverId = this.toAccountId;

    this.accountApi.createAccount(senderId, 1000).subscribe({
      next: () => {
        this.accountApi.createAccount(receiverId, 100).subscribe({
          next: () => {
            this.creatingDemoAccountsSubject.next(false);
            this.toast.success('Demo accounts ready ✅');
            this.refreshBalances();
          },
          error: (e: HttpErrorResponse) => {
            this.creatingDemoAccountsSubject.next(false);
            const msg = this.humanizeHttpError(e, 'Failed to create receiver account');
            this.errorSubject.next(msg);
            this.toast.error(msg);
          },
        });
      },
      error: (e: HttpErrorResponse) => {
        this.creatingDemoAccountsSubject.next(false);
        const msg = this.humanizeHttpError(e, 'Failed to create sender account');
        this.errorSubject.next(msg);
        this.toast.error(msg);
      },
    });
  }

  newIdempotencyKey() {
    this.idempotencyKey = `ui-${crypto.randomUUID?.() ?? Date.now()}`;
  }

  newCorrelationId() {
    this.correlationId = `cid-${Date.now()}`;
  }

  private humanizeHttpError(err: HttpErrorResponse, prefix: string): string {
    const status = err?.status;
    const body =
      typeof err?.error === 'string'
        ? err.error
        : err?.error
        ? JSON.stringify(err.error)
        : '';
    const msg = err?.message ?? 'Unknown error';
    return `${prefix}. status=${status}. ${msg}${body ? `, body=${body}` : ''}`;
  }
}
