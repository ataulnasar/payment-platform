import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
