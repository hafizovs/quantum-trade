import { Injectable, inject } from '@angular/core';
import type { ToastKind } from './models/trading.types';
import { UiStore } from './ui/ui.store';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly ui = inject(UiStore);

  show(
    kind: ToastKind,
    messageKey: string,
    params?: Record<string, string | number>,
    ttlMs?: number,
  ): void {
    this.ui.pushToast(kind, messageKey, params, ttlMs);
  }

  dismiss(id: string): void {
    this.ui.dismissToast(id);
  }
}
