import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // ensure HttpParams imported
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Account {
  id: string;
  balance: number;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private base = environment.accountApiBase;

  constructor(private http: HttpClient) {}

  getAccount(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.base}/accounts/${id}`);
  }

  createAccount(accountId: string, initialBalance: number): Observable<Account> {
    const params = new HttpParams()
      .set('accountId', accountId)
      .set('initialBalance', String(initialBalance));

    return this.http.post<Account>(`${this.base}/accounts/create`, null, { params });
  }
}
