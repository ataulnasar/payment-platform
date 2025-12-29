import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly subject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$: Observable<Toast[]> = this.subject.asObservable();

  constructor(private zone: NgZone) {}

  success(message: string) {
    this.push('success', message);
  }

  error(message: string) {
    this.push('error', message);
  }

  remove(id: string) {
    this.zone.run(() => {
      this.subject.next(this.subject.value.filter(t => t.id !== id));
    });
  }

  private push(type: ToastType, message: string) {
    this.zone.run(() => {
      const id = crypto.randomUUID?.() ?? String(Date.now());
      this.subject.next([{ id, type, message }, ...this.subject.value]);
      setTimeout(() => this.remove(id), 3500);
    });
  }
}
