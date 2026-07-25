import { Injectable, computed, signal } from '@angular/core';
import { INITIAL_CASH_USD } from '../core/constants/portfolio.constants';
import { MAX_LEDGER } from '../core/constants/market.constants';
import { createId } from '../domain/math/id-factory';
import {
  computeNetWorth,
} from '../domain/portfolio/margin';
import type {
  BalanceLedgerEntry,
  Order,
  Position,
} from '../models/trading.types';

@Injectable({ providedIn: 'root' })
export class PortfolioStore {
  readonly cashUsd = signal(INITIAL_CASH_USD);
  readonly positions = signal<Position[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly balanceHistory = signal<BalanceLedgerEntry[]>([]);

  readonly openPositions = computed(() =>
    this.positions().filter((p) => p.status === 'open'),
  );

  readonly openOrders = computed(() =>
    this.orders().filter((o) => o.status === 'open'),
  );

  readonly totalUnrealizedPnl = computed(() =>
    this.openPositions().reduce((sum, p) => sum + p.unrealizedPnl, 0),
  );

  readonly netWorth = computed(() =>
    computeNetWorth(this.cashUsd(), this.openPositions()),
  );

  seedLedger(now: number): void {
    const entry: BalanceLedgerEntry = {
      id: createId('led'),
      time: now,
      kind: 'depositSeed',
      deltaUsd: INITIAL_CASH_USD,
      balanceAfter: INITIAL_CASH_USD,
      noteRu: 'Стартовый депозит',
      noteEn: 'Initial deposit',
    };
    this.balanceHistory.set([entry]);
  }

  resetPortfolio(now: number): void {
    this.cashUsd.set(INITIAL_CASH_USD);
    this.positions.set([]);
    this.orders.set([]);
    this.seedLedger(now);
    this.pushLedger({
      time: now,
      kind: 'reset',
      deltaUsd: 0,
      balanceAfter: INITIAL_CASH_USD,
      noteRu: 'Полный сброс симуляции',
      noteEn: 'Full simulation reset',
    });
  }

  pushLedger(
    partial: Omit<BalanceLedgerEntry, 'id'>,
  ): void {
    const entry: BalanceLedgerEntry = {
      id: createId('led'),
      ...partial,
    };
    this.balanceHistory.update((list) => [entry, ...list].slice(0, MAX_LEDGER));
  }

  upsertOrder(order: Order): void {
    this.orders.update((list) => {
      const idx = list.findIndex((o) => o.id === order.id);
      if (idx === -1) {
        return [order, ...list];
      }
      const next = [...list];
      next[idx] = order;
      return next;
    });
  }

  upsertPosition(position: Position): void {
    this.positions.update((list) => {
      const idx = list.findIndex((p) => p.id === position.id);
      if (idx === -1) {
        return [position, ...list];
      }
      const next = [...list];
      next[idx] = position;
      return next;
    });
  }

  replacePositions(positions: Position[]): void {
    this.positions.set(positions);
  }
}
