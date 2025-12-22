import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type PaymentStatus = 'CREATED' | 'COMPLETED' | 'FAILED';

export interface CreatePaymentRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface Payment {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private base = environment.paymentApiBase;

  constructor(private http: HttpClient) {}

  createPayment(
    req: CreatePaymentRequest,
    idempotencyKey: string,
    correlationId?: string
  ): Observable<HttpResponse<Payment>> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    });

    if (correlationId && correlationId.trim().length > 0) {
      headers = headers.set('X-Correlation-Id', correlationId);
    }

    // observe: 'response' to read response headers (X-Correlation-Id)
    return this.http.post<Payment>(`${this.base}/payments`, req, {
      headers,
      observe: 'response',
    });
  }
}
