import {
  MAINTENANCE_MARGIN_RATE,
} from '../../core/constants/portfolio.constants';
import { MIN_PRICE } from '../../core/constants/market.constants';
import type { PositionSide } from '../../core/models/position-side.model';

export function requiredMargin(notionalUsd: number, leverage: number): number {
  if (leverage <= 0) {
    return notionalUsd;
  }
  return notionalUsd / leverage;
}

export function positionNotional(qty: number, price: number): number {
  return qty * price;
}

export function positionMargin(
  qty: number,
  entry: number,
  leverage: number,
): number {
  return requiredMargin(positionNotional(qty, entry), leverage);
}

export function unrealizedPnl(
  side: PositionSide,
  entry: number,
  mark: number,
  qty: number,
): number {
  if (side === 'long') {
    return (mark - entry) * qty;
  }
  return (entry - mark) * qty;
}

export function liquidationPrice(
  side: PositionSide,
  entry: number,
  leverage: number,
  maintenanceRate: number = MAINTENANCE_MARGIN_RATE,
): number {
  let liq: number;
  if (side === 'long') {
    liq = entry * (1 - 1 / leverage + maintenanceRate);
  } else {
    liq = entry * (1 + 1 / leverage - maintenanceRate);
  }
  return Math.max(liq, MIN_PRICE);
}

export function shouldLiquidate(
  side: PositionSide,
  mark: number,
  liqPrice: number,
): boolean {
  if (side === 'long') {
    return mark <= liqPrice;
  }
  return mark >= liqPrice;
}

export function averageEntry(
  oldEntry: number,
  oldQty: number,
  fillPrice: number,
  fillQty: number,
): number {
  const total = oldQty + fillQty;
  if (total <= 0) {
    return fillPrice;
  }
  return (oldEntry * oldQty + fillPrice * fillQty) / total;
}

export function computeNetWorth(
  cashUsd: number,
  openPositions: Array<{ marginUsd: number; unrealizedPnl: number }>,
): number {
  let equity = cashUsd;
  for (const p of openPositions) {
    equity += p.marginUsd + p.unrealizedPnl;
  }
  return equity;
}
