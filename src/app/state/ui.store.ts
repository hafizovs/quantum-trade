import { Injectable, signal } from '@angular/core';
import {
  TOAST_MAX_VISIBLE,
  TOAST_TTL_DANGER_MS,
  TOAST_TTL_INFO_MS,
  TOAST_TTL_SUCCESS_MS,
  TOAST_TTL_WARNING_MS,
} from '../core/constants/ui.constants';
import type { LocaleId } from '../core/models/locale.model';
import type { ThemeId } from '../core/models/theme.model';
import { createId } from '../domain/math/id-factory';
import type { ToastItem, ToastKind } from '../models/trading.types';

export type PositionsTab = 'positions' | 'orders' | 'history';
export type RightPaneTab = 'news' | 'tape';

@Injectable({ providedIn: 'root' })
export class UiStore {
  readonly theme = signal<ThemeId>('dark');
  readonly locale = signal<LocaleId>('ru');
  readonly helpOpen = signal(false);
  readonly positionsTab = signal<PositionsTab>('positions');
  readonly rightPaneTab = signal<RightPaneTab>('news');
  readonly toastQueue = signal<ToastItem[]>([]);
  readonly orderType = signal<'market' | 'limit'>('market');
  readonly notionalUsd = signal(1000);
  readonly leverage = signal(5);
  readonly limitPrice = signal<number | null>(null);
  readonly lastTradeError = signal<string | null>(null);
  readonly draftLimitFromBook = signal<number | null>(null);

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  toggleLocale(): void {
    this.locale.update((l) => (l === 'ru' ? 'en' : 'ru'));
  }

  setHelpOpen(open: boolean): void {
    this.helpOpen.set(open);
  }

  toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }

  setPositionsTab(tab: PositionsTab): void {
    this.positionsTab.set(tab);
  }

  setRightPaneTab(tab: RightPaneTab): void {
    this.rightPaneTab.set(tab);
  }

  toggleOrderType(): void {
    this.orderType.update((t) => (t === 'market' ? 'limit' : 'market'));
  }

  bumpLeverage(delta: number): void {
    this.leverage.update((v) => Math.min(20, Math.max(1, v + delta)));
  }

  setLimitPriceFromBook(price: number): void {
    this.limitPrice.set(price);
    this.draftLimitFromBook.set(price);
    this.orderType.set('limit');
  }

  pushToast(
    kind: ToastKind,
    messageKey: string,
    params?: Record<string, string | number>,
    ttlMs?: number,
  ): void {
    const ttl =
      ttlMs ??
      (kind === 'danger'
        ? TOAST_TTL_DANGER_MS
        : kind === 'warning'
          ? TOAST_TTL_WARNING_MS
          : kind === 'success'
            ? TOAST_TTL_SUCCESS_MS
            : TOAST_TTL_INFO_MS);

    const item: ToastItem = {
      id: createId('toast'),
      kind,
      messageKey,
      params,
      createdAt: Date.now(),
      ttlMs: ttl,
    };

    this.toastQueue.update((q) => [item, ...q].slice(0, TOAST_MAX_VISIBLE));
  }

  dismissToast(id: string): void {
    this.toastQueue.update((q) => q.filter((t) => t.id !== id));
  }

  clearToasts(): void {
    this.toastQueue.set([]);
  }
}
